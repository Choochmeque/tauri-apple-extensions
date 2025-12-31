import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const external = ["commander", "fs", "path", "child_process", "url"];

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "esm",
    },
    external,
    plugins: [
      nodeResolve(),
      typescript({
        declaration: true,
        declarationDir: "./dist",
      }),
    ],
  },
  {
    input: "src/cli.ts",
    output: {
      file: "dist/cli.js",
      format: "esm",
      banner: "#!/usr/bin/env node",
    },
    external,
    plugins: [
      nodeResolve(),
      replace({
        preventAssignment: true,
        __VERSION__: JSON.stringify(pkg.version),
      }),
      typescript({
        compilerOptions: {
          declaration: false,
          declarationDir: undefined,
        },
      }),
    ],
  },
];
