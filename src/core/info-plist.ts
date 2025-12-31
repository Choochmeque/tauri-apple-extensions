import fs from "fs";
import path from "path";
import type { AppInfo } from "../types.js";

export function addUrlSchemeToInfoPlist(
  appleDir: string,
  appInfo: AppInfo,
): void {
  const targetName = `${appInfo.productName}_iOS`;
  const infoPlistPath = path.join(appleDir, targetName, "Info.plist");
  const urlScheme = appInfo.productName.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!fs.existsSync(infoPlistPath)) {
    console.log(
      `Info.plist not found at ${infoPlistPath}, skipping URL scheme setup`,
    );
    return;
  }

  let infoPlist = fs.readFileSync(infoPlistPath, "utf8");

  // Check if URL schemes already configured
  if (infoPlist.includes("CFBundleURLSchemes")) {
    if (!infoPlist.includes(urlScheme)) {
      console.log(
        `URL scheme may need manual configuration. Add '${urlScheme}' to CFBundleURLSchemes.`,
      );
    }
    return;
  }

  // Add URL scheme - need to insert before closing </dict></plist>
  const urlSchemeEntry = `    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>${urlScheme}</string>
            </array>
            <key>CFBundleURLName</key>
            <string>${appInfo.identifier}</string>
        </dict>
    </array>
`;

  // Insert before the last </dict>
  infoPlist = infoPlist.replace(
    /(\s*)<\/dict>\s*<\/plist>/,
    `\n${urlSchemeEntry}$1</dict>\n</plist>`,
  );

  fs.writeFileSync(infoPlistPath, infoPlist);
  console.log(`Added URL scheme '${urlScheme}' to Info.plist`);
}
