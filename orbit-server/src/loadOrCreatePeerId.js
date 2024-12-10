import { keys } from '@libp2p/crypto'
import * as fs from "node:fs"
import { createEd25519PeerId  } from '@libp2p/peer-id-factory'

const PEER_ID_FILE = './hashchan/peer-id.json'

export const loadOrCreatePeerId = async () => {
  try {
    const peerId = fs.readFileSync(PEER_ID_FILE, { encoding: 'utf-8' })
    console.log(JSON.parse(peerId))
    return peerId
  } catch (e) {
    const peerId = await createEd25519PeerId()
    fs.writeFileSync(PEER_ID_FILE, JSON.stringify(peerId.toJSON()))
    return peerId

  }

}
