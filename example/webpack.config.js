const webpack = require('webpack');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');
const path = require('path');

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
        },
        hot: true,
        port: 8081
      },
      plugins: [
        new HtmlWebpackHarddiskPlugin(),
      ]
    }
  };

  const main = {
    entry: './src/index.tsx',
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
          use: {
            loader: 'ts-loader'
          }
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.css', '.less'],
      alias: {
        'react-dom': '@hot-loader/react-dom'
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
