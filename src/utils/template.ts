import fs from "fs";
import path from "path";
import type { TemplateVariables } from "../types.js";

/**
 * Replace template variables in content.
 * Variables are in the format {{VARIABLE_NAME}}
 */
export function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables,
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Copy a template file to destination, replacing variables.
 */
export function copyTemplateFile(
  src: string,
  dest: string,
  variables: TemplateVariables,
): void {
  let content = fs.readFileSync(src, "utf8");
  content = replaceTemplateVariables(content, variables);
  fs.writeFileSync(dest, content);
}

/**
 * Copy all files from a templates directory, replacing variables.
 */
export function copyTemplateDir(
  templatesDir: string,
  destDir: string,
  variables: TemplateVariables,
): void {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(templatesDir);
  for (const file of files) {
    const srcPath = path.join(templatesDir, file);
    const destPath = path.join(destDir, file);

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyTemplateDir(srcPath, destPath, variables);
    } else {
      copyTemplateFile(srcPath, destPath, variables);
    }
  }
}
