const {
  createTypeScriptImportResolver,
} = require("eslint-import-resolver-typescript");
const plugin = require("eslint-plugin-awesome-code");
const onlyWarn = require("eslint-plugin-only-warn");
const sonarjs = require("eslint-plugin-sonarjs");
const globals = require("globals");

module.exports = plugin.configs.flat["recommended-all"].concat([
  sonarjs.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "eslint-plugin-only-warn": onlyWarn,
    },
    rules: {
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "@storybook/react**",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "react**",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "@src/components/**",
              group: "parent",
              position: "before",
            },
            {
              pattern: "@src/types",
              group: "parent",
              position: "before",
            },
            {
              pattern: "@src/types/**",
              group: "parent",
              position: "before",
            },
            {
              pattern: "@src/utils/**",
              group: "parent",
              position: "before",
            },
            {
              pattern: "./**.scss",
              group: "index",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
            orderImportKind: "desc",
          },
        },
      ],
      "sonarjs/no-unused-vars": 0,
      "sonarjs/mouse-events-a11y": 0,
      "sonarjs/no-ignored-exceptions": 0,
      "sonarjs/no-array-index-key": 0,
      "sonarjs/no-misused-promises": 0,
      "sonarjs/slow-regex": 0,
    },
    settings: {
      "import/resolver-next": [
        createTypeScriptImportResolver({
          project: "./",
        }),
      ],
    },
  },
]);
