import { Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useThreads } from '@/hooks/HashChan/useThreads'
import { useAccount } from 'wagmi'
import { BoardHeader } from '@/components/BoardHeader'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'

interface Thread {
	threadId: string
	title: string
	imgUrl: string
	content: string
	janitoredBy: any[]
}

const ListItem = ({ thread }: { thread: Thread }) => {
	const { chainId, boardId } = useParams()
	const navigate = useNavigate()
	const { threadId, title, imgUrl, content, janitoredBy } = thread

	return (
		<div
			style={{
				filter: janitoredBy.length > 0 ? 'brightness(0%)' : 'none',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: "233px",
				height: "377px",
				cursor: 'pointer'
			}}
			onClick={() => navigate(`/chains/${chainId}/boards/${boardId}/threads/${threadId}`)}
		>
			<img
				style={{
					objectFit: 'contain',
					width: '100%',
				}}
				src={imgUrl}
				alt={title}
			/>
			<div 
				style={{
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					textAlign: 'center',
					display: '-webkit-box',
					WebkitLineClamp: '3',
					WebkitBoxOrient: 'vertical',
					width: '100%',
					height: '100%',
				}}
			>
				<p style={{ fontSize: '14px' }}>
					<b>{title}</b>
					{content}
				</p>
			</div>
		</div>
	)
}

const ThreadsList = ({ threads }: { threads: Thread[] }) => {
	if (!threads.length) {
		return <p>Nothing here yet, be the first to post</p>
	}

	return (
		<div
			style={{
				width: '95vw',
				display: 'flex',
				flexWrap: 'wrap',
				flexDirection: 'row',
				gap: '10px',
			}}
		>
			{threads.map((thread) => (
				<ListItem 
					key={thread.threadId} 
					thread={thread}
				/>
			))}
		</div>
	)
}

const LoadingState = () => (
	<div style={{ padding: '20px' }}>
		Loading threads...
	</div>
)

const ErrorState = ({ error }: { error: Error }) => (
	<div style={{ 
		padding: '20px',
		color: 'red' 
		}}>
		Error loading threads: {error.message}
	</div>
)

const WalletRequiredState = () => (
	<div style={{ padding: '20px' }}>
		You need an ethereum RPC connection to scrape logs, please connect an ethereum client like metamask
	</div>
)

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
			<BoardHeader key={`board-${boardId}-catalogue`} />

			<div style={{ marginBottom: '20px' }}>
				<h3 style={{ display: "inline" }}>Catalogue</h3>
				{isReducedMode && <ReducedModeWarning />}
			</div>

			{!address ? (
				<WalletRequiredState />
			) : isLoading ? (
				<LoadingState />
			) : error ? (
				<ErrorState error={error as Error} />
			) : (
				<ThreadsList threads={threads} />
			)}
		</Fragment>
	)
}
