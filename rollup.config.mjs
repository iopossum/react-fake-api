import path, { dirname } from "path";
import { fileURLToPath } from "url";

import alias from "@rollup/plugin-alias";
import commonJs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import cssComments from "postcss-discard-comments";
import duplicates from "postcss-discard-duplicates";
import cleanup from "rollup-plugin-cleanup";
import clear from "rollup-plugin-clear";
import copy from "rollup-plugin-copy";
import dts from "rollup-plugin-dts";
import externals from "rollup-plugin-peer-deps-external";
import styles from "rollup-plugin-styles";
import * as terserModule from "rollup-plugin-terser";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import ts from "typescript";

import pkg from "./package.json" assert { type: "json" };

const terser = terserModule.terser;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const input = "./src/index.tsx";

const aliasProps = {
  entries: { "@src/": path.resolve(__dirname, "./src/") },
};

const typescriptProps = {
  typescript: ts,
  tsconfig: "./tsconfig.json",
  exclude: "**/*.stories.tsx",
};

const postcssProps = {
  mode: ["inject"],
  modules: true,
  use: ["sass"],
  plugins: [autoprefixer(), duplicates(), cssnano(), cssComments()],
  extensions: [".css", ".scss"],
};

const external = (id) => [pkg.name, "miragejs"].includes(id.split("/")[0]);

const externalDts = (id) =>
  [pkg.name, "miragejs"].includes(id.split("/")[0]) || /\.(scss|css)$/.test(id);

const config = [
  {
    input,
    output: [
      {
        file: `dist/${pkg.main}`,
        format: "cjs",
        sourcemap: true,
        name: "react-fake-api",
      },
      { file: `dist/${pkg.module}`, format: "esm", sourcemap: true },
    ],
    plugins: [
      alias(aliasProps),
      externals(),
      nodeResolve(),
      commonJs(),
      typescript(typescriptProps),
      styles(postcssProps),
      typescriptPaths(),
      json(),
      cleanup(),
      clear({
        targets: ["dist"],
      }),
      terser(),
    ],
    external,
  },
  {
    input: "dist/esm/src/index.d.ts",
    output: [{ file: "dist/esm/index.d.ts", format: "esm", sourcemap: false }],
    plugins: [
      alias({
        entries: { "@src/": path.resolve(__dirname, "./dist/esm/src/") },
      }),
      dts({
        compilerOptions: {
          jsx: "react-jsx",
          importHelpers: true,
          paths: {
            "@src/*": ["./dist/esm/src/*"],
          },
        },
      }),
      typescriptPaths(),
      copy({
        targets: [
          { src: "dist/esm/src/types/index.d.ts", dest: "dist/types/" },
        ],
      }),
    ],
    external: externalDts,
  },
];

export default config;
