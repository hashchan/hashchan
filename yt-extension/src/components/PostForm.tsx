import { useState, useEffect, useRef } from 'react'
import MarkdownEditor from '@uiw/react-markdown-editor'
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
  const { hash, logs, logErrors, createPost } = useCreatePost(boardId, chainId, threadId)

  useEffect(() => { setContent(initialContent ?? '') }, [initialContent])

  // Grab the shadow root so CodeMirror can handle focus/selection correctly
  useEffect(() => {
    if (containerRef.current) {
      const root = containerRef.current.getRootNode()
      if (root instanceof ShadowRoot) setShadowRoot(root)
    }
  }, [])

  // Stop all keyboard events from bubbling to YouTube's document listeners
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

  useEffect(() => { if (hash?.length) setWait(2) }, [hash])
  useEffect(() => { if (logs.length > 0) setWait(3) }, [logs])

  const busy = wait === 1 || wait === 2
  const φ = Math.PHI

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em`, marginBottom: `${1 / φ}em` }}>
      <div data-color-mode="dark">
        <MarkdownEditor
          value={content}
          onChange={v => setContent(v)}
          height="300px"
          enableScroll
          {...(shadowRoot ? { root: shadowRoot } : {})}
        />
      </div>
      <button onClick={onSubmit} disabled={busy || !content.trim()} style={{ margin: 0, width: '100%' }}>
        {busy ? 'Submitting...' : 'Post'}
      </button>
      <TxResponse wait={wait} hash={hash ?? ''} logs={logs} logErrors={logErrors} />
    </div>
  )
}
