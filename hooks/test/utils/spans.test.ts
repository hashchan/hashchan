import { describe, it, expect } from 'vitest'
import { mergeSpan, liveSpan, earliestSpan, spanNear, cellStates } from '../../src/utils/spans'

describe('mergeSpan', () => {
  it('adds a disjoint span without merging', () => {
    const result = mergeSpan([{ fromBlock: 100, toBlock: 200 }], { fromBlock: 300, toBlock: 400 })
    expect(result).toEqual([
      { fromBlock: 100, toBlock: 200 },
      { fromBlock: 300, toBlock: 400 },
    ])
  })

  it('merges an overlapping span', () => {
    const result = mergeSpan([{ fromBlock: 100, toBlock: 200 }], { fromBlock: 150, toBlock: 250 })
    expect(result).toEqual([{ fromBlock: 100, toBlock: 250 }])
  })

  it('merges a touching span (adjacent, no gap)', () => {
    const result = mergeSpan([{ fromBlock: 100, toBlock: 200 }], { fromBlock: 201, toBlock: 300 })
    expect(result).toEqual([{ fromBlock: 100, toBlock: 300 }])
  })

  it('does not merge across a one-block gap', () => {
    const result = mergeSpan([{ fromBlock: 100, toBlock: 200 }], { fromBlock: 202, toBlock: 300 })
    expect(result).toEqual([
      { fromBlock: 100, toBlock: 200 },
      { fromBlock: 202, toBlock: 300 },
    ])
  })

  it('bridges two existing spans when the new span touches both', () => {
    const spans = [{ fromBlock: 100, toBlock: 200 }, { fromBlock: 301, toBlock: 400 }]
    const result = mergeSpan(spans, { fromBlock: 201, toBlock: 300 })
    expect(result).toEqual([{ fromBlock: 100, toBlock: 400 }])
  })

  it('is order-independent (out-of-order scanning is safe)', () => {
    const spans = [{ fromBlock: 500, toBlock: 600 }]
    const a = mergeSpan(mergeSpan(spans, { fromBlock: 300, toBlock: 400 }), { fromBlock: 401, toBlock: 499 })
    const b = mergeSpan(mergeSpan(spans, { fromBlock: 401, toBlock: 499 }), { fromBlock: 300, toBlock: 400 })
    expect(a).toEqual([{ fromBlock: 300, toBlock: 600 }])
    expect(b).toEqual(a)
  })
})

describe('liveSpan / earliestSpan', () => {
  it('return undefined for an empty list', () => {
    expect(liveSpan([])).toBeUndefined()
    expect(earliestSpan([])).toBeUndefined()
  })

  it('pick the span reaching furthest toward the tip / with the lowest fromBlock', () => {
    const spans = [{ fromBlock: 500, toBlock: 600 }, { fromBlock: 100, toBlock: 200 }]
    expect(liveSpan(spans)).toEqual({ fromBlock: 500, toBlock: 600 })
    expect(earliestSpan(spans)).toEqual({ fromBlock: 100, toBlock: 200 })
  })
})

describe('spanNear', () => {
  it('returns undefined for an empty list', () => {
    expect(spanNear([], 150)).toBeUndefined()
  })

  it('returns the containing span', () => {
    const spans = [{ fromBlock: 100, toBlock: 200 }, { fromBlock: 500, toBlock: 600 }]
    expect(spanNear(spans, 150)).toEqual({ fromBlock: 100, toBlock: 200 })
  })

  it('returns undefined when the block is not contained in any span (no closest-match fallback)', () => {
    const spans = [{ fromBlock: 100, toBlock: 200 }, { fromBlock: 500, toBlock: 600 }]
    expect(spanNear(spans, 450)).toBeUndefined()
    expect(spanNear(spans, 250)).toBeUndefined()
  })
})

describe('cellStates', () => {
  it('tags each blockRangeLimit window as scanned or not', () => {
    const spans = [{ fromBlock: 100, toBlock: 109 }]
    const cells = cellStates(spans, 100, 129, 10)
    expect(cells).toEqual([
      { fromBlock: 100, toBlock: 109, scanned: true },
      { fromBlock: 110, toBlock: 119, scanned: false },
      { fromBlock: 120, toBlock: 129, scanned: false },
    ])
  })

  it('clips the final cell at tip when the range is not an exact multiple', () => {
    const cells = cellStates([], 100, 124, 10)
    expect(cells.map((c) => [c.fromBlock, c.toBlock])).toEqual([[100, 109], [110, 119], [120, 124]])
  })

  it('returns an empty list when tip is before floor', () => {
    expect(cellStates([], 200, 100, 10)).toEqual([])
  })
})
