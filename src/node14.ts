import crypto from 'crypto'

// Added in Node15
if (!global.AbortController) {
  Object.assign(global, require('node-abort-controller'))
}

// Added in Node15
if (!crypto.webcrypto) {
  const { Crypto } = require('@peculiar/webcrypto')
  crypto.webcrypto = new Crypto()
}
