import { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useThreads } from '@/hooks/HashChan/useThreads'
import { useReverseChunkedCursor } from '@/hooks/HashChan/useReverseChunkedCursor'
import { useAccount } from 'wagmi'
import { BoardHeader } from '@/components/BoardHeader'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { ChainSwitchNotification } from '@/components/ChainSwitchNotification'
import { ThreadsList } from '@/components/HashChan/ThreadsList'
import { ReverseChunkedCursor } from '@/components/ReverseChunkedCursor'
import { ForwardChunkedCursor } from '@/components/ForwardChunkedCursor'
import { ScanMap } from '@/components/HashChan/ScanMap'

export const Catalogue = () => {
	const { address } = useAccount()
	const { boardId } = useParams()
	const { threads = [], isLoading, error, isReducedMode } = useThreads()
	const cursor = useReverseChunkedCursor()

	return (
		<Fragment>
			<ChainSwitchNotification />
			<BoardHeader key={`board-${boardId}-catalogue`} />

			<div style={{ marginBottom: '20px' }}>
				<h3 style={{ display: "inline" }}>Catalogue</h3>
				{isReducedMode && <ReducedModeWarning />}
			</div>

			{cursor.isActive && (
				<div style={{ display: 'flex', alignItems: 'center', gap: `${1/Math.PHI**2}rem` }}>
					<ScanMap {...cursor} />
					<ReverseChunkedCursor {...cursor} />
				</div>
			)}
			{cursor.isForwardActive && <ForwardChunkedCursor {...cursor} />}
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
