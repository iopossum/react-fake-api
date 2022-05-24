const webpack = require('webpack');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');
const path = require('path');

// style files regexes
const styleRegex = /\.(less|css|scss|sass)$/;
const moduleRegex = /\.module\.(less|css|scss|sass)$/;

module.exports = (env, { mode }) => {

  const envCfg = {
    production: {
      devtool: 'source-map',
      plugins: []
    },
    development: {
      devtool: 'eval-source-map',
      optimization: {},
      devServer: {
        historyApiFallback: true,
        static: {
          directory: path.join(__dirname, 'dist'),
          watch: false,
        },
        hot: 'only',
        port: 8081
      },
      plugins: [
        new HtmlWebpackHarddiskPlugin(),
      ]
    }
  };

  const main = {
    entry: './src/index.js',
    output: {
      path: __dirname + '/dist',
      publicPath: '/',
      filename: 'assets/bundle.[hash].js'
    },
    mode,
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          include: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "../src"),
          ],
          use: {
            loader: 'ts-loader'
          }
        },
        {
          sideEffects: true,
          test: styleRegex,
          use: [
            'style-loader',
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
                  localIdentName: "[name]__[local]___[hash:base64:5]",
                },
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      "autoprefixer",
                      {
                        'overrideBrowserslist': ['> 1%', 'last 4 versions']
                      },
                    ],
                  ],
                }
              }
            },
            {
              loader: 'sass-loader',
            },
          ],
        },
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.css', '.less'],
      alias: {
        'react-dom': path.resolve('./node_modules/@hot-loader/react-dom'),
        react: path.resolve('./node_modules/react'),
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: `./src/index.html`,
        inject: 'body',
        filename: `index.html`
      }),
      new CleanWebpackPlugin({
        verbose: true,
        dry: false
      })
    ]
  };

  return merge(main, envCfg[mode]);
};
