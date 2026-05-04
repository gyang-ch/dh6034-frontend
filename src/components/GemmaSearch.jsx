import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, X, ImageOff } from 'lucide-react'
import { gemmaCaptionsData } from '../data/gemmaCaptionsData'
import { photographUrl } from '../lib/photographs'

const BATCH = 14
const GRID_HEIGHT = '34rem'

function parseName(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})_(.+?)_\d+/)
  if (!m) return { date: '', place: filename }
  return { date: m[1], place: m[2].replace(/_/g, ' ') }
}

// ─── Search engine ──────────────────────────────────────────────────────────

function tokenize(text) {
  return text.toLowerCase().split(/[^\w]+/).filter(t => t.length >= 2)
}

// Returns true if a and b differ by exactly one edit (insert / delete / substitute)
function withinOneEdit(a, b) {
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > 1) return false
  if (la === lb) {
    let diffs = 0
    for (let i = 0; i < la; i++) { if (a[i] !== b[i] && ++diffs > 1) return false }
    return diffs === 1
  }
  const [short, long] = la < lb ? [a, b] : [b, a]
  let si = 0, li = 0, skipped = false
  while (si < short.length && li < long.length) {
    if (short[si] === long[li]) { si++; li++ }
    else if (skipped) return false
    else { skipped = true; li++ }
  }
  return true
}

// How well a single query token matches a single field token (0 = no match)
function matchScore(qt, ft) {
  if (qt === ft) return 1.0
  // Prefix: "mountain" matches "mountains", "museum" matches "museums"
  if (qt.length >= 4 && ft.startsWith(qt)) return 0.85
  if (ft.length >= 4 && qt.startsWith(ft)) return 0.80
  // One-edit fuzzy for longer tokens: "calligraphy" ≈ "calligraph"
  if (qt.length >= 5 && ft.length >= 4 && withinOneEdit(qt, ft)) return 0.65
  return 0
}

// Best score for a query token against an array of field tokens
function bestMatch(qt, fieldToks) {
  let best = 0
  for (const ft of fieldToks) {
    const s = matchScore(qt, ft)
    if (s > best) best = s
    if (best >= 1.0) break
  }
  return best
}

// Score an item. Returns 0 if any query token is unmatched (require all tokens).
// Fields: caption (weight 12), place (5), date (3). Exact phrase earns a bonus.
function scoreItem(item, queryPhrase, queryToks) {
  if (queryToks.length === 0) return 0
  const capLower = item.c.toLowerCase()
  const capToks  = tokenize(item.c)
  const { date, place } = parseName(item.f)
  const placeToks = tokenize(place)
  const dateToks  = tokenize(date)

  let total = 0
  for (const qt of queryToks) {
    const inCaption = bestMatch(qt, capToks)
    const inPlace   = bestMatch(qt, placeToks)
    const inDate    = bestMatch(qt, dateToks)
    if (Math.max(inCaption, inPlace, inDate) < 0.6) return 0
    total += inCaption * 12 + inPlace * 5 + inDate * 3
  }

  // Exact phrase in caption: big bonus, ranks this above scattered-token matches
  if (queryToks.length > 1 && capLower.includes(queryPhrase)) total += 40

  return total
}

// ─── Highlighting ───────────────────────────────────────────────────────────

// Collect and merge all match spans for each query token
function matchRanges(text, queryToks) {
  const lower = text.toLowerCase()
  const spans = []
  for (const qt of queryToks) {
    let start = 0, idx
    while ((idx = lower.indexOf(qt, start)) !== -1) {
      spans.push([idx, idx + qt.length])
      start = idx + 1
    }
  }
  spans.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const [s, e] of spans) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e)
    } else {
      merged.push([s, e])
    }
  }
  return merged
}

function HighlightedText({ text, queryToks }) {
  if (!queryToks.length) return <span>{text}</span>
  const ranges = matchRanges(text, queryToks)
  if (!ranges.length) return <span>{text}</span>
  const parts = []
  let cursor = 0
  for (const [s, e] of ranges) {
    if (cursor < s) parts.push(<span key={cursor}>{text.slice(cursor, s)}</span>)
    parts.push(
      <mark key={s} style={{ background: 'rgba(234,179,8,0.3)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(s, e)}
      </mark>
    )
    cursor = e
  }
  if (cursor < text.length) parts.push(<span key={cursor}>{text.slice(cursor)}</span>)
  return <>{parts}</>
}

function CaptionSnippet({ caption, queryToks, queryPhrase }) {
  const lc = caption.toLowerCase()
  // Anchor on the exact phrase first, then on the first matching token
  let anchor = queryToks.length > 1 ? lc.indexOf(queryPhrase) : -1
  if (anchor === -1) {
    for (const qt of queryToks) {
      const idx = lc.indexOf(qt)
      if (idx !== -1) { anchor = idx; break }
    }
  }
  let snippet = caption
  if (anchor !== -1) {
    const start = Math.max(0, anchor - 60)
    snippet = (start > 0 ? '…' : '') + caption.slice(start, start + 160)
    if (start + 160 < caption.length) snippet += '…'
  } else {
    snippet = caption.slice(0, 160) + (caption.length > 160 ? '…' : '')
  }
  return (
    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--archive-color-copy)' }}>
      <HighlightedText text={snippet} queryToks={queryToks} />
    </p>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────

function PhotoCard({ item, queryToks, queryPhrase }) {
  const [failed, setFailed] = useState(false)
  const { date, place } = parseName(item.f)

  return (
    <div className="group flex flex-col rounded-xl border border-[rgba(29,35,41,0.12)] bg-white p-2 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(29,35,41,0.28)] hover:shadow-md">
      <div className="relative overflow-hidden rounded-lg bg-slate-100" style={{ aspectRatio: '1' }}>
        {!failed ? (
          <img
            src={photographUrl(item.f)}
            alt={item.f}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageOff size={24} strokeWidth={1.5} />
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unavailable</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3 pb-1">
        <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 600, color: 'var(--archive-color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {place}{date && <span style={{ color: 'var(--archive-color-muted)' }}> — {date}</span>}
        </p>
        <div className="font-major">
          <CaptionSnippet caption={item.c} queryToks={queryToks} queryPhrase={queryPhrase} />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function GemmaSearch() {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(BATCH)
  const inputRef = useRef(null)
  const gridRef  = useRef(null)

  const trimmed = query.trim()

  // Reset visible count whenever the query changes
  useEffect(() => { setVisibleCount(BATCH) }, [trimmed])

  const { queryPhrase, queryToks, results, isSearching } = useMemo(() => {
    const queryPhrase = trimmed.toLowerCase()
    const queryToks   = tokenize(trimmed)

    if (trimmed.length < 2) {
      return {
        queryPhrase: '',
        queryToks: [],
        results: gemmaCaptionsData,
        isSearching: false,
      }
    }

    const scored = []
    for (const item of gemmaCaptionsData) {
      const s = scoreItem(item, queryPhrase, queryToks)
      if (s > 0) scored.push({ item, score: s })
    }
    scored.sort((a, b) => b.score - a.score)
    return {
      queryPhrase,
      queryToks,
      results: scored.map(r => r.item),
      isSearching: true,
    }
  }, [trimmed])

  const shown = results.slice(0, visibleCount)

  const onGridScroll = useCallback(() => {
    const el = gridRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      setVisibleCount(c => Math.min(c + BATCH, results.length))
    }
  }, [results.length])

  return (
    <div
      className="mx-auto max-w-5xl rounded-[1.75rem] border p-8 shadow-sm backdrop-blur-sm flex flex-col gap-5"
      style={{
        borderColor: 'rgba(29,35,41,0.22)',
        background:
          'linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,244,237,0.92)),' +
          'radial-gradient(circle at 80% 10%,rgba(234,179,8,0.06),transparent 32%)',
      }}
    >

      {/* Archive Header */}
      <div className="text-center">
        <h2 className="m-0 font-title text-3xl font-medium" style={{ color: 'var(--archive-color-ink)' }}>
          Caption-Based Photo Search
        </h2>
      </div>

      {/* Search input + suggestions */}
      <div className="flex flex-col gap-3">
        <div className="group relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 group-focus-within:text-[var(--archive-color-accent)]"
            size={20}
            strokeWidth={1.5}
            style={{ color: 'var(--archive-color-muted)' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Query the archive (e.g. 'museum', 'botanical garden', 'red coat')…"
            className="w-full rounded-xl border border-[rgba(29,35,41,0.22)] bg-white py-4 pl-12 pr-12 font-major text-[0.95rem] shadow-xs outline-none transition-[color,box-shadow,border-color] duration-200 placeholder:text-slate-400 focus:border-[var(--archive-color-accent)] focus:ring-[3px] focus:ring-[var(--archive-color-accent)]/15"
            style={{ boxSizing: 'border-box', color: 'var(--archive-color-ink)' }}
          />
          {trimmed && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-slate-100"
              style={{ color: 'var(--archive-color-muted)' }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Suggested searches */}
        {trimmed.length < 2 && (
          <div className="flex flex-wrap gap-2">
            {['food', 'restaurant', 'calligraphy', 'museum', 'gallery'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => { setQuery(suggestion); inputRef.current?.focus() }}
                className="rounded-full border border-[rgba(29,35,41,0.22)] bg-transparent px-4 py-1.5 text-xs font-medium text-[var(--archive-color-muted)] cursor-pointer transition-[color,background-color,border-color] duration-150 hover:border-[rgba(29,35,41,0.4)] hover:bg-white/60 hover:text-[var(--archive-color-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--archive-color-accent)]/20"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status line */}
      <p className="m-0 text-sm" style={{ color: 'var(--archive-color-muted)' }}>
        {isSearching && (
          results.length === 0
            ? `No photos found for "${trimmed}"`
            : <>
                <span className="inline-flex items-center rounded-md border border-[rgba(29,35,41,0.22)] px-2 py-0.5 text-xs font-semibold" style={{ color: 'var(--archive-color-ink)' }}>
                  {results.length}
                </span>
                {' '}photo{results.length !== 1 ? 's' : ''} found — showing {Math.min(visibleCount, results.length)}
              </>
        )}
      </p>

      {/* Results grid — fixed-height scrollable container */}
      {shown.length > 0 && (
        <div className="relative">
          {/* Faded-bottom fade hint (shadcn-admin faded-bottom pattern) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 rounded-b-xl"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(247,244,237,0.92))' }}
          />
          <div
            ref={gridRef}
            onScroll={onGridScroll}
            data-lenis-prevent
            className="custom-scrollbar pr-2"
            style={{ height: GRID_HEIGHT, overflowY: 'auto', overflowX: 'hidden' }}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {shown.map(item => (
                <PhotoCard key={item.f} item={item} queryToks={queryToks} queryPhrase={queryPhrase} />
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
