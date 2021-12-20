<p align='center'><img src='https://s3.amazonaws.com/dydx-assets/dydx_logo_black.svg' width='256' /></p>

<div align='center'>
  <a href='https://circleci.com/gh/dydxprotocol/workflows/starkex-lib/tree/master'>
    <img src='https://img.shields.io/circleci/project/github/dydxprotocol/starkex-lib.svg?token=446e78d103fea7b64b2e490215ce2a9669431c96' alt='CircleCI Status' />
  </a>
  <a href='https://coveralls.io/github/dydxprotocol/starkex-lib'>
    <img src='https://coveralls.io/repos/github/dydxprotocol/starkex-lib/badge.svg?t=xQcJRh' alt='Coverage Status' />
  </a>
  <a href='https://www.npmjs.com/package/@dydxprotocol/starkex-lib'>
    <img src='https://img.shields.io/npm/v/@dydxprotocol/starkex-lib.svg' alt='NPM'/>
  </a>
  <a href='https://github.com/dydxprotocol/starkex-lib/blob/master/LICENSE'>
    <img src='https://img.shields.io/github/license/dydxprotocol/starkex-lib.svg' alt='License' />
  </a>
</div>
<br>

Cryptographic functions for dYdX (v3 API).

Draws from [starkex-resources](https://github.com/starkware-libs/starkex-resources) for the cryptographic primitives.

## Goal

Create a single js file to be loadable and runnable from native code in iOS and Android, to derive public key from private key

## Browsify
Ended up not using webpack. Keep the instruction here if we need to expand the usage. Use Browsify instead
browserify ./build/src/helpers/crypto.js --standalone StarkHelper > ./build/starkex-lib.js


## Notes about signing
starkex-lib has its own string enum for the markets, which creates a problem for mobile apps when new markets are added. instead
of using sign(...) to sign an order, use signWithResolution(...) instead. It takes the market label and resolution instead of 
the internal lookup table. The resolution is in the markets payload in the form of 1xxxxx. It needs to be transformed into a counter
such as 6. The asset param needs to be the asset symbol instead of market, such as 'ETH' 


## To use in native code (iOS)
context.evaluateScript("var helper = new StarkHelper.StarkHelper()")
let jsValue = context.evaluateScript("helper.publicKeyAndYCoordiante('58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3')")
return jsValue?.toString() // returns a comma deliminated string, or
return jsValue?.toArray() // returns a [string]




## Kept webpack documentation for reference in the future. Not used
## Installation

```bash
npm install @dydxprotocol/starkex-lib
```

## Bundle for Mobile or Web using Webpack

```bash
npm install
npm run compile  # Compile TypeScript to JavaScript.
npx webpack      # Bundle JavaScript to a single file.
```

This will build the following output files in the `build/` directory:
* `starkex-lib.js`
* `starkex-lib.js.LICENSE.txt`


You may want to play around with the `output.library.type` option in [webpack.config.js](./webpack.config.js) to expose the `StarkexLib` library object in the right way for your platform.

Please remember to include the license with any distributions of the software. **IMPORTANT TODO: Make sure the license for Starkware's code is included correctly.**

Known warnings during bundling -- these can be safely ignored:

```
Module not found: Error: Can't resolve 'worker_threads'
Module not found: Error: Can't resolve './hash-in-worker-thread'
WARNING in asset size limit
WARNING in entrypoint size limit:
WARNING in webpack performance recommendations
```
