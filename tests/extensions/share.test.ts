import { describe, it, expect, vi, beforeEach } from "vitest";
import { shareExtension } from "../../src/extensions/share.js";
import type { AppInfo } from "../../src/types.js";
import fs from "fs";
import * as template from "../../src/utils/template.js";
import * as entitlements from "../../src/core/entitlements.js";

vi.mock("fs");
vi.mock("../../src/utils/template.js");
vi.mock("../../src/core/entitlements.js");

describe("share extension", () => {
  const mockAppInfo: AppInfo = {
    productName: "TestApp",
    identifier: "com.example.testapp",
    version: "1.0.0",
    bundleIdPrefix: "com.example",
  };

  it("has correct type", () => {
    expect(shareExtension.type).toBe("share");
  });

  it("generates correct extension name", () => {
    const name = shareExtension.extensionName(mockAppInfo);
    expect(name).toBe("TestApp-ShareExtension");
  });

  it("has correct extension point identifier", () => {
    expect(shareExtension.extensionPointIdentifier).toBe(
      "com.apple.share-services",
    );
  });

  describe("updateProjectYml", () => {
    it("adds share extension target (iOS)", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain("TestApp-ShareExtension:");
      expect(result).toContain("type: app-extension");
      expect(result).toContain("platform: iOS");
      expect(result).toContain("com.example.testapp.ShareExtension");
    });

    it("adds share extension target (macOS)", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_macOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "macos",
      );

      expect(result).toContain("TestApp-ShareExtension:");
      expect(result).toContain("type: app-extension");
      expect(result).toContain("platform: macOS");
      expect(result).toContain('deploymentTarget: "11.0"');
    });

    it("adds dependency to main target", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain("target: TestApp-ShareExtension");
      expect(result).toContain("embed: true");
    });

    it("adds URL scheme to main target", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    info:
      path: TestApp_iOS/Info.plist
      properties:
        CFBundleDisplayName: TestApp
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain("CFBundleURLTypes:");
      expect(result).toContain("CFBundleURLSchemes:");
      expect(result).toContain("- testapp");
    });

    it("sets correct deployment target for iOS", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain('deploymentTarget: "14.0"');
    });

    it("sets correct deployment target for macOS", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_macOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "macos",
      );

      expect(result).toContain('deploymentTarget: "11.0"');
    });

    it("configures correct entitlements path", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain(
        "CODE_SIGN_ENTITLEMENTS: ShareExtension/ShareExtension.entitlements",
      );
    });

    it("sanitizes URL scheme to lowercase alphanumeric", () => {
      const appInfoWithSpecialChars: AppInfo = {
        productName: "My-Test_App 123",
        identifier: "com.example.app",
        version: "1.0.0",
        bundleIdPrefix: "com.example",
      };

      const projectYml = `name: My-Test_App 123
targets:
  My-Test_App 123_iOS:
    type: application
    info:
      path: My-Test_App 123_iOS/Info.plist
      properties:
        CFBundleDisplayName: My-Test_App 123
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        appInfoWithSpecialChars,
        "ios",
      );

      expect(result).toContain("- mytestapp123");
    });

    it("includes version in extension target", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(
        projectYml,
        mockAppInfo,
        "ios",
      );

      expect(result).toContain('CFBundleShortVersionString: "1.0.0"');
      expect(result).toContain('CFBundleVersion: "1.0.0"');
    });
  });

  describe("createFiles", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("creates extension directory if not exists", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockMkdirSync = vi.mocked(fs.mkdirSync);
      const mockCopyTemplateFile = vi.mocked(template.copyTemplateFile);
      const mockCreateExtensionEntitlements = vi.mocked(
        entitlements.createExtensionEntitlements,
      );

      mockExistsSync.mockImplementation((p) => {
        if (p === "/apple/ShareExtension") return false;
        if (String(p).includes("ShareViewController.swift")) return true;
        if (String(p).includes("Info.plist")) return true;
        return false;
      });

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockMkdirSync).toHaveBeenCalledWith("/apple/ShareExtension", {
        recursive: true,
      });
      expect(mockCopyTemplateFile).toHaveBeenCalled();
      expect(mockCreateExtensionEntitlements).toHaveBeenCalledWith(
        "/apple/ShareExtension",
        "group.com.example.testapp",
        "ios",
      );
    });

    it("does not create directory if already exists", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockMkdirSync = vi.mocked(fs.mkdirSync);

      mockExistsSync.mockReturnValue(true);

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it("copies ShareViewController.swift with correct variables", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockCopyTemplateFile = vi.mocked(template.copyTemplateFile);

      mockExistsSync.mockReturnValue(true);

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockCopyTemplateFile).toHaveBeenCalledWith(
        "/templates/ShareViewController.swift",
        "/apple/ShareExtension/ShareViewController.swift",
        {
          APP_GROUP_IDENTIFIER: "group.com.example.testapp",
          APP_URL_SCHEME: "testapp",
          VERSION: "1.0.0",
          BUNDLE_IDENTIFIER: "com.example.testapp.ShareExtension",
          PRODUCT_NAME: "TestApp",
        },
      );
    });

    it("throws error if ShareViewController.swift template not found", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);

      mockExistsSync.mockImplementation((p) => {
        if (p === "/apple/ShareExtension") return true;
        return false;
      });

      expect(() =>
        shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios"),
      ).toThrow("Template not found: /templates/ShareViewController.swift");
    });

    it("copies Info.plist from template when available", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockCopyTemplateFile = vi.mocked(template.copyTemplateFile);

      mockExistsSync.mockImplementation((p) => {
        if (String(p).includes("ShareViewController.swift")) return true;
        if (p === "/templates/Info.plist") return true;
        return true;
      });

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockCopyTemplateFile).toHaveBeenCalledWith(
        "/templates/Info.plist",
        "/apple/ShareExtension/Info.plist",
        expect.any(Object),
      );
    });

    it("uses ShareExtension-Info.plist if Info.plist not found", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockCopyTemplateFile = vi.mocked(template.copyTemplateFile);

      mockExistsSync.mockImplementation((p) => {
        if (String(p).includes("ShareViewController.swift")) return true;
        if (p === "/templates/Info.plist") return false;
        if (p === "/templates/ShareExtension-Info.plist") return true;
        return true;
      });

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockCopyTemplateFile).toHaveBeenCalledWith(
        "/templates/ShareExtension-Info.plist",
        "/apple/ShareExtension/Info.plist",
        expect.any(Object),
      );
    });

    it("creates default Info.plist if no template found", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockExistsSync.mockImplementation((p) => {
        if (String(p).includes("ShareViewController.swift")) return true;
        if (String(p).includes("Info.plist")) return false;
        return true;
      });

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/ShareExtension/Info.plist",
        expect.stringContaining("com.apple.share-services"),
      );
    });

    it("creates entitlements with correct app group", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockCreateExtensionEntitlements = vi.mocked(
        entitlements.createExtensionEntitlements,
      );

      mockExistsSync.mockReturnValue(true);

      shareExtension.createFiles("/apple", mockAppInfo, "/templates", "ios");

      expect(mockCreateExtensionEntitlements).toHaveBeenCalledWith(
        "/apple/ShareExtension",
        "group.com.example.testapp",
        "ios",
      );
    });

    it("sanitizes URL scheme in variables", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockCopyTemplateFile = vi.mocked(template.copyTemplateFile);

      mockExistsSync.mockReturnValue(true);

      const appInfoWithSpecialChars: AppInfo = {
        productName: "My-Test_App 123",
        identifier: "com.example.app",
        version: "2.0.0",
        bundleIdPrefix: "com.example",
      };

      shareExtension.createFiles(
        "/apple",
        appInfoWithSpecialChars,
        "/templates",
        "ios",
      );

      expect(mockCopyTemplateFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          APP_URL_SCHEME: "mytestapp123",
        }),
      );
    });
  });
});
