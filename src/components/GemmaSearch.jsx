import { useState, useMemo, useRef } from 'react'
import { gemmaCaptionsData } from '../data/gemmaCaptionsData'
import { photographUrl } from '../lib/photographs'

const MAX_SHOWN = 60

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
    <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--archive-color-copy)' }}>
      <HighlightedText text={snippet} queryToks={queryToks} />
    </p>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────

function PhotoCard({ item, queryToks, queryPhrase }) {
  const [failed, setFailed] = useState(false)
  const { date, place } = parseName(item.f)
  return (
    <div style={{
      borderRadius: '0.9rem',
      border: '1px solid var(--archive-color-rule)',
      background: 'rgba(255,255,255,0.82)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#e8e4da', flexShrink: 0 }}>
        {!failed ? (
          <img
            src={photographUrl(item.f)}
            alt={item.f}
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Unavailable</span>
          </div>
        )}
      </div>
      <div style={{ padding: '0.6rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: 'var(--archive-color-ink)', letterSpacing: '0.02em' }}>
          {place}{date ? <span style={{ fontWeight: 400, color: 'var(--archive-color-muted)', marginLeft: '0.35em' }}>{date}</span> : null}
        </p>
        <CaptionSnippet caption={item.c} queryToks={queryToks} queryPhrase={queryPhrase} />
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function GemmaSearch() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const trimmed = query.trim()

  const { queryPhrase, queryToks, results } = useMemo(() => {
    const queryPhrase = trimmed.toLowerCase()
    const queryToks   = tokenize(trimmed)
    if (trimmed.length < 2) return { queryPhrase, queryToks, results: [] }

    const scored = []
    for (const item of gemmaCaptionsData) {
      const s = scoreItem(item, queryPhrase, queryToks)
      if (s > 0) scored.push({ item, score: s })
    }
    scored.sort((a, b) => b.score - a.score)
    return { queryPhrase, queryToks, results: scored.map(r => r.item) }
  }, [trimmed])

  const shown   = results.slice(0, MAX_SHOWN)
  const hasMore = results.length > MAX_SHOWN

  return (
    <div style={{
      display: 'grid', gap: '1.25rem',
      padding: '1.4rem 1.6rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: '1.75rem',
      background:
        'linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,244,237,0.92)),' +
        'radial-gradient(circle at 80% 10%,rgba(234,179,8,0.06),transparent 32%)',
    }}>

      {/* Search input + suggestions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--archive-color-muted)', fontSize: '1rem', pointerEvents: 'none',
            lineHeight: 1,
          }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search captions — e.g. mountain, red shirt, street market…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.72rem 2.5rem 0.72rem 2.5rem',
              border: '1.5px solid var(--archive-color-rule)',
              borderRadius: '999px',
              font: '0.92rem/1.4 var(--archive-font-ui)',
              color: 'var(--archive-color-ink)',
              background: 'rgba(255,255,255,0.9)',
              outline: 'none',
              boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(15,23,42,0.35)'; e.target.style.boxShadow = '0 2px 16px rgba(15,23,42,0.1)' }}
            onBlur={e  => { e.target.style.borderColor = 'var(--archive-color-rule)'; e.target.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)' }}
          />
          {trimmed && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{
                position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--archive-color-muted)', fontSize: '0.85rem', padding: '0.2rem',
                lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>

        {/* Suggested searches */}
        {trimmed.length < 2 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-start' }}>
            {['food', 'restaurant', 'calligraphy', 'museum', 'gallery'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => { setQuery(suggestion); inputRef.current?.focus() }}
                style={{
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  border: '1px solid var(--archive-color-rule)',
                  background: 'transparent',
                  color: 'var(--archive-color-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--archive-color-text)'; e.currentTarget.style.color = 'var(--archive-color-text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--archive-color-rule)'; e.currentTarget.style.color = 'var(--archive-color-muted)' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status line */}
      {trimmed.length >= 2 && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--archive-color-muted)' }}>
          {results.length === 0
            ? `No photos found for "${trimmed}"`
            : <><strong style={{ color: 'var(--archive-color-ink)' }}>{results.length}</strong> photo{results.length !== 1 ? 's' : ''} found{hasMore ? ` — showing top ${MAX_SHOWN}` : ''}</>
          }
        </p>
      )}

      {/* Results grid */}
      {shown.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}>
          {shown.map(item => (
            <PhotoCard key={item.f} item={item} queryToks={queryToks} queryPhrase={queryPhrase} />
          ))}
        </div>
      )}

    </div>
  )
}
