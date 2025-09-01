import { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/HashChan/useThreads'
import { useAccount } from 'wagmi'
import { BoardHeader } from '@/components/BoardHeader'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { ChainSwitchNotification } from '@/components/ChainSwitchNotification'
import { ThreadsList } from '@/components/HashChan/ThreadsList'

export const Catalogue = () => {
	const { address } = useAccount()
	const { boardId } = useParams()
	const { 
		threads = [], 
		isLoading, 
		error, 
		isReducedMode 
	} = useThreads()

	return (
		<Fragment>
			<ChainSwitchNotification />
			<BoardHeader key={`board-${boardId}-catalogue`} />

			<div style={{ marginBottom: '20px' }}>
				<h3 style={{ display: "inline" }}>Catalogue</h3>
				{isReducedMode && <ReducedModeWarning />}
			</div>

			<ThreadsList 
				threads={threads}
				isLoading={isLoading}
				error={error}
				address={address}
				isReducedMode={isReducedMode}
			/>
		</Fragment>
	)
}
