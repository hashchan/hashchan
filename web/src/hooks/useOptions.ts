import {
    useState,
    useEffect,
    useCallback,
    useContext
} from 'react'
import { IDBContext, type Settings } from '@/provider/IDBProvider'


export const useOptions = () => {
    const { db } = useContext(IDBContext)
    const [options, setOptions] = useState<Settings>()

    const fetchOptions = useCallback(async () => {
        if (!db) return
        const options = await db.settings.get(1)
        console.log('options', options)
        setOptions(options)
    }, [db])

    const updateOptions = useCallback(async (defaultTipAmount, indexingStrategy) => {
        if (!db || !options) return

        const newOptions: Settings = options
        newOptions.defaultTipAmount = defaultTipAmount
        newOptions.indexingStrategy = indexingStrategy
        try {
            await db.settings.update(1, newOptions)
        } catch (e) {
            console.error(e)
        }
        setOptions(newOptions)
    }, [db])

    useEffect(() => {
        if (db) {
            fetchOptions()
        }
    }, [db])

    return {
        options,
        fetchOptions,
        updateOptions
    }
}