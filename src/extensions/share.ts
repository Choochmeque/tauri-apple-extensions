import fs from "fs";
import path from "path";
import {
  addExtensionTarget,
  addDependencyToTarget,
  addUrlSchemeToTarget,
} from "../core/project-yml.js";
import { createExtensionEntitlements } from "../core/entitlements.js";
import { copyTemplateFile } from "../utils/template.js";
import type { AppInfo, Extension, Platform } from "../types.js";

export const shareExtension: Extension = {
  type: "share",
  displayName: "Share Extension",
  extensionSuffix: "ShareExtension",
  extensionPointIdentifier: "com.apple.share-services",

  extensionName(appInfo: AppInfo): string {
    return `${appInfo.productName}-ShareExtension`;
  },

  createFiles(
    appleDir: string,
    appInfo: AppInfo,
    templatesDir: string,
    platform: Platform,
  ): void {
    const extensionDir = path.join(appleDir, "ShareExtension");
    const appGroupId = `group.${appInfo.identifier}`;
    const urlScheme = appInfo.productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    // Create directory
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }

    const variables = {
      APP_GROUP_IDENTIFIER: appGroupId,
      APP_URL_SCHEME: urlScheme,
      VERSION: appInfo.version,
      BUNDLE_IDENTIFIER: `${appInfo.identifier}.ShareExtension`,
      PRODUCT_NAME: appInfo.productName,
    };

    // Copy ShareViewController.swift
    const viewControllerSrc = path.join(
      templatesDir,
      "ShareViewController.swift",
    );
    if (fs.existsSync(viewControllerSrc)) {
      copyTemplateFile(
        viewControllerSrc,
        path.join(extensionDir, "ShareViewController.swift"),
        variables,
      );
    } else {
      throw new Error(`Template not found: ${viewControllerSrc}`);
    }

    // Copy Info.plist
    const possibleInfoPlists = [
      path.join(templatesDir, "Info.plist"),
      path.join(templatesDir, "ShareExtension-Info.plist"),
    ];

    let infoPlistFound = false;
    for (const src of possibleInfoPlists) {
      if (fs.existsSync(src)) {
        copyTemplateFile(src, path.join(extensionDir, "Info.plist"), variables);
        infoPlistFound = true;
        break;
      }
    }

    if (!infoPlistFound) {
      // Create a default Info.plist
      const defaultInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Share</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>CFBundleShortVersionString</key>
    <string>${appInfo.version}</string>
    <key>CFBundleVersion</key>
    <string>${appInfo.version}</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionActivationRule</key>
            <dict>
                <key>NSExtensionActivationSupportsFileWithMaxCount</key>
                <integer>10</integer>
                <key>NSExtensionActivationSupportsImageWithMaxCount</key>
                <integer>10</integer>
                <key>NSExtensionActivationSupportsMovieWithMaxCount</key>
                <integer>10</integer>
                <key>NSExtensionActivationSupportsText</key>
                <true/>
                <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                <integer>1</integer>
            </dict>
        </dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.share-services</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
    </dict>
</dict>
</plist>`;
      fs.writeFileSync(path.join(extensionDir, "Info.plist"), defaultInfoPlist);
    }

    // Create entitlements
    createExtensionEntitlements(extensionDir, appGroupId, platform);

    console.log(`Created ShareExtension files in ${extensionDir}`);
  },

  updateProjectYml(
    projectYml: string,
    appInfo: AppInfo,
    platform: Platform,
  ): string {
    const extensionName = this.extensionName(appInfo);
    const extensionBundleId = `${appInfo.identifier}.ShareExtension`;
    const platformSuffix = platform === "ios" ? "iOS" : "macOS";
    const platformValue = platform === "ios" ? "iOS" : "macOS";
    const deploymentTarget = platform === "ios" ? "14.0" : "11.0";
    const targetName = `${appInfo.productName}_${platformSuffix}`;

    // Create the extension target YAML
    const extensionTarget = `
  ${extensionName}:
    type: app-extension
    platform: ${platformValue}
    deploymentTarget: "${deploymentTarget}"
    sources:
      - path: ShareExtension
    info:
      path: ShareExtension/Info.plist
      properties:
        CFBundleDisplayName: Share
        CFBundleShortVersionString: "${appInfo.version}"
        CFBundleVersion: "${appInfo.version}"
        NSExtension:
          NSExtensionAttributes:
            NSExtensionActivationRule:
              NSExtensionActivationSupportsFileWithMaxCount: 10
              NSExtensionActivationSupportsImageWithMaxCount: 10
              NSExtensionActivationSupportsMovieWithMaxCount: 10
              NSExtensionActivationSupportsText: true
              NSExtensionActivationSupportsWebURLWithMaxCount: 1
          NSExtensionPointIdentifier: com.apple.share-services
          NSExtensionPrincipalClass: $(PRODUCT_MODULE_NAME).ShareViewController
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: ${extensionBundleId}
        SKIP_INSTALL: YES
        CODE_SIGN_ENTITLEMENTS: ShareExtension/ShareExtension.entitlements
`;

    // Add the target
    let modified = addExtensionTarget(projectYml, {
      name: extensionName,
      yaml: extensionTarget,
    });

    // Add dependency to main target
    modified = addDependencyToTarget(modified, targetName, {
      target: extensionName,
    });

    // Add URL scheme to main app for deep linking from extension
    const urlScheme = appInfo.productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    modified = addUrlSchemeToTarget(
      modified,
      targetName,
      urlScheme,
      appInfo.identifier,
    );

    return modified;
  },
};
