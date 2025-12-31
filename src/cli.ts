declare const __VERSION__: string;
import { Command } from "commander";
import { addExtension } from "./commands/add.js";

const program = new Command();

program
  .name("tauri-apple-extensions")
  .description("Add iOS extensions to Tauri apps")
  .version(__VERSION__);

program
  .command("add <type>")
  .description("Add an extension (e.g., share)")
  .option("-p, --plugin <name>", "Plugin to use for templates")
  .option("-t, --templates <path>", "Custom templates directory")
  .action(addExtension);

program.parse();
