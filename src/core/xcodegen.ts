import { execSync } from "child_process";

export function runXcodeGen(appleDir: string): void {
  try {
    console.log("Running xcodegen to regenerate project...");
    execSync("xcodegen generate", {
      cwd: appleDir,
      stdio: "inherit",
    });
    console.log("Xcode project regenerated successfully!");
  } catch (error) {
    console.log(
      "\nNote: xcodegen not found or failed. You may need to run it manually:",
    );
    console.log(`  cd ${appleDir} && xcodegen generate`);
    console.log(`  Error: ${(error as Error).message}`);
  }
}
