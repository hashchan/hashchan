import {
	useState,
	useContext,
	useCallback
} from 'react'

import {
	HeliaContext,
} from '@/provider/HeliaProvider'

import { CID  } from 'multiformats/cid'
import { detectFileType } from '@/utils/detectFileType'

// Default cap on how long we'll wait on the in-browser libp2p node's
// DHT/bitswap lookup before giving up. HeliaProvider's transports
// (websockets/webRTC/circuit-relay) can't reach every peer on the network
// (see network fragmentation notes on the Kubo pinning provider) — without a
// timeout, a miss just hangs forever instead of letting a caller fall back
// to a connected Kubo node.
const DEFAULT_FETCH_TIMEOUT_MS = 8000

export const useHelia = () => {
	const {helia, fs} = useContext(HeliaContext)
	const [logErrors, setLogErrors] = useState([])

	const fetchCID = useCallback(async (cidString: string, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) => {
		if (helia && fs && cidString?.length > 0 ) {
			const controller = new AbortController()
			const timeout = setTimeout(() => controller.abort(), timeoutMs)
			try {
				console.log('cidString', cidString)
				const cid = CID.parse(cidString)
				console.log('cid', cid)
				// fs.cat() returns an async iterable, not a promise - iterate over it
				const chunks: Uint8Array[] = []
				for await (const chunk of fs.cat(cid, { signal: controller.signal })) {
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
			} finally {
				clearTimeout(timeout)
			}
      return {
        blob: null,
        type: null
      }
		}
		return {
			blob: null,
			type: null
		}
	}, [helia, fs])

	return {
		fetchCID,
		logErrors
	}
}
