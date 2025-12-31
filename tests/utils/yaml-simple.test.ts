import { describe, it, expect } from "vitest";
import { parseYamlSimple } from "../../src/utils/yaml-simple.js";

describe("yaml-simple", () => {
  it("parses simple key-value pairs", () => {
    const yaml = `name: MyApp
bundleIdPrefix: com.example
version: 1.0.0`;

    const result = parseYamlSimple(yaml);

    expect(result.name).toBe("MyApp");
    expect(result.bundleIdPrefix).toBe("com.example");
    expect(result.version).toBe("1.0.0");
  });

  it("handles empty content", () => {
    const result = parseYamlSimple("");
    expect(result).toEqual({});
  });

  it("ignores nested content", () => {
    const yaml = `name: MyApp
targets:
  MyApp_iOS:
    type: application`;

    const result = parseYamlSimple(yaml);

    expect(result.name).toBe("MyApp");
    expect(result.targets).toBeUndefined();
  });

  it("handles values with colons", () => {
    const yaml = `url: https://example.com`;

    const result = parseYamlSimple(yaml);

    expect(result.url).toBe("https://example.com");
  });
});
