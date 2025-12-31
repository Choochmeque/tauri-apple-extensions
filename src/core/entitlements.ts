import fs from "fs";
import path from "path";
import type { AppInfo } from "../types.js";

export function updateMainAppEntitlements(
  appleDir: string,
  appInfo: AppInfo,
): void {
  const targetName = `${appInfo.productName}_iOS`;
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
    entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`;
  }

  // Check if app groups already configured
  if (entitlements.includes("com.apple.security.application-groups")) {
    if (!entitlements.includes(appGroupId)) {
      // Add our group to existing array
      entitlements = entitlements.replace(
        /(<key>com\.apple\.security\.application-groups<\/key>\s*<array>)/,
        `$1\n        <string>${appGroupId}</string>`,
      );
    }
  } else {
    // Add app groups entitlement
    entitlements = entitlements.replace(
      /<dict>\s*<\/dict>/,
      `<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${appGroupId}</string>
    </array>
</dict>`,
    );
  }

  fs.writeFileSync(entitlementsPath, entitlements);
  console.log(`Updated main app entitlements: ${entitlementsPath}`);
}

export function createExtensionEntitlements(
  extensionDir: string,
  appGroupId: string,
): string {
  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${appGroupId}</string>
    </array>
</dict>
</plist>`;

  const entitlementsPath = path.join(
    extensionDir,
    `${path.basename(extensionDir)}.entitlements`,
  );
  fs.writeFileSync(entitlementsPath, entitlements);
  return entitlementsPath;
}
