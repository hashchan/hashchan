import { CID  } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256  } from 'multiformats/hashes/sha2'

export const computeImageCID = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    const imageBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(imageBuffer)
    const hash = await sha256.digest(bytes)
    const imageCid = CID.create(1, raw.code, hash)
    return {
      cid: imageCid.toString(),
      error: null
    }

  } catch (e) {
    console.log('e', e)
    return {
      cid: null,
      error: e
    }
  }
}
