import { open } from "@tauri-apps/plugin-dialog";
import {
  readFile,
  writeFile,
  mkdir,
  exists,
  remove,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

const IMAGES_DIR = "portraits";

async function ensureImagesDir(): Promise<string> {
  const appData = await appDataDir();
  const imagesPath = await join(appData, IMAGES_DIR);

  if (!(await exists(imagesPath))) {
    await mkdir(imagesPath, { recursive: true });
  }

  return imagesPath;
}

// Pick an image and return it as a data URL for cropping
export async function pickImageForCrop(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp"],
      },
    ],
  });

  if (!selected) {
    return null;
  }

  const sourcePath = selected as string;
  const contents = await readFile(sourcePath);

  // Convert to base64 data URL for display in the cropper
  const base64 = btoa(
    new Uint8Array(contents).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );

  // Detect mime type from extension
  const extension = sourcePath.split(".").pop()?.toLowerCase() || "png";
  const mimeType =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "gif"
        ? "image/gif"
        : extension === "webp"
          ? "image/webp"
          : "image/png";

  return `data:${mimeType};base64,${base64}`;
}

// Save a cropped image blob to the portraits directory
export async function saveCroppedImage(blob: Blob): Promise<string> {
  // Convert blob to Uint8Array
  const arrayBuffer = await blob.arrayBuffer();
  const contents = new Uint8Array(arrayBuffer);

  // Generate a unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `portrait_${timestamp}_${randomSuffix}.png`;

  // Ensure images directory exists and get the path
  const imagesDir = await ensureImagesDir();
  const destPath = await join(imagesDir, filename);

  // Write to app data directory
  await writeFile(destPath, contents);

  // Return the path that can be used in the app
  return convertFileSrc(destPath);
}

export async function pickAndSaveImage(): Promise<string | null> {
  // Open file picker for images
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp"],
      },
    ],
  });

  if (!selected) {
    return null;
  }

  const sourcePath = selected as string;

  // Read the source file
  const contents = await readFile(sourcePath);

  // Generate a unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = sourcePath.split(".").pop() || "png";
  const filename = `portrait_${timestamp}_${randomSuffix}.${extension}`;

  // Ensure images directory exists and get the path
  const imagesDir = await ensureImagesDir();
  const destPath = await join(imagesDir, filename);

  // Write to app data directory
  await writeFile(destPath, contents);

  // Return the path that can be used in the app
  // Convert to asset URL for display in webview
  return convertFileSrc(destPath);
}

export async function getImageAssetUrl(path: string): Promise<string> {
  // If it's already an asset URL, return as-is
  if (
    path.startsWith("asset://") ||
    path.startsWith("https://asset.localhost")
  ) {
    return path;
  }
  return convertFileSrc(path);
}

// Helper to convert an asset URL back to a file path
export function pathFromAssetUrl(url: string): string {
  // Check if it's an asset URL
  if (
    !url.startsWith("asset://") &&
    !url.startsWith("https://asset.localhost")
  ) {
    return url;
  }

  // Remove the protocol prefix
  // For https://asset.localhost/path/to/file or asset://localhost/path/to/file
  // We need to be careful about how Tauri formats it on different OSs

  let path = url;

  if (path.startsWith("https://asset.localhost")) {
    // Linux/macOS often use https://asset.localhost/<path>
    // Sometimes there might be a leading slash or not depending on the path
    path = path.replace("https://asset.localhost", "");
  } else if (path.startsWith("asset://localhost")) {
    path = path.replace("asset://localhost", "");
  } else if (path.startsWith("asset://")) {
    path = path.replace("asset://", "");
  }

  // Decode URI components (e.g. %20 -> space)
  return decodeURIComponent(path);
}

// Read an image file (from asset URL) and return as Base64 string
export async function readImageAsBase64(
  assetUrl: string,
): Promise<string | null> {
  try {
    const filePath = pathFromAssetUrl(assetUrl);

    // Check if file exists first to avoid error spam
    if (!(await exists(filePath))) {
      return null;
    }

    const contents = await readFile(filePath);

    // Convert to base64
    let binary = "";
    const len = contents.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(contents[i]);
    }
    const base64 = btoa(binary);

    // Determine mime type
    const ext = filePath.split(".").pop()?.toLowerCase() || "png";
    const mimeType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "gif"
          ? "image/gif"
          : ext === "webp"
            ? "image/webp"
            : "image/png";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to export image ${assetUrl}:`, error);
    return null;
  }
}

// Save a Base64 string as an image file and return the new asset URL
export async function saveBase64Image(base64Data: string): Promise<string> {
  // Parse base64 string
  // Format: data:image/png;base64,....
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data");
  }

  const mimeType = matches[1];
  const data = matches[2];

  // Convert base64 to Uint8Array
  const binaryString = atob(data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Determine extension from mime type
  const ext =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/gif"
        ? "gif"
        : mimeType === "image/webp"
          ? "webp"
          : "png";

  // Generate unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `imported_portrait_${timestamp}_${randomSuffix}.${ext}`;

  // Ensure directory exists
  const imagesDir = await ensureImagesDir();
  const destPath = await join(imagesDir, filename);

  // Write file
  await writeFile(destPath, bytes);

  // Return asset URL
  return convertFileSrc(destPath);
}

// Read an image file and return as ArrayBuffer
export async function readImageAsArrayBuffer(
  assetUrl: string,
): Promise<ArrayBuffer | null> {
  try {
    const filePath = pathFromAssetUrl(assetUrl);

    if (!(await exists(filePath))) {
      return null;
    }

    const contents = await readFile(filePath);
    return contents.buffer;
  } catch (error) {
    console.error(`Failed to read image ${assetUrl}:`, error);
    return null;
  }
}

// Save an ArrayBuffer as an image file and return the new asset URL
export async function saveImageFromBuffer(
  buffer: ArrayBuffer,
  filename: string,
): Promise<string> {
  const contents = new Uint8Array(buffer);

  // Ensure directory exists
  const imagesDir = await ensureImagesDir();

  // Clean filename just in case, though jszip names should be relative
  const safeFilename = filename.split("/").pop() || filename;
  const destPath = await join(imagesDir, safeFilename);

  // Write file
  await writeFile(destPath, contents);

  // Return asset URL
  return convertFileSrc(destPath);
}

// Delete an image file given its asset URL
export async function deleteImage(assetUrl: string): Promise<void> {
  try {
    const filePath = pathFromAssetUrl(assetUrl);

    if (await exists(filePath)) {
      await remove(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete image ${assetUrl}:`, error);
  }
}
