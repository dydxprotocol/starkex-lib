import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'

import { generateKeyPairFromEntropy } from '../src'

const ONBOARDING_MESSAGE = 'dYdX Onboarding'

// Ganache default mnemonic (INSECURE).
const MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

// Temporary Infura URL
const ETHEREUM_HTTP_NODE_MAINNET = 'https://mainnet.infura.io/v3/e0165907263a4c5c81283c1e8e235f76'

const provider = new HDWalletProvider(MNEMONIC, ETHEREUM_HTTP_NODE_MAINNET)
const web3 = new Web3(provider)

;(async () => {

  // Use an example Ethereum account.
  const [account] = await web3.eth.getAccounts()

  // Sign the onboarding message using the Ethereum key pair.
  // The result is a 65-byte string.
  const signature = await web3.eth.sign(ONBOARDING_MESSAGE, account)

  // Generate the STARK key pair.
  // This key pair is recoverable since it is deterministic based on the Ethereum key pair.
  const starkKeyPair = generateKeyPairFromEntropy(signature.slice(2, 66))

  // Generate the API key pair.
  // This key pair is recoverable since it is deterministic based on the Ethereum key pair.
  const apiKeyPair = generateKeyPairFromEntropy(signature.slice(66, 130))

  console.log('starkKeyPair', starkKeyPair)
  console.log('apiKeyPair', apiKeyPair)

  // User calls /v3/onboarding with an Ethereum public key, STARK public key, and API public key.
  // If called by the frontend, the STARK public key and API public key will be as derived above.
  // These aren't validated however, so a user calling the API directly/programatically could pass
  // in whatever public keys they choose.
  //
  // The server will simply validate that `signature` is ONBOARDING_MESSAGE, signed by the provided
  // Ethereum account.

})()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
