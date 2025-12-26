import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useContext, createRef, useRef, useEffect } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'
import { useContracts } from '@/hooks/useContracts'
import { IDBContext } from '@/provider/IDBProvider'
import { useParams } from 'react-router-dom'
import sanitizeMarkdown from 'sanitize-markdown'
import { parseContent } from '@/utils/content'
import { tryRecurseBlockFilter } from '@/utils/blockchain'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'
import { useBoard } from '@/hooks/HashChan/useBoard'

interface Post {
	creator: string
	postId?: string
	threadId?: string
	imgUrl: string
	imgCID: string
	content: string
	timestamp: number
	bookmarked: number
	replies: Array<{ ref: any; id: string }>
	janitoredBy: any[]
	ref: any
	replyIds: string[]
}

const createQueryKey = (
  chainId: string | undefined,
  boardId: string | undefined,
  threadId: string | undefined,
  blockNumber: number | undefined
) => {
  return ['chain', chainId, 'board', boardId, 'thread', threadId, blockNumber ? Number(blockNumber) : undefined] as const
}

const SANITIZE_CONFIG = {
	allowedTags: ['p', 'div', 'img'],
	allowedAttributes: {
		img: ['src', 'alt'],
		p: [],
		div: []
	}
} as const

const debugEnabledConditions = (
  publicClient: any,
  address: string | undefined,
  hashchan: any,
  threadIdParam: string | undefined,
  chainId: number | undefined,
  db: any,
  boardIdParam: string | undefined,
  blockNumber: bigint | undefined,
) => {
  const conditions = {
    publicClient: Boolean(publicClient),
    address: Boolean(address),
    hashchan: Boolean(hashchan),
    threadIdParam: Boolean(threadIdParam),
    chainId: Boolean(chainId),
    db: Boolean(db),
    boardIdParam: Boolean(boardIdParam),
    blockNumber: Boolean(blockNumber),
  }
  
  const allEnabled = Object.values(conditions).every(Boolean)
  
  if (!allEnabled) {
    console.log('[useThread] Query disabled. Conditions:', conditions)
  }
  
  return allEnabled
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
	const { updateMetadata } = useBoard()

	// Main query for thread and posts
	const {
		data: { posts = [], isReducedMode = false } = {},
		error,
		isLoading,
	} = useQuery({
		queryKey: createQueryKey(chainIdParam, boardIdParam, threadIdParam, Number(blockNumber.data)),
		queryFn: async () => {
			console.log('fetching thread', threadIdParam)
			// Initialize refs and logs objects
			const refsObj: Record<string, any> = {}
			const logsObj: Record<string, Post> = {}

			// Get cached thread or fetch from chain
			const cachedThread = await db.threads.where('threadId').equals(threadIdParam).first()
			let thread

			if (cachedThread) {
				console.log('cached thread detected', cachedThread)
				thread = {
					lastSynced: cachedThread.lastSynced,
					creator: cachedThread.creator,
					threadId: cachedThread.threadId,
					imgUrl: cachedThread.imgUrl,
					imgCID: cachedThread.imgCID,
					content: sanitizeMarkdown(cachedThread.content, SANITIZE_CONFIG),
					bookmarked: cachedThread.bookmarked,
					replies: [],
					janitoredBy: [],
					timestamp: Number(cachedThread.timestamp)
				}
			} else {
				console.log('no cached thread detected, fetching from chain')
				const filterArgs = {
					address: hashchan.address,
					abi: hashchan.abi,
					eventName: 'NewThread',
					args: { threadId: threadIdParam },
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
					content: sanitizeMarkdown(content, SANITIZE_CONFIG),
					bookmarked: 0,
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
			if (moderationServices != null) {
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
			}

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
						bookmarked: 0,
						content: sanitizeMarkdown(content, SANITIZE_CONFIG),
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

			// Update board's post count using the mutation
			if (logs.length > 0) {
				updateMetadata({ postCount: logs.length })
			}

			return {
				posts: Object.values(logsObj),
				isReducedMode: isReduced
			}
		},
		enabled: debugEnabledConditions(
			publicClient,
			address,
			hashchan,
			threadIdParam,
			chain?.id,
			db,
			boardIdParam,
			blockNumber.data,
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

					const sanitizedContent = sanitizeMarkdown(content, SANITIZE_CONFIG)
					const replyIds = parseContent(sanitizedContent)	
					const newPost = {
						creator,
						postId: String(postId),
						imgUrl,
						imgCID,
						content: sanitizedContent,
						timestamp: Number(timestamp),
						janitoredBy: [],
						bookmarked: 0,
						replies: [],
						ref: createRef(),
						replyIds
					}

					queryClient.setQueryData(
						createQueryKey(chainIdParam, boardIdParam, threadIdParam, Number(blockNumber.data)),
						(old: { posts: Post[] } = { posts: [] }) => {
							// Update replies in existing posts
							const updatedPosts = old.posts.map(post => {
								if (newPost.replyIds.includes(post.postId || post.threadId || '')) {
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
							postId: String(postId),
							creator,
							imgUrl,
							imgCID,
							bookmarked: 0,
							content: sanitizedContent,
							timestamp: Number(timestamp),
							replyIds: parseContent(sanitizedContent)
						})

						updateMetadata({ postCount: 1 })

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

	// Bookmark mutation
	const bookmarkMutation = useMutation({
		mutationFn: async ({ threadId, postId }: {
			threadId: string
			postId: string
		}) => {
			console.log('bookmarking', threadId, postId)
			// Determine if this is a thread (postId === threadId) or a post
			const isThread = postId === threadId
			
			if (isThread) {
				// Handle thread bookmark
				const currentThread = await db.threads.where('threadId').equals(threadId).first()
				if (currentThread) {
					const newBookmarkStatus = currentThread.bookmarked === 1 ? 0 : 1
					await db.threads.where('threadId').equals(threadId).modify({
						bookmarked: newBookmarkStatus
					})
					return { type: 'thread', id: threadId, bookmarked: newBookmarkStatus }
				}
			} else {
				// Handle post bookmark
				const currentPost = await db.posts.where('postId').equals(postId).first()
				if (currentPost) {
					const newBookmarkStatus = currentPost.bookmarked === 1 ? 0 : 1
					await db.posts.where('postId').equals(postId).modify({
						bookmarked: newBookmarkStatus
					})
					return { type: 'post', id: postId, bookmarked: newBookmarkStatus }
				}
			}
		},
		onError: (error) => {
			console.log('bookmark error', error)
		},
		onSuccess: (result) => {
			if (result) {
				// Update the query cache to reflect the bookmark change
				queryClient.setQueryData(
					createQueryKey(chainIdParam, boardIdParam, threadIdParam, Number(blockNumber.data)),
					(old: { posts: Post[] } = { posts: [] }) => {
						const updatedPosts = old.posts.map(post => {
							const postIdentifier = post.postId || post.threadId
							if (postIdentifier === result.id) {
								return {
									...post,
									bookmarked: result.bookmarked
								}
							}
							return post
						})
						
						return {
							...old,
							posts: updatedPosts
						}
					}
				)

				// Invalidate bookmarks query to update the Bookmarks page
				queryClient.invalidateQueries({
					queryKey: ['bookmarked-posts', chainIdParam, boardIdParam]
				})
			}
		}
	})

	return {
		posts,
		error,
		isLoading,
		isReducedMode,
		bookmark: bookmarkMutation.mutate
	}
}
