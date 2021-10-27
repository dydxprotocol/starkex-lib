const path = require('path');

module.exports = {
  mode: 'production',
  entry: './build/src/helpers/crypto.js',
  output: {
    filename: 'starkex-lib.js',
    path: path.resolve(__dirname, 'build'),
    library: {
      name: 'StarkexLib',
      type: 'global',
    },
  },
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'), // Note: Trailing slash required.
    },
  },
};