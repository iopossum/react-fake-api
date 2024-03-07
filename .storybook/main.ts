import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";

const cfg: StorybookConfig = {
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      savePropValueAsString: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        return true;
      },
    },
  },
  addons: ["@storybook/preset-create-react-app"],
  stories: ["../src/stories/*.stories.tsx"],
  core: {
    disableTelemetry: true, // 👈 Disables telemetry
  },
  features: {
    storyStoreV7: true,
  },
  docs: {
    autodocs: true,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      builder: {
        fsCache: true,
        lazyCompilation: true,
      },
    },
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@src"] = path.resolve(__dirname, "../src/");
    // config.resolve.alias['react'] = path.resolve(__dirname, '../node_modules/react');
    // config.resolve.alias['react-dom'] = path.resolve(__dirname, '../node_modules/react-dom');
    // config.resolve.alias['miragejs/server'] = path.resolve(__dirname, '../node_modules/miragejs');
    // config.resolve.alias['antd'] = path.resolve(__dirname, '../node_modules/antd');

    config.resolve.modules = [
      path.resolve(__dirname, "../node_modules"),
      "node_modules",
    ];

    // Return the altered config
    return config;
  },
};

export default cfg;
