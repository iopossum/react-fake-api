import type { StorybookConfig } from "@storybook/react-webpack5";

import path from "path";

import ESLintPlugin from "eslint-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import StylelintPlugin from "stylelint-webpack-plugin";

const styleRegex = /\.(less|css|scss|sass)$/;
const moduleRegex = /\.module\.(less|css|scss|sass)$/;

const cfg: StorybookConfig = {
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      savePropValueAsString: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: () => {
        return true;
      },
    },
  },
  addons: [],
  stories: ["../src/stories/*.stories.tsx"],
  docs: {
    autodocs: true,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      strictMode: true,
      legacyRootApi: false,
      builder: {
        fsCache: false,
        lazyCompilation: false,
      },
    },
  },
  core: {
    disableTelemetry: true, // 👈 Disables telemetry
    builder: {
      name: "@storybook/builder-webpack5",
      options: {
        fsCache: false,
        lazyCompilation: false,
      },
    },
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@src"] = path.resolve(__dirname, "../src/");

    config.resolve.modules = [
      path.resolve(__dirname, "../node_modules"),
      "node_modules",
    ];

    config.module!.rules = (config.module!.rules || []).concat([
      {
        test: /\.test\.(ts|tsx)$/,
        use: "ignore-loader",
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: [/node_modules/, /test\.ts$/, /test\.tsx$/],
        use: {
          loader: "ts-loader",
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        sideEffects: true,
        test: styleRegex,
        exclude: moduleRegex,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              esModule: true,
              modules: {
                namedExport: false,
                mode: "icss",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["autoprefixer"],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                implementation: require("sass"),
                includePaths: [
                  require("path").resolve(__dirname, "node_modules"),
                ],
              },
            },
          },
        ],
      },
      {
        sideEffects: true,
        test: moduleRegex,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              esModule: true,
              modules: {
                exportLocalsConvention: "camelCase",
                namedExport: false,
                mode: "local",
                localIdentName: "[local]___[hash:base64:5]",
              },
            },
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                implementation: require("sass"),
                includePaths: [
                  require("path").resolve(__dirname, "node_modules"),
                ],
              },
            },
          },
        ],
      },
    ]);

    config.plugins = (config.plugins || []).concat([
      new ESLintPlugin({ extensions: ["ts", "tsx"], configType: "flat" }),
      new StylelintPlugin(),
      new ForkTsCheckerWebpackPlugin(),
    ]);

    config.mode = "none";

    // Return the altered config
    return config;
  },
};

export default cfg;
