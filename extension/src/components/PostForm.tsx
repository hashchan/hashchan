import { useState, useEffect, useRef } from 'react'
import MarkdownEditor from '@uiw/react-markdown-editor'
import { useQueryClient } from '@tanstack/react-query'
import { useCreatePost, parseContent } from '@hashchan/hooks'
import { TxResponse } from './TxResponse'

export const PostForm = ({
  boardId,
  chainId,
  threadId,
  initialContent,
  onClose,
}: {
  boardId: number
  chainId: number
  threadId: string
  initialContent?: string
  onClose: () => void
}) => {
  const [content, setContent] = useState(initialContent ?? '')
  const [wait, setWait] = useState(0)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { hash, logErrors, status, createPost } = useCreatePost(boardId, chainId, threadId)
  const queryClient = useQueryClient()

  const threadQueryKey = ['chain', chainId, 'board', boardId, 'thread', threadId]

  useEffect(() => { setContent(initialContent ?? '') }, [initialContent])

  useEffect(() => {
    if (containerRef.current) {
      const root = containerRef.current.getRootNode()
      if (root instanceof ShadowRoot) setShadowRoot(root)
    }
  }, [])

  // Stop keyboard events from bubbling to the host page's listeners
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const stop = (e: KeyboardEvent) => e.stopPropagation()
    el.addEventListener('keydown', stop, true)
    el.addEventListener('keyup', stop, true)
    el.addEventListener('keypress', stop, true)
    return () => {
      el.removeEventListener('keydown', stop, true)
      el.removeEventListener('keyup', stop, true)
      el.removeEventListener('keypress', stop, true)
    }
  }, [])

  const onSubmit = async () => {
    if (!content.trim()) return
    setWait(1)
    const refs = parseContent(content)
    await createPost('', content, refs)
  }

  useEffect(() => {
    if (!hash?.length) return
    setWait(2)
  }, [hash])

  // hooks package watcher writes to IDB before emitting 'confirmed'
  useEffect(() => {
    if (status !== 'confirmed') return
    setWait(3)
    queryClient.invalidateQueries({ queryKey: threadQueryKey, exact: true })
  }, [status])

  // Auto-close after confirmed
  useEffect(() => {
    if (wait !== 3) return
    const timer = setTimeout(onClose, 1618)
    return () => clearTimeout(timer)
  }, [wait, onClose])

  const busy = wait === 1 || wait === 2
  const φ = Math.PHI

  return (
    <div ref={containerRef} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: `${1 / φ ** 2}em`,
      marginBottom: `${1 / φ}em`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: `${1 / φ}em`, color: '#aaa' }}>Reply</span>
        <button
          onClick={onClose}
          disabled={busy}
          style={{ margin: 0, padding: '2px 7px', color: '#aaa', borderColor: '#333', background: 'transparent', fontSize: `${1 / φ}em` }}
          title="Cancel"
        >
          ✕
        </button>
      </div>

      <div data-color-mode="dark">
        <MarkdownEditor
          value={content}
          onChange={v => setContent(v)}
          height="200px"
          enableScroll
          {...(shadowRoot ? { root: shadowRoot } : {})}
        />
      </div>

      <button onClick={onSubmit} disabled={busy || !content.trim()} style={{ margin: 0, width: '100%' }}>
        {busy ? 'Submitting...' : 'Post'}
      </button>

      <TxResponse wait={wait} hash={hash ?? ''} logs={[]} logErrors={logErrors} />
    </div>
  )
}
