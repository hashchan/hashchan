// Clicking the toolbar icon slides the HashChan panel out on ANY page, not
// just the sites we auto-recognize (youtube/wiki/rt/reddit/x/github). On a
// recognized site the panel already knows the page's board/thread (a "valid"
// page); anywhere else it opens in a page-agnostic mode where the URL lookup
// tool is still fully usable (see Sidebar.tsx / Catalogue.tsx / Settings.tsx).
//
// activeTab grants temporary host access to whatever tab the icon was
// clicked on, so this works without listing every possible site in
// host_permissions. content.tsx's mount() is idempotent (no-ops if
// #hashchan-host already exists), so re-injecting content.js on a tab that
// already has it (e.g. one of the 6 sites, auto-injected via manifest
// content_scripts) is harmless - it's just how we reach an already-mounted
// page to tell it to open.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !/^https?:\/\//.test(tab.url)) return

  const target = { tabId: tab.id }
  try {
    await chrome.scripting.executeScript({ target, files: ['content.js'], world: 'MAIN' })
    await chrome.scripting.executeScript({
      target,
      world: 'MAIN',
      func: () => { window.__hashchanToggle?.() },
    })
  } catch {
    // Restricted page (chrome web store, another extension's page, etc) - no-op.
  }
})
