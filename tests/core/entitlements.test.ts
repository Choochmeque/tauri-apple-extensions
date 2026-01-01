import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addAppGroupToEntitlements,
  createEntitlementsContent,
  createExtensionEntitlements,
  updateMainAppEntitlements,
  EMPTY_ENTITLEMENTS,
} from "../../src/core/entitlements.js";
import fs from "fs";

vi.mock("fs");

describe("entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addAppGroupToEntitlements", () => {
    it("adds app group to empty entitlements", () => {
      const result = addAppGroupToEntitlements(
        EMPTY_ENTITLEMENTS,
        "group.com.example.app",
      );

      expect(result).toContain("com.apple.security.application-groups");
      expect(result).toContain("group.com.example.app");
    });

    it("adds app group to existing array", () => {
      const existingEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.existing.app</string>
    </array>
</dict>
</plist>`;

      const result = addAppGroupToEntitlements(
        existingEntitlements,
        "group.com.example.app",
      );

      expect(result).toContain("group.existing.app");
      expect(result).toContain("group.com.example.app");
    });

    it("does not duplicate existing app group", () => {
      const existingEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.example.app</string>
    </array>
</dict>
</plist>`;

      const result = addAppGroupToEntitlements(
        existingEntitlements,
        "group.com.example.app",
      );

      const matches = result.match(/group\.com\.example\.app/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("createEntitlementsContent", () => {
    it("creates valid entitlements plist with app group", () => {
      const result = createEntitlementsContent("group.com.example.app");

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain("com.apple.security.application-groups");
      expect(result).toContain("group.com.example.app");
      expect(result).toContain("</plist>");
    });

    it("uses the provided app group identifier", () => {
      const result = createEntitlementsContent("group.custom.identifier");

      expect(result).toContain("group.custom.identifier");
      expect(result).not.toContain("group.com.example.app");
    });
  });

  describe("EMPTY_ENTITLEMENTS", () => {
    it("is valid plist structure", () => {
      expect(EMPTY_ENTITLEMENTS).toContain('<?xml version="1.0"');
      expect(EMPTY_ENTITLEMENTS).toContain("<dict>");
      expect(EMPTY_ENTITLEMENTS).toContain("</dict>");
      expect(EMPTY_ENTITLEMENTS).toContain("</plist>");
    });

    it("has empty dict", () => {
      expect(EMPTY_ENTITLEMENTS).toMatch(/<dict>\s*<\/dict>/);
    });
  });

  describe("updateMainAppEntitlements", () => {
    it("creates new entitlements file if not exists (iOS)", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockExistsSync.mockReturnValue(false);

      updateMainAppEntitlements(
        "/apple",
        {
          productName: "TestApp",
          identifier: "com.example.test",
          version: "1.0.0",
          bundleIdPrefix: "com.example",
        },
        "ios",
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/TestApp_iOS/TestApp_iOS.entitlements",
        expect.stringContaining("group.com.example.test"),
      );
    });

    it("creates new entitlements file if not exists (macOS)", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockExistsSync.mockReturnValue(false);

      updateMainAppEntitlements(
        "/apple",
        {
          productName: "TestApp",
          identifier: "com.example.test",
          version: "1.0.0",
          bundleIdPrefix: "com.example",
        },
        "macos",
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/TestApp_macOS/TestApp_macOS.entitlements",
        expect.stringContaining("group.com.example.test"),
      );
    });

    it("updates existing entitlements file", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(EMPTY_ENTITLEMENTS);

      updateMainAppEntitlements(
        "/apple",
        {
          productName: "TestApp",
          identifier: "com.example.test",
          version: "1.0.0",
          bundleIdPrefix: "com.example",
        },
        "ios",
      );

      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/apple/TestApp_iOS/TestApp_iOS.entitlements",
        "utf8",
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/TestApp_iOS/TestApp_iOS.entitlements",
        expect.stringContaining("group.com.example.test"),
      );
    });
  });

  describe("createExtensionEntitlements", () => {
    it("creates entitlements file with correct path", () => {
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      const result = createExtensionEntitlements(
        "/apple/ShareExtension",
        "group.com.example.app",
      );

      expect(result).toBe("/apple/ShareExtension/ShareExtension.entitlements");
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/apple/ShareExtension/ShareExtension.entitlements",
        expect.stringContaining("group.com.example.app"),
      );
    });
  });
});
