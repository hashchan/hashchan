import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, createRef, useRef, useEffect } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'
import { useContracts } from '@/hooks/useContracts'
import { IDBContext } from '@/provider/IDBProvider'
import { useParams } from 'react-router-dom'
import sanitizeMarkdown from 'sanitize-markdown'
import { parseContent } from '@/utils/content'
import { tryRecurseBlockFilter } from '@/utils/blockchain'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'

interface Post {
	creator: string
	postId?: string
	threadId?: string
	imgUrl: string
	imgCID: string
	content: string
	timestamp: number
	replies: Array<{ ref: any; id: string }>
	janitoredBy: any[]
	ref: any
	replyIds: string[]
}

const createQueryKey = (threadId: string | undefined, chainId: string | undefined, blockNumber: bigint | undefined) => {
	return ['thread', threadId, chainId, blockNumber ? Number(blockNumber) : undefined] as const
}

export const useThread = () => {
	const { chainId: chainIdParam, boardId: boardIdParam, threadId: threadIdParam } = useParams()
	const { db } = useContext(IDBContext)
	const { moderationServices, orbitDbs } = useContext(ModerationServicesContext)
	const { address, chain } = useAccount()
	const blockNumber = useBlockNumber()
	const publicClient = usePublicClient()
	const { hashchan } = useContracts()
	const queryClient = useQueryClient()
	const unwatchRef = useRef<(() => void) | null>(null)

	// Main query for thread and posts
	const {
		data: { posts = [], isReducedMode = false } = {},
		error,
		isLoading,
	} = useQuery({
		queryKey: createQueryKey(threadIdParam, chainIdParam, blockNumber.data),
		queryFn: async () => {
			// Initialize refs and logs objects
			const refsObj: Record<string, any> = {}
			const logsObj: Record<string, Post> = {}

			// Get cached thread or fetch from chain
			const cachedThread = await db.threads.where('threadId').equals(threadIdParam).first()
			let thread

			if (cachedThread) {
				thread = {
					lastSynced: cachedThread.lastSynced,
					creator: cachedThread.creator,
					threadId: cachedThread.threadId,
					imgUrl: cachedThread.imgUrl,
					imgCID: cachedThread.imgCID,
					content: sanitizeMarkdown(cachedThread.content, { allowedTags: ['p', 'div', 'img'] }),
					replies: [],
					janitoredBy: [],
					timestamp: Number(cachedThread.timestamp)
				}
			} else {
				const filterArgs = {
					address: hashchan.address,
					abi: hashchan.abi,
					eventName: 'NewThread',
					args: { id: threadIdParam },
					fromBlock: 0n,
					toBlock: blockNumber.data
				}

				const { filter: threadFilter, isReduced: isThreadReduced } = 
					await tryRecurseBlockFilter(publicClient, filterArgs)

				const threadLogs = await publicClient.getFilterLogs({ filter: threadFilter })
				const { creator, content, threadId, imgUrl, imgCID, replyIds, timestamp } = threadLogs[0].args

				thread = {
					lastSynced: 0,
					creator,
					threadId,
					imgUrl,
					imgCID,
					replyIds,
					replies: [],
					janitoredBy: [],
					content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
					timestamp: Number(timestamp)
				}
			}

			// Set up refs and logs for thread
			refsObj[thread.threadId] = createRef()
			logsObj[thread.threadId] = {
				...thread,
				ref: refsObj[thread.threadId]
			}

			// Get and process cached posts
			let cachedPosts = await db.posts.where('threadId').equals(threadIdParam).sortBy('timestamp')

			cachedPosts = await Promise.all(
				cachedPosts.map(async (post) => ({
					...post,
					janitoredBy: (await Promise.all(
						Object.values(moderationServices).map(async (ms) => {
							const orbitDb = await orbitDbs[ms.address]
							if (orbitDb) {
								return await orbitDb.get(post.postId)
							}
						})
					)).filter(Boolean)
				}))
			)

			// Process cached posts
			cachedPosts.forEach((post) => {
				post.replies = []
				refsObj[post.postId] = createRef()
				logsObj[post.postId] = {
					...post,
					ref: refsObj[post.postId]
				}

				post.replyIds.forEach((replyId) => {
					if (logsObj[replyId]) {
						logsObj[replyId].replies.push({
							ref: refsObj[post.postId],
							id: post.postId
						})
					}
				})
			})

			// Check for new posts
			const postFilterArgs = {
				address: hashchan.address,
				abi: hashchan.abi,
				eventName: 'NewPost',
				args: { threadId: threadIdParam },
				fromBlock: BigInt(thread.lastSynced ? thread.lastSynced - 1 : 0),
				toBlock: blockNumber.data
			}

			const { filter, isReduced } = await tryRecurseBlockFilter(publicClient, postFilterArgs)
			const logs = await publicClient.getFilterLogs({ filter })

			// Process new posts
			for (const log of logs) {
				const { creator, postId, imgUrl, imgCID, content, replyIds, timestamp } = log.args

				if (!logsObj[postId]) {
					refsObj[postId] = createRef()

					const newPost = {
						creator,
						postId,
						imgUrl,
						imgCID,
						timestamp: Number(timestamp),
						replies: [],
						janitoredBy: [],
						content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
						ref: refsObj[postId],
						replyIds
					}

					logsObj[postId] = newPost

					replyIds.forEach((replyId) => {
						if (logsObj[replyId]) {
							logsObj[replyId].replies.push({
								ref: refsObj[postId],
								id: postId
							})
						}
					})

					// Add to database if not cached
					try {
						await db.posts.add({
							boardId: boardIdParam,
							threadId: threadIdParam,
							...newPost
						})
					} catch (e) {
						console.log('Duplicate post, skipping')
					}
				}
			}

			// Update thread's last synced time
			await db.threads.where('threadId').equals(threadIdParam).modify({
				lastSynced: Number(blockNumber.data)
			})

			return {
				posts: Object.values(logsObj),
				isReducedMode: isReduced
			}
		},
		enabled: Boolean(
			publicClient &&
				address &&
				hashchan &&
				threadIdParam &&
				chain?.id &&
				db &&
				boardIdParam &&
				blockNumber.data &&
				moderationServices
		)
	})

	// Set up real-time updates
	useEffect(() => {
		if (!hashchan || !threadIdParam || !db || !blockNumber.data) return

			const unwatch = publicClient.watchContractEvent({
				address: hashchan.address,
				abi: hashchan.abi,
				eventName: 'NewPost',
				fromBlock: blockNumber.data - 2n,
				args: { threadId: threadIdParam },
				onLogs: async (logs) => {
					const { creator, content, postId, imgUrl, imgCID, timestamp } = logs[0].args

					queryClient.setQueryData(
						createQueryKey(threadIdParam, chainIdParam, blockNumber.data),
						(old: { posts: Post[] } = { posts: [] }) => {
							const replyIds = parseContent(content)
							const newPost = {
								creator,
								postId,
								imgUrl,
								imgCID,
								content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
								timestamp: Number(timestamp),
								janitoredBy: [],
								replies: [],
								ref: createRef(),
								replyIds
							}

							// Update replies in existing posts
							const updatedPosts = old.posts.map(post => {
								if (replyIds.includes(post.postId || post.threadId || '')) {
									return {
										...post,
										replies: [...post.replies, { ref: newPost.ref, id: postId }]
									}
								}
								return post
							})

							return {
								...old,
								posts: [...updatedPosts, newPost]
							}
						}
					)

					// Add to database
					try {
						await db.posts.add({
							boardId: boardIdParam,
							threadId: threadIdParam,
							postId,
							creator,
							imgUrl,
							imgCID,
							content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
							timestamp: Number(timestamp),
							replyIds: parseContent(content)
						})
					} catch (e) {
						console.log('Duplicate post, skipping')
					}
				}
			})

			unwatchRef.current = unwatch

			return () => {
				if (unwatchRef.current) {
					unwatchRef.current()
					unwatchRef.current = null
				}
			}
	}, [hashchan, threadIdParam, db, blockNumber.data])

	return {
		posts,
		error,
		isLoading,
		isReducedMode
	}
}
