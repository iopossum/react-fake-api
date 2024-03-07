const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackHarddiskPlugin = require("html-webpack-harddisk-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { merge } = require("webpack-merge");

// style files regexes
const styleRegex = /\.(less|css|scss|sass)$/;
const moduleRegex = /\.module\.(less|css|scss|sass)$/;

module.exports = (env, { mode }) => {
  const envCfg = {
    production: {
      devtool: "source-map",
      plugins: [],
    },
    development: {
      devtool: "eval-source-map",
      optimization: {},
      devServer: {
        historyApiFallback: true,
        static: {
          directory: path.join(__dirname, "dist"),
        },
        hot: true,
        port: 8081,
      },
      plugins: [new HtmlWebpackHarddiskPlugin()],
    },
  };

  const main = {
    entry: "./src/index.tsx",
    output: {
      path: path.join(__dirname, "../docs"),
      publicPath: "/",
      filename: "assets/bundle.[hash].js",
    },
    mode,
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
        {
          test: styleRegex,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                modules: {
                  exportLocalsConvention: "camelCase",
                  mode: (resourcePath) => {
                    if (moduleRegex.test(resourcePath)) {
                      return "local";
                    }

                    return "global";
                  },
                  localIdentName: "[local]___[hash:base64:5]",
                },
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      "autoprefixer",
                      {
                        overrideBrowserslist: ["> 1%", "last 4 versions"],
                      },
                    ],
                  ],
                },
              },
            },
            {
              loader: "sass-loader",
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx", ".json", ".css", ".less"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: `./src/index.html`,
        inject: "body",
        filename: `index.html`,
      }),
      new CleanWebpackPlugin({
        verbose: true,
        dry: false,
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "assets/[name].[hash].css",
        // chunkFilename: "[id].css"
      }),
    ],
  };

  return merge(main, envCfg[mode]);
};
