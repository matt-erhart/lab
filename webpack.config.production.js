var path = require('path');
var webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',

  output: {
    filename: 'static/bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          { loader: 'ts-loader', options: { happyPackMode: true } }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(pdf|jpg|gif|png)$/,
        use: {
          loader: "file-loader",
          options: {
            name(file) {
              return "[hash].[ext]";
            }
          }
        }
      }
    ]
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({
      tslint: false,
      checkSyntacticErrors: false
    }),
  ],

  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
};
