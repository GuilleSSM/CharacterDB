import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script synchronizes the version in package.json to:
// 1. src-tauri/tauri.conf.json
// 2. src-tauri/Cargo.toml

const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(rootDir, "src-tauri", "Cargo.toml");

try {
  // Read version from package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;

  console.log(`Syncing version ${version} to configuration files...`);

  // 1. Update tauri.conf.json
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
    tauriConf.version = version;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
    console.log("✓ Updated src-tauri/tauri.conf.json");
  }

  // 2. Update Cargo.toml
  if (fs.existsSync(cargoTomlPath)) {
    let cargoToml = fs.readFileSync(cargoTomlPath, "utf-8");
    // Matches version = "X.Y.Z" under [package]
    const versionRegex = /^version = ".*"$/m;
    if (versionRegex.test(cargoToml)) {
      cargoToml = cargoToml.replace(versionRegex, `version = "${version}"`);
      fs.writeFileSync(cargoTomlPath, cargoToml);
      console.log("✓ Updated src-tauri/Cargo.toml");
    } else {
      console.warn(
        "! Could not find version string in Cargo.toml [package] section",
      );
    }
  }

  console.log("Synchronization complete.");
} catch (error) {
  console.error("Error syncing versions:", error.message);
  process.exit(1);
}
