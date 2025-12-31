import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  replaceTemplateVariables,
  copyTemplateFile,
  copyTemplateDir,
} from "../../src/utils/template.js";
import fs from "fs";

vi.mock("fs");

describe("template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces single variable", () => {
    const content = "Hello {{NAME}}!";
    const result = replaceTemplateVariables(content, { NAME: "World" });
    expect(result).toBe("Hello World!");
  });

  it("replaces multiple occurrences of same variable", () => {
    const content = "{{VAR}} and {{VAR}} again";
    const result = replaceTemplateVariables(content, { VAR: "test" });
    expect(result).toBe("test and test again");
  });

  it("replaces multiple different variables", () => {
    const content = "{{FIRST}} {{SECOND}}";
    const result = replaceTemplateVariables(content, {
      FIRST: "Hello",
      SECOND: "World",
    });
    expect(result).toBe("Hello World");
  });

  it("leaves unknown variables unchanged", () => {
    const content = "{{KNOWN}} {{UNKNOWN}}";
    const result = replaceTemplateVariables(content, { KNOWN: "test" });
    expect(result).toBe("test {{UNKNOWN}}");
  });

  it("handles empty variables object", () => {
    const content = "{{VAR}}";
    const result = replaceTemplateVariables(content, {});
    expect(result).toBe("{{VAR}}");
  });

  it("handles content without variables", () => {
    const content = "No variables here";
    const result = replaceTemplateVariables(content, { VAR: "test" });
    expect(result).toBe("No variables here");
  });

  describe("copyTemplateFile", () => {
    it("reads source, replaces variables, and writes to destination", () => {
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockReadFileSync.mockReturnValue("Hello {{NAME}}!");

      copyTemplateFile("/src/template.txt", "/dest/output.txt", {
        NAME: "World",
      });

      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/src/template.txt",
        "utf8",
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/dest/output.txt",
        "Hello World!",
      );
    });
  });

  describe("copyTemplateDir", () => {
    it("creates destination directory if it does not exist", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockMkdirSync = vi.mocked(fs.mkdirSync);
      const mockReaddirSync = vi.mocked(fs.readdirSync);

      mockExistsSync.mockReturnValue(false);
      mockReaddirSync.mockReturnValue([]);

      copyTemplateDir("/src/templates", "/dest/output", {});

      expect(mockMkdirSync).toHaveBeenCalledWith("/dest/output", {
        recursive: true,
      });
    });

    it("copies files with variable replacement", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockReaddirSync = vi.mocked(
        fs.readdirSync,
      ) as unknown as ReturnType<typeof vi.fn>;
      const mockStatSync = vi.mocked(fs.statSync);
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(["file.txt"]);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
      mockReadFileSync.mockReturnValue("Content {{VAR}}");

      copyTemplateDir("/src/templates", "/dest/output", { VAR: "replaced" });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/dest/output/file.txt",
        "Content replaced",
      );
    });

    it("recursively copies subdirectories", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockMkdirSync = vi.mocked(fs.mkdirSync);
      const mockReaddirSync = vi.mocked(
        fs.readdirSync,
      ) as unknown as ReturnType<typeof vi.fn>;
      const mockStatSync = vi.mocked(fs.statSync);

      mockExistsSync.mockImplementation((p) => p !== "/dest/output/subdir");
      mockReaddirSync.mockImplementation((p) => {
        if (p === "/src/templates") {
          return ["subdir"];
        }
        return [];
      });
      mockStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);

      copyTemplateDir("/src/templates", "/dest/output", {});

      expect(mockMkdirSync).toHaveBeenCalledWith("/dest/output/subdir", {
        recursive: true,
      });
    });
  });
});
