import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addExtensionTarget,
  addDependencyToTarget,
  addUrlSchemeToTarget,
  readProjectYml,
  writeProjectYml,
} from "../../src/core/project-yml.js";
import fs from "fs";

vi.mock("fs");

describe("project-yml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readProjectYml", () => {
    it("reads project.yml content", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockReadFileSync = vi.mocked(fs.readFileSync);

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("name: MyApp\ntargets:");

      const result = readProjectYml("/apple");

      expect(mockExistsSync).toHaveBeenCalledWith("/apple/project.yml");
      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/apple/project.yml",
        "utf8",
      );
      expect(result).toBe("name: MyApp\ntargets:");
    });

    it("throws error if project.yml not found", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);

      mockExistsSync.mockReturnValue(false);

      expect(() => readProjectYml("/apple")).toThrow(
        "project.yml not found. Run 'tauri ios init' first.",
      );
    });
  });

  describe("writeProjectYml", () => {
    it("writes content to project.yml", () => {
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      writeProjectYml("/apple", "name: MyApp\ntargets:");

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/project.yml",
        "name: MyApp\ntargets:",
      );
    });
  });

  describe("addExtensionTarget", () => {
    it("adds extension target to project.yml", () => {
      const projectYml = `name: MyApp
targets:
  MyApp_iOS:
    type: application
    dependencies: []`;

      const result = addExtensionTarget(projectYml, {
        name: "MyApp-ShareExtension",
        yaml: `
  MyApp-ShareExtension:
    type: app-extension
    platform: iOS`,
      });

      expect(result).toContain("MyApp-ShareExtension:");
      expect(result).toContain("type: app-extension");
    });

    it("is idempotent - removes existing target before adding", () => {
      const projectYml = `name: MyApp
targets:
  MyApp_iOS:
    type: application
  MyApp-ShareExtension:
    type: app-extension
    old: config`;

      const result = addExtensionTarget(projectYml, {
        name: "MyApp-ShareExtension",
        yaml: `
  MyApp-ShareExtension:
    type: app-extension
    new: config`,
      });

      // Should only have one ShareExtension target
      const matches = result.match(/MyApp-ShareExtension:/g);
      expect(matches?.length).toBe(1);
      expect(result).toContain("new: config");
      expect(result).not.toContain("old: config");
    });

    it("inserts target before other top-level keys", () => {
      const projectYml = `name: MyApp
targets:
  MyApp_iOS:
    type: application
    dependencies: []
settings:
  base:
    PRODUCT_NAME: MyApp`;

      const result = addExtensionTarget(projectYml, {
        name: "MyApp-ShareExtension",
        yaml: `
  MyApp-ShareExtension:
    type: app-extension
    platform: iOS`,
      });

      expect(result).toContain("MyApp-ShareExtension:");
      expect(result).toContain("settings:");
      // Extension should appear before settings
      const extIndex = result.indexOf("MyApp-ShareExtension:");
      const settingsIndex = result.indexOf("settings:");
      expect(extIndex).toBeLessThan(settingsIndex);
    });

    it("returns unchanged if no targets section exists", () => {
      const projectYml = `name: MyApp
settings:
  base:
    PRODUCT_NAME: MyApp`;

      const result = addExtensionTarget(projectYml, {
        name: "MyApp-ShareExtension",
        yaml: `
  MyApp-ShareExtension:
    type: app-extension`,
      });

      // Should return unchanged since no targets section
      expect(result).toBe(projectYml);
    });
  });

  describe("addDependencyToTarget", () => {
    it("adds dependency to main target", () => {
      const projectYml = `targets:
  MyApp_iOS:
    type: application
    dependencies: []`;

      const result = addDependencyToTarget(projectYml, "MyApp_iOS", {
        target: "MyApp-ShareExtension",
      });

      expect(result).toContain("target: MyApp-ShareExtension");
      expect(result).toContain("embed: true");
      expect(result).toContain("codeSign: true");
    });

    it("does not duplicate existing dependency", () => {
      const projectYml = `targets:
  MyApp_iOS:
    type: application
    dependencies:
      - target: MyApp-ShareExtension
        embed: true
        codeSign: true`;

      const result = addDependencyToTarget(projectYml, "MyApp_iOS", {
        target: "MyApp-ShareExtension",
      });

      const matches = result.match(/target: MyApp-ShareExtension/g);
      expect(matches?.length).toBe(1);
    });

    it("returns unchanged if target not found", () => {
      const projectYml = `targets:
  OtherApp_iOS:
    type: application
    dependencies: []`;

      const result = addDependencyToTarget(projectYml, "MyApp_iOS", {
        target: "MyApp-ShareExtension",
      });

      expect(result).toBe(projectYml);
    });
  });

  describe("addUrlSchemeToTarget", () => {
    it("adds URL scheme to target info properties", () => {
      const projectYml = `targets:
  MyApp_iOS:
    type: application
    info:
      path: MyApp_iOS/Info.plist
      properties:
        CFBundleDisplayName: MyApp`;

      const result = addUrlSchemeToTarget(
        projectYml,
        "MyApp_iOS",
        "myapp",
        "com.example.myapp",
      );

      expect(result).toContain("CFBundleURLTypes:");
      expect(result).toContain("CFBundleURLName: com.example.myapp");
      expect(result).toContain("CFBundleURLSchemes:");
      expect(result).toContain("- myapp");
    });

    it("does not duplicate existing URL scheme", () => {
      const projectYml = `targets:
  MyApp_iOS:
    type: application
    info:
      path: MyApp_iOS/Info.plist
      properties:
        CFBundleDisplayName: MyApp
        CFBundleURLTypes:
          - CFBundleURLName: com.example.myapp
            CFBundleURLSchemes:
              - myapp`;

      const result = addUrlSchemeToTarget(
        projectYml,
        "MyApp_iOS",
        "myapp",
        "com.example.myapp",
      );

      const matches = result.match(/CFBundleURLSchemes:/g);
      expect(matches?.length).toBe(1);
    });

    it("returns unchanged if target info section not found", () => {
      const projectYml = `targets:
  MyApp_iOS:
    type: application
    dependencies: []`;

      const result = addUrlSchemeToTarget(
        projectYml,
        "MyApp_iOS",
        "myapp",
        "com.example.myapp",
      );

      expect(result).toBe(projectYml);
    });

    it("returns unchanged if target not found", () => {
      const projectYml = `targets:
  OtherApp_iOS:
    type: application
    info:
      properties:
        CFBundleDisplayName: Other`;

      const result = addUrlSchemeToTarget(
        projectYml,
        "MyApp_iOS",
        "myapp",
        "com.example.myapp",
      );

      expect(result).toBe(projectYml);
    });
  });
});
