import { open } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile, mkdir, exists } from "@tauri-apps/plugin-fs";
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
    new Uint8Array(contents).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  // Detect mime type from extension
  const extension = sourcePath.split(".").pop()?.toLowerCase() || "png";
  const mimeType = extension === "jpg" || extension === "jpeg"
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
  if (path.startsWith("asset://") || path.startsWith("https://asset.localhost")) {
    return path;
  }
  return convertFileSrc(path);
}
