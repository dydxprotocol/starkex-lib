const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: "starkex.js"
  },
  resolve: {
    fallback: {
        "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
       "crypto": require.resolve("crypto-browserify"),
    },
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};