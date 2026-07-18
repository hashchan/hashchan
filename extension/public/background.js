// Manual activation: clicking the toolbar icon force-injects content.js into
// the active tab. This covers the case where a supported page (reddit/x/github/
// etc, all SPAs) was reached via client-side navigation rather than a full page
// load, so the declarative content_scripts match in manifest.json never fired.
// content.tsx's mount() is idempotent (no-ops if #hashchan-host already exists),
// so re-running it on an already-active tab is harmless.
//
// The click is scoped to exactly the pages manifest.json already declares
// support for - matches() below is checked against content_scripts[].matches
// itself (not a hand-copied list), so clicking on an unsupported site is a
// deliberate no-op rather than injecting into arbitrary pages.
function matchPatternToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  return new RegExp('^' + escaped + '$')
}

function isSupportedUrl(url) {
  const { content_scripts = [] } = chrome.runtime.getManifest()
  return content_scripts.some(({ matches }) =>
    matches.some((pattern) => matchPatternToRegExp(pattern).test(url))
  )
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url || !isSupportedUrl(tab.url)) return
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js'],
    world: 'MAIN',
  })
})
