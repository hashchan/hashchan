import sanitizeMarkdown from 'sanitize-markdown'
import { IDBProvider as BaseIDBProvider } from '@hashchan/hooks'

export { IDBContext } from '@hashchan/hooks'
export type { Board, Thread, Post, Settings, IndexingStrategy, ModerationService } from '@hashchan/hooks'

const SANITIZE_CONFIG = {
  allowedTags: ['p', 'div', 'img'],
  allowedAttributes: {
    img: ['src', 'alt'],
    p: [],
    div: [],
  },
}

const sanitize = (raw: string) => sanitizeMarkdown(raw, SANITIZE_CONFIG)

export const IDBProvider = ({ children }: { children: React.ReactNode }) => (
  <BaseIDBProvider sanitize={sanitize}>{children}</BaseIDBProvider>
)
