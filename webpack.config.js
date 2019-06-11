module.exports = {
  devtool: "inline-source-map",
  output: {
    globalObject: "this"
  },
  module: {
    rules: [
      { test: /\.(jpg|gif|png|pdf)$/, use: "file-loader" },
      {
        test: /\.worker\.js$/,
        use: "worker-loader"
      },
      {
        test: /\.(html)$/,
        use: {
          loader: "html-loader"
        }
      }
    ]
  }
};
