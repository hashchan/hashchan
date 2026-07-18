import { useState, useEffect } from 'react'
import type { SiteContext } from '../useSiteContext'

const getIssueMatch = () => {
  // /issues/N and /pull/N are interchangeable permalinks on GitHub - visiting
  // /issues/N for a PR number 302-redirects to /pull/N - so both are tracked
  // under the same siteId/pageId shape and reconstruct correctly either way.
  const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/)
  return match ? { owner: match[1], repo: match[2], kind: match[3], number: match[4] } : null
}

const stripSuffix = (s: string) => s.replace(/\s*·\s*GitHub\s*$/, '')

const getTitle = () =>
  stripSuffix(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '')
  || stripSuffix(document.title)

export const useGithubContext = (): SiteContext | null => {
  const [issue, setIssue] = useState(getIssueMatch)
  const [title, setTitle] = useState(getTitle)

  useEffect(() => {
    const handler = () => {
      setIssue(getIssueMatch())
      setTitle(getTitle())
    }
    // GitHub is a client-routed SPA (Turbo) with no nav-finish event of its
    // own — 'navigatesuccess' fires once the SPA route transition has
    // committed, so the DOM/meta tags are settled by the time we read them.
    navigation.addEventListener('navigatesuccess', handler)
    return () => navigation.removeEventListener('navigatesuccess', handler)
  }, [])

  if (!issue) return null

  const { owner, repo, kind, number } = issue
  const thumbnail = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? ''
  const pageUrl = `https://github.com/${owner}/${repo}/${kind}/${number}`

  return {
    siteId: 'github',
    pageId: `${owner}/${repo}#${number}`,
    title: title || `${owner}/${repo}#${number}`,
    thumbnail,
    secondaryLabel: `${owner}/${repo}`,
    pageUrl,
  }
}
