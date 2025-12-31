import { Command } from "commander";
import { addExtension } from "./commands/add.js";

const program = new Command();

program
  .name("tauri-apple-extensions")
  .description("Add iOS extensions to Tauri apps")
  .version("0.1.1");

program
  .command("add <type>")
  .description("Add an extension (e.g., share)")
  .option("-p, --plugin <name>", "Plugin to use for templates")
  .option("-t, --templates <path>", "Custom templates directory")
  .action(addExtension);

program.parse();
