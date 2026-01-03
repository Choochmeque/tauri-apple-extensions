import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const external = ["commander", "fs", "path", "child_process", "url", "module"];

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
      typescript({
        compilerOptions: {
          declaration: false,
          declarationDir: undefined,
        },
      }),
    ],
  },
];
