/**
 * Simple YAML-like parsing for the values we need.
 * This is not a full YAML parser, just extracts top-level key-value pairs.
 */
export function parseYamlSimple(content: string): Record<string, string> {
  const lines = content.split("\n");
  const result: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result;
}
