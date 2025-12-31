// Public API exports
export { addExtension } from "./commands/add.js";
export {
  findProjectRoot,
  findTauriConfig,
  findAppleProjectDir,
  getAppInfo,
} from "./core/project-discovery.js";
export { readProjectYml, writeProjectYml } from "./core/project-yml.js";
export {
  updateMainAppEntitlements,
  createExtensionEntitlements,
} from "./core/entitlements.js";
export { addUrlSchemeToInfoPlist } from "./core/info-plist.js";
export { runXcodeGen } from "./core/xcodegen.js";
export { shareExtension } from "./extensions/share.js";

// Type exports
export type {
  AppInfo,
  TauriConfig,
  Extension,
  TargetConfig,
  DependencyConfig,
  AddOptions,
  TemplateVariables,
} from "./types.js";
