import {
	useEffect,
	useState,
	useContext,
	useCallback
} from 'react'

import {
	HeliaContext,
} from '@/provider/HeliaProvider'



export const useOrbitDB = () => {
	const {db} = useContext(HeliaContext)
	const [logErrors, setLogErrors] = useState([])

	const fetchCID = useCallback(async (cidSting: string) => {
	}, [helia, fs])

	return {
		fetchCID,
		logErrors
	}
}
