import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  findProjectRoot,
  findTauriConfig,
  findAppleProjectDir,
  getAppInfo,
} from "../core/project-discovery.js";
import { readProjectYml, writeProjectYml } from "../core/project-yml.js";
import { updateMainAppEntitlements } from "../core/entitlements.js";
import { addUrlSchemeToInfoPlist } from "../core/info-plist.js";
import { runXcodeGen } from "../core/xcodegen.js";
import { shareExtension } from "../extensions/share.js";
import type { Extension, AddOptions } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSIONS: Record<string, Extension> = {
  share: shareExtension,
};

function resolveTemplatesDir(
  options: AddOptions,
  extensionType: string,
): string {
  // Option 1: Explicit templates path
  if (options.templates) {
    const templatesPath = path.resolve(process.cwd(), options.templates);
    if (!fs.existsSync(templatesPath)) {
      throw new Error(`Templates directory not found: ${templatesPath}`);
    }
    return templatesPath;
  }

  // Option 2: Plugin templates
  if (options.plugin) {
    const pluginPath = resolvePluginPath(options.plugin);
    const pluginPkg = JSON.parse(
      fs.readFileSync(path.join(pluginPath, "package.json"), "utf8"),
    ) as { "tauri-apple-extension"?: { type: string; templates: string } };

    const extensionConfig = pluginPkg["tauri-apple-extension"];
    if (!extensionConfig) {
      throw new Error(
        `Plugin ${options.plugin} does not have tauri-apple-extension config in package.json`,
      );
    }

    if (extensionConfig.type !== extensionType) {
      throw new Error(
        `Plugin ${options.plugin} is for '${extensionConfig.type}' extension, not '${extensionType}'`,
      );
    }

    const templatesPath = path.join(pluginPath, extensionConfig.templates);
    if (!fs.existsSync(templatesPath)) {
      throw new Error(`Plugin templates directory not found: ${templatesPath}`);
    }
    return templatesPath;
  }

  // Option 3: Default templates
  const defaultTemplates = path.join(
    __dirname,
    "../../templates",
    extensionType,
  );
  if (!fs.existsSync(defaultTemplates)) {
    throw new Error(
      `No templates found. Use --plugin or --templates to specify templates.`,
    );
  }
  return defaultTemplates;
}

function resolvePluginPath(pluginName: string): string {
  // Try to find in node_modules
  const possiblePaths = [
    path.join(process.cwd(), "node_modules", pluginName),
    path.join(process.cwd(), "src-tauri", "node_modules", pluginName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    `Plugin ${pluginName} not found in node_modules. Make sure it's installed.`,
  );
}

export async function addExtension(
  type: string,
  options: AddOptions,
): Promise<void> {
  console.log(`\nTauri Apple Extensions - Add ${type}\n`);

  try {
    // Validate extension type
    const extension = EXTENSIONS[type];
    if (!extension) {
      const available = Object.keys(EXTENSIONS).join(", ");
      throw new Error(
        `Unknown extension type: ${type}. Available: ${available}`,
      );
    }

    // Find project
    const projectRoot = findProjectRoot();
    console.log(`Project root: ${projectRoot}`);

    const tauriConfig = findTauriConfig(projectRoot);
    const appleDir = findAppleProjectDir(projectRoot);
    console.log(`Apple project dir: ${appleDir}`);

    // Get app info
    let projectYml = readProjectYml(appleDir);
    const appInfo = getAppInfo(tauriConfig, projectYml);

    console.log(`\nApp Info:`);
    console.log(`  Product Name: ${appInfo.productName}`);
    console.log(`  Bundle ID: ${appInfo.identifier}`);
    console.log(`  Version: ${appInfo.version}`);

    const appGroupId = `group.${appInfo.identifier}`;
    const urlScheme = appInfo.productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    console.log(`  App Group: ${appGroupId}`);
    console.log(`  URL Scheme: ${urlScheme}`);

    // Resolve templates
    const templatesDir = resolveTemplatesDir(options, type);
    console.log(`\nUsing templates from: ${templatesDir}`);

    // Run extension setup
    console.log(`\n1. Creating ${extension.displayName} files...`);
    extension.createFiles(appleDir, appInfo, templatesDir);

    console.log(`\n2. Updating main app entitlements...`);
    updateMainAppEntitlements(appleDir, appInfo);

    console.log(`\n3. Adding URL scheme to Info.plist...`);
    addUrlSchemeToInfoPlist(appleDir, appInfo);

    console.log(`\n4. Updating project.yml...`);
    projectYml = readProjectYml(appleDir);
    projectYml = extension.updateProjectYml(projectYml, appInfo);
    writeProjectYml(appleDir, projectYml);

    console.log(`\n5. Regenerating Xcode project...`);
    runXcodeGen(appleDir);

    console.log(`\n========================================`);
    console.log(`${extension.displayName} setup complete!`);
    console.log(`========================================\n`);
    console.log(`Next steps:`);
    console.log(`1. Open the Xcode project`);
    console.log(
      `2. Select your team for both targets (main app and ${extension.extensionName(appInfo)})`,
    );
    console.log(
      `3. Enable 'App Groups' capability for both targets with: ${appGroupId}`,
    );
    console.log(`4. Build and run!\n`);
    console.log(
      `IMPORTANT: You need to configure App Groups in Apple Developer Portal:`,
    );
    console.log(`  - Create App Group: ${appGroupId}`);
    console.log(
      `  - Add it to both App IDs: ${appInfo.identifier} and ${appInfo.identifier}.${extension.extensionSuffix}\n`,
    );
  } catch (error) {
    console.error(`\nError: ${(error as Error).message}`);
    process.exit(1);
  }
}
