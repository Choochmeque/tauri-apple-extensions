export type Platform = "ios" | "macos";

export interface AppInfo {
  productName: string;
  bundleIdPrefix: string;
  identifier: string;
  version: string;
}

export interface TauriConfig {
  productName?: string;
  identifier?: string;
  version?: string;
  package?: {
    productName?: string;
  };
}

export interface Extension {
  type: string;
  displayName: string;
  extensionSuffix: string;
  extensionPointIdentifier: string;
  extensionName(appInfo: AppInfo): string;
  createFiles(
    appleDir: string,
    appInfo: AppInfo,
    templatesDir: string,
    platform: Platform,
  ): void;
  updateProjectYml(
    projectYml: string,
    appInfo: AppInfo,
    platform: Platform,
  ): string;
}

export interface TargetConfig {
  name: string;
  yaml: string;
}

export interface DependencyConfig {
  target: string;
}

export interface AddOptions {
  plugin?: string;
  templates?: string;
  platform: Platform;
}

export type TemplateVariables = Record<string, string>;
