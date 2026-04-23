import { useState, useMemo } from 'react'
import { photographUrl } from '../lib/photographs'

const imageUrl = photographUrl

function prettyLabel(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Color scale: cream → amber → teal → deep navy ─────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function cellColor(count, maxCount) {
  if (count === 0) return { bg: 'rgba(29,35,41,0.055)', text: 'rgba(29,35,41,0.28)' }
  const t = Math.pow(count / maxCount, 0.55)

  let r, g, b
  if (t < 0.33) {
    const s = t / 0.33
    r = lerp(248, 241, s); g = lerp(238, 168, s); b = lerp(210, 82, s)
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    r = lerp(241, 48, s); g = lerp(168, 148, s); b = lerp(82, 164, s)
  } else {
    const s = (t - 0.66) / 0.34
    r = lerp(48, 16, s); g = lerp(148, 52, s); b = lerp(164, 98, s)
  }

  // WCAG relative luminance for adaptive text
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    bg:   `rgb(${r},${g},${b})`,
    text: lum > 0.48 ? 'rgba(29,35,41,0.88)' : '#fff',
  }
}

const SOURCE_TABS = [
  { key: 'all',   label: 'All' },
  { key: 'gemma', label: 'Gemma Words' },
  { key: 'yolo',  label: 'YOLO Objects' },
]

function freqLabel(share) {
  if (share <= 0)  return ''
  if (share < 1)   return '<1%'
  if (share < 10)  return `${share.toFixed(1)}%`
  return `${Math.round(share)}%`
}

export default function PlaceSubjectAtlas({ atlas }) {
  const [sourceFilter, setSourceFilter] = useState('all')
  const [activeKey, setActiveKey]       = useState(null)
  const [showFreq, setShowFreq]         = useState(false)

  const visibleSubjects = useMemo(
    () => sourceFilter === 'all'
      ? atlas.subjects
      : atlas.subjects.filter((s) => s.source === sourceFilter),
    [atlas.subjects, sourceFilter],
  )

  const filteredCells = useMemo(
    () => sourceFilter === 'all' ? atlas.cells : atlas.cells.filter((c) => c.source === sourceFilter),
    [atlas.cells, sourceFilter],
  )

  const maxVal = useMemo(
    () => showFreq
      ? Math.max(...filteredCells.map((c) => c.share), 1)
      : Math.max(...filteredCells.map((c) => c.count), 1),
    [filteredCells, showFreq],
  )

  const activeCell = atlas.cells.find((c) => `${c.place}::${c.subject}::${c.source}` === activeKey)
    ?? atlas.cells.find((c) => c.count > 0)
    ?? null

  const colCount = visibleSubjects.length

  return (
    <article style={{
      display: 'grid', gap: '1rem', padding: '1.2rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: '1.75rem',
      background: 'linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,237,0.9)),radial-gradient(circle at 14% 14%,rgba(62,91,113,0.08),transparent 34%)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Place × Subject Atlas
          </p>
          <h3 style={{ margin: 0, font: '500 1.55rem/1.08 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '34rem' }}>
            Heat signatures reveal which places are remembered through which subjects.
          </h3>
        </div>
        {activeCell && (
          <div style={{ display: 'grid', gap: '0.1rem', textAlign: 'right' }}>
            <p style={{ margin: 0, font: '600 1rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>
              {prettyLabel(activeCell.subject)}
            </p>
            <p style={{ margin: 0, font: '0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
              {activeCell.count} photographs in {activeCell.place}
            </p>
          </div>
        )}
      </header>

      {/* ── Source filter tabs + frequency toggle ───────────────────────── */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {SOURCE_TABS.map((tab) => {
          const active = sourceFilter === tab.key
          const count = tab.key === 'all'
            ? atlas.subjects.length
            : atlas.subjects.filter((s) => s.source === tab.key).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSourceFilter(tab.key)}
              style={{
                padding: '0.32rem 0.85rem',
                border: `1px solid ${active ? 'rgba(62,91,113,0.55)' : 'var(--archive-color-rule)'}`,
                borderRadius: '999px',
                background: active ? 'rgba(62,91,113,0.12)' : 'rgba(255,255,255,0.55)',
                font: `${active ? '600' : '400'} 0.76rem/1 var(--archive-font-ui)`,
                color: active ? 'var(--archive-color-ink)' : 'var(--archive-color-copy)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {tab.label}
              <span style={{ marginLeft: '0.4rem', opacity: 0.55, font: '0.68rem/1 var(--archive-font-ui)' }}>
                {count}
              </span>
            </button>
          )
        })}

        {/* divider */}
        <span style={{ width: '1px', height: '1.2rem', background: 'var(--archive-color-rule)', margin: '0 0.15rem' }} />

        {/* Frequency toggle */}
        <button
          type="button"
          onClick={() => setShowFreq((v) => !v)}
          style={{
            padding: '0.32rem 0.85rem',
            border: `1px solid ${showFreq ? 'rgba(62,91,113,0.55)' : 'var(--archive-color-rule)'}`,
            borderRadius: '999px',
            background: showFreq ? 'rgba(62,91,113,0.12)' : 'rgba(255,255,255,0.55)',
            font: `${showFreq ? '600' : '400'} 0.76rem/1 var(--archive-font-ui)`,
            color: showFreq ? 'var(--archive-color-ink)' : 'var(--archive-color-copy)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          {showFreq ? '% frequency' : '# count'}
        </button>

        <span style={{ marginLeft: 'auto', alignSelf: 'center', font: '0.7rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
          scroll →
        </span>
      </div>

      {/* ── Grid + detail panel ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(15rem,18rem)', gap: '1rem' }}>

        {/* Scrollable grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.4rem' }}>
          <div style={{
            display: 'grid',
            gap: '0.18rem',
            alignItems: 'stretch',
            minWidth: `${11 + colCount * 3}rem`,
            gridTemplateColumns: `11rem repeat(${colCount}, minmax(2.8rem, 1fr))`,
          }}>

            {/* Column headers (rotated) */}
            <div style={{ display: 'flex', alignItems: 'end', padding: '0.25rem 0.55rem', font: '600 0.76rem/1.25 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
              Place
            </div>
            {visibleSubjects.map((s) => (
              <div
                key={`${s.source}:${s.subject}`}
                title={`${prettyLabel(s.subject)} (${s.source})`}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  height: '8rem',
                  padding: '0.35rem 0.15rem',
                  textAlign: 'left',
                  overflow: 'hidden',
                  font: '0.72rem/1.25 var(--archive-font-ui)',
                  color: s.source === 'yolo' ? 'rgba(62,91,113,0.75)' : 'var(--archive-color-copy)',
                }}
              >
                {prettyLabel(s.subject)}
              </div>
            ))}

            {/* Rows */}
            {atlas.places.map((place) => (
              <div key={place.place} style={{ display: 'contents' }}>

                {/* Place label + total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', gap: '0.7rem',
                  alignItems: 'center', padding: '0 0.55rem',
                  whiteSpace: 'nowrap',
                  font: '0.76rem/1.25 var(--archive-font-ui)',
                  color: 'var(--archive-color-copy)',
                }}>
                  <span>{place.place}</span>
                  <span style={{ opacity: 0.5 }}>{place.total}</span>
                </div>

                {/* Cells */}
                {visibleSubjects.map((subject) => {
                  const cell = atlas.cells.find(
                    (c) => c.place === place.place && c.subject === subject.subject && c.source === subject.source
                  )
                  const count = cell?.count ?? 0
                  const share = cell?.share ?? 0
                  const val   = showFreq ? share : count
                  const { bg, text } = cellColor(val, maxVal)
                  const cellKey = cell ? `${cell.place}::${cell.subject}::${cell.source}` : null
                  const label   = showFreq ? freqLabel(share) : (count > 0 ? count : '')
                  const small   = showFreq ? share >= 10 : count >= 100

                  return (
                    <button
                      key={`${subject.source}:${subject.subject}`}
                      type="button"
                      style={{
                        position: 'relative',
                        display: 'grid',
                        placeItems: 'center',
                        minHeight: '3.1rem',
                        border: 0,
                        background: bg,
                        color: text,
                        font: `700 ${small ? '0.66rem' : '0.74rem'}/1 var(--archive-font-ui)`,
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'filter 140ms ease',
                      }}
                      aria-label={`${place.place}, ${prettyLabel(subject.subject)}, ${count} photographs (${share}%)`}
                      onMouseEnter={() => { if (cellKey) setActiveKey(cellKey) }}
                      onFocus={() => { if (cellKey) setActiveKey(cellKey) }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {activeCell && (
          <aside style={{
            display: 'grid', gap: '0.85rem', padding: '0.95rem 1rem',
            borderRadius: '1.2rem',
            background: 'rgba(255,255,255,0.68)',
            boxShadow: 'inset 0 0 0 1px rgba(62,91,113,0.08)',
            alignContent: 'start',
          }}>
            {activeCell.exampleFilename && (
              <div style={{ aspectRatio: '4/3', borderRadius: '0.95rem', overflow: 'hidden', background: 'rgba(29,35,41,0.08)' }}>
                <img
                  src={imageUrl(activeCell.exampleFilename)}
                  alt={activeCell.exampleFilename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
            <div style={{ display: 'grid', gap: '0.28rem' }}>
              <p style={{ margin: 0, font: '600 0.68rem/1.2 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                {activeCell.source === 'yolo' ? 'YOLO Object' : 'Gemma Keyword'}
              </p>
              <p style={{ margin: 0, font: '500 1.1rem/1.08 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
                {activeCell.place}
              </p>
              <p style={{ margin: 0, font: '0.84rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                <strong>{prettyLabel(activeCell.subject)}</strong> appears in{' '}
                {activeCell.count} photograph{activeCell.count !== 1 ? 's' : ''} here
                {activeCell.share > 0 && `, ${activeCell.share}% of this place's archive slice`}.
              </p>
            </div>
          </aside>
        )}
      </div>

    </article>
  )
}
