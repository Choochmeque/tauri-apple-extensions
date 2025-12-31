import fs from "fs";
import path from "path";
import type { TargetConfig, DependencyConfig } from "../types.js";

export function readProjectYml(appleDir: string): string {
  const projectYmlPath = path.join(appleDir, "project.yml");
  if (!fs.existsSync(projectYmlPath)) {
    throw new Error("project.yml not found. Run 'tauri ios init' first.");
  }
  return fs.readFileSync(projectYmlPath, "utf8");
}

export function writeProjectYml(appleDir: string, content: string): void {
  const projectYmlPath = path.join(appleDir, "project.yml");
  fs.writeFileSync(projectYmlPath, content);
}

export function addExtensionTarget(
  projectYml: string,
  targetConfig: TargetConfig,
): string {
  let modified = projectYml;

  // Remove existing target if it exists (to allow re-running the script)
  // Note: Don't use 'm' flag - we need $ to match only at true end of string
  const existingTargetRegex = new RegExp(
    `\\n  ${targetConfig.name}:[\\s\\S]*?(?=\\n  [a-zA-Z_]|\\n[a-zA-Z]|$)`,
  );
  if (modified.match(existingTargetRegex)) {
    console.log(
      `Removing existing ${targetConfig.name} target to recreate it...`,
    );
    modified = modified.replace(existingTargetRegex, "");
  }

  // Find the end of targets section and insert the new target
  if (modified.includes("targets:")) {
    const targetsIndex = modified.indexOf("targets:");
    const afterTargets = modified.slice(targetsIndex);

    const lines = afterTargets.split("\n");
    let inTargets = false;
    let lastTargetEnd = targetsIndex;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^targets:/)) {
        inTargets = true;
        continue;
      }
      if (inTargets) {
        // Check if we've exited the targets section (new top-level key)
        if (line.match(/^[a-zA-Z]/) && !line.startsWith(" ")) {
          break;
        }
        lastTargetEnd = targetsIndex + lines.slice(0, i + 1).join("\n").length;
      }
    }

    modified =
      modified.slice(0, lastTargetEnd) +
      targetConfig.yaml +
      modified.slice(lastTargetEnd);
  }

  return modified;
}

export function addDependencyToTarget(
  projectYml: string,
  mainTargetName: string,
  dependencyConfig: DependencyConfig,
): string {
  let modified = projectYml;

  // Remove existing dependency if it exists
  const existingDepRegex = new RegExp(
    `\\n      - target: ${dependencyConfig.target}\\n        embed: true\\n        codeSign: true`,
    "g",
  );
  modified = modified.replace(existingDepRegex, "");

  // Find the main target's dependencies section and add the extension
  const targetRegex = new RegExp(
    `(${mainTargetName}:[\\s\\S]*?dependencies:)([\\s\\S]*?)(\\n\\s{4}\\w|$)`,
    "m",
  );

  const depMatch = modified.match(targetRegex);
  if (depMatch) {
    const depSection = depMatch[2];
    const newDep = `\n      - target: ${dependencyConfig.target}
        embed: true
        codeSign: true`;

    if (!depSection.includes(dependencyConfig.target)) {
      modified = modified.replace(targetRegex, `$1${depSection}${newDep}$3`);
    }
  }

  return modified;
}
