import {
	useEffect,
	useState,
	useContext,
	useCallback
} from 'react'

import {
	HeliaContext,
} from '@/provider/HeliaProvider'

import { CID  } from 'multiformats/cid'
import { getCodec, getName  } from 'multiformats/multicodec'

import * as base32 from 'multiformats/bases/base32'
import * as raw from 'multiformats/codecs/raw'
import { sha256  } from 'multiformats/hashes/sha2'

function detectFileType(bytes) {
	const signatures = {
		'image/jpeg': [[0xFF, 0xD8, 0xFF]],
		'image/png': [[0x89, 0x50, 0x4E, 0x47]],
		'image/gif': [[0x47, 0x49, 0x46, 0x38]],
		'image/webp': [[0x52, 0x49, 0x46, 0x46]]

	}

	for (const [mimeType, sigs] of Object.entries(signatures)) {
		for (const sig of sigs) {
			if (sig.every((byte, i) => bytes[i] === byte)) {
				return mimeType

			}

		}

	}

	return 'application/octet-stream'

}


function iteratorToStream(asyncIterator) {
	return new ReadableStream({
		async pull(controller) {
			try {
				const { value, done  } = await asyncIterator.next()
				if (done) {
					controller.close()

				} else {
					controller.enqueue(value)

				}

			} catch (error) {
				controller.error(error)

			}

		}

	})

}


export const useHelia = () => {
	const {helia, fs} = useContext(HeliaContext)
	const [logErrors, setLogErrors] = useState([])

	const fetchCID = useCallback(async (cidSting: string) => {
		console.log('helia', helia)
		if (helia && fs) {
			try {
				const cid = CID.parse(cidSting)
				console.log('cid.code', cid.code)

				console.log('trying to get')
				const res = await fs.cat(cid)
				const stream = iteratorToStream(res)
				// Create blob from stream
				const response = new Response(stream)
				const blob = await response.blob()
		
				return { blob, type:null }

			} catch (e) {
				console.log('e', e)
				setLogErrors(old => [...old, e])
			}
      return {
        blob: null,
        type: null
      }
		}
	}, [helia, fs])

	return {
		fetchCID,
		logErrors
	}
}
