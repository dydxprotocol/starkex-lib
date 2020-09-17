// Use the base configuration as-is.
module.exports = {
  /* eslint-disable global-require */
  ...require('./node_modules/@dydxprotocol/node-service-base-dev/jest.config.js'),
  name: 'starkex-lib',
};
