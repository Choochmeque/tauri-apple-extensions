import { describe, it, expect } from "vitest";
import {
  addExtensionTarget,
  addDependencyToTarget,
  addUrlSchemeToTarget,
} from "../../src/core/project-yml.js";

describe("project-yml", () => {
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
  });
});
