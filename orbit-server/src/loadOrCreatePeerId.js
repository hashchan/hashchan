import { keys } from '@libp2p/crypto'
import * as fs from "node:fs"
import { createEd25519PeerId, createFromPrivKey  } from '@libp2p/peer-id-factory'
import { base58btc } from 'multiformats/bases/base58'
import { account } from './config.js'
const key = process.env.OWNER_KEY
export const loadOrCreatePeerId = async () => {


  const cleanKey = key.startsWith('0x') ? key.slice(2) : key

  const keyBuffer = new Uint8Array(Buffer.from(cleanKey, 'hex'))
  const keyPair = await keys.generateKeyPairFromSeed('Ed25519', keyBuffer)
  //const libp2pKey = await crypto.keys.privateKeyFromProtobuf(keyBuffer)
  const peerId = await createEd25519PeerId({privateKey: keyPair.private})
  console.log('peerId', peerId)

  return {
    id: peerId.toString(),
    publicKey: base58btc.encode(peerId.publicKey),
    privateKey: base58btc.encode(peerId.privateKey),
    ethAddress: account.address,
    type: 'eth-key'
  }
}
