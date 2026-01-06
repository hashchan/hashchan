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
		// Images
		'image/jpeg': [[0xFF, 0xD8, 0xFF]],
		'image/png': [[0x89, 0x50, 0x4E, 0x47]],
		'image/gif': [[0x47, 0x49, 0x46, 0x38]],
		'image/webp': [[0x52, 0x49, 0x46, 0x46]],
		// Videos
		'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]],
		'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
		'video/x-matroska': [[0x1A, 0x45, 0xDF, 0xA3]], // MKV (same as WebM container)
		// Block SVG explicitly (XSS risk)
		'image/svg+xml': [[0x3C, 0x73, 0x76, 0x67], [0x3C, 0x3F, 0x78, 0x6D, 0x6C]], // <svg or <?xml
		// Block PDF explicitly (RCE risk)
		'application/pdf': [[0x25, 0x50, 0x44, 0x46, 0x2D]] // %PDF-
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
