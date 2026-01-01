import fs from "fs";
import path from "path";
import type { AppInfo, Platform } from "../types.js";

export const EMPTY_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`;

export function addAppGroupToEntitlements(
  entitlements: string,
  appGroupId: string,
): string {
  // Check if app groups already configured
  if (entitlements.includes("com.apple.security.application-groups")) {
    if (!entitlements.includes(appGroupId)) {
      // Add our group to existing array
      return entitlements.replace(
        /(<key>com\.apple\.security\.application-groups<\/key>\s*<array>)/,
        `$1\n        <string>${appGroupId}</string>`,
      );
    }
    return entitlements;
  }

  // Add app groups entitlement
  return entitlements.replace(
    /<dict>\s*<\/dict>/,
    `<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${appGroupId}</string>
    </array>
</dict>`,
  );
}

export function createEntitlementsContent(
  platform: Platform,
  appGroupId?: string,
): string {
  const entries: string[] = [];

  // macOS extensions require app-sandbox to be registered
  if (platform === "macos") {
    entries.push(`    <key>com.apple.security.app-sandbox</key>
    <true/>`);
  }

  // App groups only if needed
  if (appGroupId) {
    entries.push(`    <key>com.apple.security.application-groups</key>
    <array>
        <string>${appGroupId}</string>
    </array>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${entries.join("\n")}
</dict>
</plist>`;
}

export function updateMainAppEntitlements(
  appleDir: string,
  appInfo: AppInfo,
  platform: Platform,
): void {
  const platformSuffix = platform === "ios" ? "iOS" : "macOS";
  const targetName = `${appInfo.productName}_${platformSuffix}`;
  const entitlementsPath = path.join(
    appleDir,
    targetName,
    `${targetName}.entitlements`,
  );
  const appGroupId = `group.${appInfo.identifier}`;

  let entitlements: string;
  if (fs.existsSync(entitlementsPath)) {
    entitlements = fs.readFileSync(entitlementsPath, "utf8");
  } else {
    entitlements = EMPTY_ENTITLEMENTS;
  }

  entitlements = addAppGroupToEntitlements(entitlements, appGroupId);

  fs.writeFileSync(entitlementsPath, entitlements);
  console.log(`Updated main app entitlements: ${entitlementsPath}`);
}

export function createExtensionEntitlements(
  extensionDir: string,
  appGroupId: string,
  platform: Platform,
): string {
  const entitlements = createEntitlementsContent(platform, appGroupId);
  const entitlementsPath = path.join(
    extensionDir,
    `${path.basename(extensionDir)}.entitlements`,
  );
  fs.writeFileSync(entitlementsPath, entitlements);
  return entitlementsPath;
}
