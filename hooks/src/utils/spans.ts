// A sparse representation of "what block ranges have we already scanned" for
// a board or thread. Replaces the old lastSynced/scanBoundary scalar pair,
// which could only represent one contiguous region growing from the chain
// tip. With an atBlock-anchored forward scan, there can be a second,
// disjoint region (an anchor's own neighborhood) that hasn't met the
// tip-tailed region yet — spans represent that directly instead of needing a
// second pair of ad-hoc scalars per additional region.
export interface Span {
  fromBlock: number
  toBlock: number
}

const byFromBlock = (a: Span, b: Span) => a.fromBlock - b.fromBlock

// Insert/extend by one span and coalesce with anything it now overlaps or
// touches (gap of zero blocks between them). Keeps the result sorted by
// fromBlock. Order of insertion never matters — out-of-order scanning (e.g.
// clicking an arbitrary cell in the scan-map UI) is always safe.
export const mergeSpan = (spans: Span[], span: Span): Span[] => {
  const merged: Span = { ...span }
  const rest: Span[] = []

  for (const existing of spans) {
    const touchesOrOverlaps = existing.fromBlock <= merged.toBlock + 1 && existing.toBlock >= merged.fromBlock - 1
    if (touchesOrOverlaps) {
      merged.fromBlock = Math.min(merged.fromBlock, existing.fromBlock)
      merged.toBlock = Math.max(merged.toBlock, existing.toBlock)
    } else {
      rest.push(existing)
    }
  }

  return [...rest, merged].sort(byFromBlock)
}

// The span reaching furthest toward the tip — the one automatic tip-tailing
// sync extends every run. This is what lastSynced's "top edge" used to mean.
export const liveSpan = (spans: Span[]): Span | undefined =>
  spans.length ? spans.reduce((a, b) => (b.toBlock > a.toBlock ? b : a)) : undefined

// The span with the lowest fromBlock — the one "scan backwards" extends
// downward. This is what scanBoundary's "bottom edge" used to mean.
export const earliestSpan = (spans: Span[]): Span | undefined =>
  spans.length ? spans.reduce((a, b) => (b.fromBlock < a.fromBlock ? b : a)) : undefined

// The span that already covers a given block, if any. Used to find (or know
// we must create) the span an atBlock-seeded forward walk should extend,
// and to answer "has that walk already merged into the live span?"
// (spanNear(spans, atBlock) === liveSpan(spans)).
//
// Deliberately strict containment, not "nearest span" — a forward walk from
// atBlock always starts a span whose fromBlock is at-or-before atBlock and
// only grows upward, so once it exists it always contains atBlock. Falling
// back to the closest span when none contains the block would wrongly match
// an unrelated span (e.g. the tip-tailed live span, however far from
// atBlock it is) and report a forward walk as "already merged" before it
// ever started.
export const spanNear = (spans: Span[], block: number): Span | undefined =>
  spans.find((s) => s.fromBlock <= block && block <= s.toBlock)

// Every blockRangeLimit-sized window between floor and tip, tagged with
// whether it's fully covered by an existing span. Pure derived data — the
// ground truth a scan-map UI buckets/renders from.
export interface Cell {
  fromBlock: number
  toBlock: number
  scanned: boolean
}

export const cellStates = (
  spans: Span[],
  floor: number,
  tip: number,
  blockRangeLimit: number,
): Cell[] => {
  if (blockRangeLimit <= 0 || tip < floor) return []

  const cells: Cell[] = []
  for (let from = floor; from <= tip; from += blockRangeLimit) {
    const windowEnd = from + blockRangeLimit - 1
    const to = windowEnd > tip ? tip : windowEnd
    const scanned = spans.some((s) => s.fromBlock <= from && s.toBlock >= to)
    cells.push({ fromBlock: from, toBlock: to, scanned })
  }
  return cells
}
