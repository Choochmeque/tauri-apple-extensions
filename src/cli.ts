import { createRequire } from "module";
import { Command } from "commander";
import { addExtension } from "./commands/add.js";
import type { Platform } from "./types.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("tauri-apple-extensions")
  .description("Add Apple extensions to Tauri apps")
  .version(version);

function createPlatformCommand(platform: Platform): Command {
  const cmd = new Command(platform);
  cmd.description(`Manage ${platform === "ios" ? "iOS" : "macOS"} extensions`);

  cmd
    .command("add <type>")
    .description("Add an extension (e.g., share)")
    .option("-p, --plugin <name>", "Plugin to use for templates")
    .option("-t, --templates <path>", "Custom templates directory")
    .action(
      (type: string, options: { plugin?: string; templates?: string }) => {
        addExtension(type, { ...options, platform });
      },
    );

  return cmd;
}

program.addCommand(createPlatformCommand("ios"));
program.addCommand(createPlatformCommand("macos"));

program.parse();
