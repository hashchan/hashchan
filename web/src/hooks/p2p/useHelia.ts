import {
	useState,
	useContext,
	useCallback
} from 'react'

import {
	HeliaContext,
} from '@/provider/HeliaProvider'

import { CID  } from 'multiformats/cid'

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



export const useHelia = () => {
	const {helia, fs} = useContext(HeliaContext)
	const [logErrors, setLogErrors] = useState([])

	const fetchCID = useCallback(async (cidString: string) => {
		if (helia && fs && cidString?.length > 0 ) {
			try {
				console.log('cidString', cidString)
				const cid = CID.parse(cidString)
				console.log('cid', cid)
				// fs.cat() returns an async iterable, not a promise - iterate over it
				const chunks: Uint8Array[] = []
				for await (const chunk of fs.cat(cid)) {
					chunks.push(chunk)
				}
				// Combine all chunks into a single Uint8Array
				const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
				const bytes = new Uint8Array(totalLength)
				let offset = 0
				for (const chunk of chunks) {
					bytes.set(chunk, offset)
					offset += chunk.length
				}
				// Detect file type first
				const type = detectFileType(bytes)
				// Create blob from bytes with proper MIME type
				const blob = new Blob([bytes], { type })
				console.log('Created blob', { blobSize: blob.size, type, bytesLength: bytes.length })
				return { blob, type }

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
