/**
 * Plist manipulation utilities.
 */

/**
 * Check if a plist contains a specific key.
 */
export function plistHasKey(content: string, key: string): boolean {
  return content.includes(`<key>${key}</key>`);
}

/**
 * Add a string to an array in a plist, if not already present.
 */
export function plistAddToArray(
  content: string,
  key: string,
  value: string,
): string {
  if (content.includes(value)) {
    return content;
  }

  const keyPattern = new RegExp(`(<key>${key}</key>\\s*<array>)`, "g");

  return content.replace(keyPattern, `$1\n        <string>${value}</string>`);
}
