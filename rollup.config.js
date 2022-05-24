import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import { sizeSnapshot } from "rollup-plugin-size-snapshot";
import { terser } from 'rollup-plugin-terser';
import autoprefixer from 'autoprefixer';
import strip from '@rollup/plugin-strip';
import pkg from './package.json';
import clear from 'rollup-plugin-clear'
import externals from 'rollup-plugin-node-externals';
import styles from "rollup-plugin-styles";
import copy from 'rollup-plugin-copy';

const input = './src/index.tsx';
const extensions = ['.tsx', '.ts', '.js', '.jsx', '.css'];

const getBabelOptions = ({ useESModules }) => ({
  babelrc: false,
  exclude: 'node_modules/**',
  presets: [
    "@babel/preset-env",
    "@babel/react",
  ],
  babelHelpers: 'runtime',
  plugins: [['@babel/transform-runtime', { useESModules }]],
});

const postcssArgs = {
  mode: ["inject"],
  modules: true,
  use: ['sass'],
  plugins: [
    autoprefixer(),
  ],
  extensions: ['.css', '.scss']
};

const commonJsArgs = {
  include: /node_modules/,
};

const excludeAllExternals = (id) => {
  return /node_modules/.test(id) && !/css$/.test(id);
};

const config = [{
  input,
  output: [
    { file: 'dist/umd/react-fake-api.js', format: 'umd', name: 'react-fake-api', plugins: [

    ]},
    { file: 'dist/umd/react-fake-api.min.js', format: 'umd', name: 'react-fake-api', plugins: [
      strip(),
      terser(),
    ]},
    { file: pkg.main, format: 'cjs', sourcemap: true, name: 'react-fake-api', plugins: [
      terser(),
    ] },
    { file: pkg.module, format: 'esm', sourcemap: true, plugins: [

    ] }
  ],
  plugins: [
    externals({ devDeps: false }),
    nodeResolve({ extensions }),
    styles(postcssArgs),
    json(),
    commonJs(commonJsArgs),
    babel(getBabelOptions({ useESModules: true })),
    typescript({
      typescript: require('typescript'),
      tsconfig: './tsconfig.json'
    }),
    // sizeSnapshot(),
    // visualizer(),
    clear({
      // required, point out which directories should be clear.
      targets: ['dist'],
      // optional, whether clear the directores when rollup recompile on --watch mode.
      // watch: true, // default: false
    })
  ],
}];


export default config;
