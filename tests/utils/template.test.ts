import { describe, it, expect } from "vitest";
import { replaceTemplateVariables } from "../../src/utils/template.js";

describe("template", () => {
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
});
