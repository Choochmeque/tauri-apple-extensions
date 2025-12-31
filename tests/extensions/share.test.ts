import { describe, it, expect } from "vitest";
import { shareExtension } from "../../src/extensions/share.js";
import type { AppInfo } from "../../src/types.js";

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
    it("adds share extension target", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(projectYml, mockAppInfo);

      expect(result).toContain("TestApp-ShareExtension:");
      expect(result).toContain("type: app-extension");
      expect(result).toContain("platform: iOS");
      expect(result).toContain("com.example.testapp.ShareExtension");
    });

    it("adds dependency to main target", () => {
      const projectYml = `name: TestApp
targets:
  TestApp_iOS:
    type: application
    dependencies: []`;

      const result = shareExtension.updateProjectYml(projectYml, mockAppInfo);

      expect(result).toContain("target: TestApp-ShareExtension");
      expect(result).toContain("embed: true");
    });
  });
});
