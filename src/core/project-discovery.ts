import fs from "fs";
import path from "path";
import { parseYamlSimple } from "../utils/yaml-simple.js";
import type { AppInfo, TauriConfig, Platform } from "../types.js";

export function findProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, "tauri.conf.json")) ||
      fs.existsSync(path.join(dir, "src-tauri", "tauri.conf.json"))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

export function findTauriConfig(projectRoot: string): TauriConfig {
  const paths = [
    path.join(projectRoot, "src-tauri", "tauri.conf.json"),
    path.join(projectRoot, "tauri.conf.json"),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as TauriConfig;
    }
  }
  throw new Error("Could not find tauri.conf.json");
}

export function findAppleProjectDir(
  projectRoot: string,
  platform: Platform,
): string {
  // iOS uses 'apple', macOS uses 'apple-macos'
  const dirName = platform === "ios" ? "apple" : "apple-macos";
  const initHint =
    platform === "ios"
      ? "Run 'tauri ios init' first."
      : "Set up macOS Xcode project using @choochmeque/tauri-macos-xcode first.";

  const paths = [
    path.join(projectRoot, "src-tauri", "gen", dirName),
    path.join(projectRoot, "gen", dirName),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error(`Could not find ${platform} project directory. ${initHint}`);
}

export function getAppInfo(
  tauriConfig: TauriConfig,
  projectYml: string,
): AppInfo {
  const parsed = parseYamlSimple(projectYml);
  const productName =
    tauriConfig.productName || tauriConfig.package?.productName || "app";
  const bundleIdPrefix = parsed.bundleIdPrefix || "com.tauri";
  const identifier =
    tauriConfig.identifier || `${bundleIdPrefix}.${productName}`;
  const version = tauriConfig.version || "1.0.0";

  return {
    productName,
    bundleIdPrefix,
    identifier,
    version,
  };
}
