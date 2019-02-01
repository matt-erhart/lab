module.exports = {
  output: {
    globalObject: "this"
  },
  module: {
    rules: [{ test: /\.(jpg|gif|png|pdf)$/, use: "file-loader" }]
  }
};
