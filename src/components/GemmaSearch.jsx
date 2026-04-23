import { useState, useMemo, useRef } from 'react'
import { gemmaCaptionsData } from '../data/gemmaCaptionsData'
import { photographUrl } from '../lib/photographs'

const MAX_SHOWN = 60

// Parse date / place from filename
function parseName(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})_(.+?)_\d+/)
  if (!m) return { date: '', place: filename }
  return { date: m[1], place: m[2].replace(/_/g, ' ') }
}

// Return array of {text, match} segments for highlighting
function highlight(text, query) {
  if (!query) return [{ text, match: false }]
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return [{ text, match: false }]
  return [
    { text: text.slice(0, idx),          match: false },
    { text: text.slice(idx, idx + query.length), match: true  },
    { text: text.slice(idx + query.length),      match: false },
  ]
}

function CaptionSnippet({ caption, query }) {
  // Show a ~160-char window centred on the first match
  const lc = caption.toLowerCase()
  const qi = lc.indexOf(query.toLowerCase())
  let snippet = caption
  if (qi !== -1) {
    const start = Math.max(0, qi - 60)
    snippet = (start > 0 ? '…' : '') + caption.slice(start, start + 160)
    if (start + 160 < caption.length) snippet += '…'
  } else {
    snippet = caption.slice(0, 160) + (caption.length > 160 ? '…' : '')
  }
  const parts = highlight(snippet, query)
  return (
    <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--archive-color-copy)' }}>
      {parts.map((p, i) =>
        p.match
          ? <mark key={i} style={{ background: 'rgba(234,179,8,0.3)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </p>
  )
}

function PhotoCard({ item, query }) {
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
        <CaptionSnippet caption={item.c} query={query} />
      </div>
    </div>
  )
}

export default function GemmaSearch() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const trimmed = query.trim()

  const results = useMemo(() => {
    if (trimmed.length < 2) return []
    const q = trimmed.toLowerCase()
    return gemmaCaptionsData.filter(item => item.c.toLowerCase().includes(q))
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

      {/* Search input */}
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
          placeholder="Search by word or phrase — e.g. mountain, red shirt, street market…"
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

      {/* Status line */}
      {trimmed.length >= 2 && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--archive-color-muted)' }}>
          {results.length === 0
            ? `No photos found for "${trimmed}"`
            : <><strong style={{ color: 'var(--archive-color-ink)' }}>{results.length}</strong> photo{results.length !== 1 ? 's' : ''} found{hasMore ? ` — showing first ${MAX_SHOWN}` : ''}</>
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
            <PhotoCard key={item.f} item={item} query={trimmed} />
          ))}
        </div>
      )}

      {/* Empty prompt */}
      {trimmed.length < 2 && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--archive-color-muted)', textAlign: 'center', padding: '1rem 0 0.5rem' }}>
          Type at least two characters to search
        </p>
      )}
    </div>
  )
}
