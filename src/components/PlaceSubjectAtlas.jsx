import { useState, useMemo } from 'react'
import { photographUrl } from '../lib/photographs'

const imageUrl = photographUrl

function prettyLabel(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Color scale: cream → amber → teal → deep navy ─────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function cellColor(count, maxCount) {
  // More elegant, almost-invisible empty state
  if (count === 0) return { bg: 'rgba(29,35,41,0.02)', text: 'rgba(29,35,41,0.2)' }
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
    text: lum > 0.48 ? 'rgba(29,35,41,0.9)' : '#fff',
  }
}

const SOURCE_TABS = [
  { key: 'all',   label: 'All Contexts' },
  { key: 'gemma', label: 'Gemma Extractions' },
  { key: 'yolo',  label: 'YOLO Detections' },
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

  const activeCell = atlas.cells.find((c) => `${c.place}::${c.subject}::${c.source}` === activeKey) ?? null
  const colCount = visibleSubjects.length

  return (
    <article style={{
      display: 'grid', gap: '2rem', padding: '2.5rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: 'var(--radius-soft, 8px)',
      background: 'var(--archive-color-bg)', // Relying on the clean parchment bg
      boxShadow: '0 4px 30px -15px rgba(0,0,0,0.06)', // Very modest grounding shadow
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid var(--archive-color-rule)', paddingBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: '0 0 0.75rem', font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>
            Figure 1. Place × Subject Matrix
          </p>
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '40rem' }}>
            Heat signatures revealing which locations are visually remembered through specific subjects.
          </h3>
        </div>
        
        {/* Modest Top-Right Detail Readout */}
        {activeCell && (
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <p style={{ margin: '0 0 0.2rem', font: 'italic 600 1.1rem/1 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
              {prettyLabel(activeCell.subject)}
            </p>
            <p style={{ margin: 0, font: '400 0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
              n = {activeCell.count} <br/> {activeCell.place}
            </p>
          </div>
        )}
      </header>

      {/* ── Academic Controls ───────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {SOURCE_TABS.map((tab) => {
            const active = sourceFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSourceFilter(tab.key)}
                style={{
                  padding: '0 0 0.4rem 0',
                  border: 'none',
                  borderBottom: `2px solid ${active ? 'var(--archive-color-accent)' : 'transparent'}`,
                  background: 'transparent',
                  font: `${active ? '600' : '400'} 0.72rem/1 var(--archive-font-ui)`,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Frequency Toggle */}
        <button
          type="button"
          onClick={() => setShowFreq((v) => !v)}
          style={{
            padding: '0.4rem 0.8rem',
            border: '1px solid var(--archive-color-rule)',
            borderRadius: '4px',
            background: showFreq ? 'rgba(62,91,113,0.06)' : 'transparent',
            font: '500 0.72rem/1 var(--archive-font-ui)',
            letterSpacing: '0.04em',
            color: 'var(--archive-color-copy)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {showFreq ? 'Displaying: Frequency (%)' : 'Displaying: Absolute Count (n)'}
        </button>
      </div>

      {/* ── Grid + Detail Panel ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(16rem,20rem)', gap: '2.5rem', alignItems: 'start' }}>

        {/* Scrollable grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }} className="custom-scrollbar">
          <div style={{
            display: 'grid',
            gap: '1px', // Crisp matrix lines
            alignItems: 'stretch',
            minWidth: `${12 + colCount * 2.8}rem`,
            gridTemplateColumns: `12rem repeat(${colCount}, minmax(2.8rem, 1fr))`,
            background: 'var(--archive-color-rule)', // Acts as the border color between cells
            border: '1px solid var(--archive-color-rule)',
          }}>

            {/* Column headers (rotated) */}
            <div style={{ background: 'var(--archive-color-bg)', display: 'flex', alignItems: 'flex-end', padding: '0.5rem 0.75rem', font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
              Location Origin
            </div>
            {visibleSubjects.map((s) => (
              <div
                key={`${s.source}:${s.subject}`}
                title={`${prettyLabel(s.subject)} (${s.source})`}
                style={{
                  background: 'var(--archive-color-bg)',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  height: '8.5rem',
                  padding: '0.5rem 0',
                  textAlign: 'left',
                  overflow: 'hidden',
                  font: '400 0.75rem/1.2 var(--archive-font-ui)',
                  letterSpacing: '0.02em',
                  color: s.source === 'yolo' ? 'var(--archive-color-accent)' : 'var(--archive-color-copy)',
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
                  background: 'var(--archive-color-bg)',
                  display: 'flex', justifyContent: 'space-between', gap: '1rem',
                  alignItems: 'center', padding: '0 0.75rem',
                  whiteSpace: 'nowrap',
                  font: '400 0.85rem/1.2 var(--archive-font-body)', // Using serif for places
                  color: 'var(--archive-color-ink)',
                }}>
                  <span>{place.place}</span>
                  <span style={{ font: '400 0.7rem var(--archive-font-data)', color: 'var(--archive-color-muted)' }}>{place.total}</span>
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
                  
                  const isActive = activeKey === cellKey && cellKey !== null;

                  return (
                    <button
                      key={`${subject.source}:${subject.subject}`}
                      type="button"
                      style={{
                        position: 'relative',
                        display: 'grid',
                        placeItems: 'center',
                        minHeight: '2.8rem',
                        border: 0,
                        background: bg,
                        color: text,
                        font: `400 0.75rem/1 var(--archive-font-data)`, // Use monospace for numbers
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'box-shadow 150ms ease, opacity 150ms ease',
                        boxShadow: isActive ? 'inset 0 0 0 2px var(--archive-color-ink)' : 'none',
                        opacity: (activeKey && !isActive && count > 0) ? 0.6 : 1, // Dim others when one is selected
                      }}
                      aria-label={`${place.place}, ${prettyLabel(subject.subject)}, ${count} photographs (${share}%)`}
                      onClick={() => { if (cellKey) setActiveKey((prev) => prev === cellKey ? null : cellKey) }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Marginalia Detail Panel */}
        <aside style={{
          display: 'grid', gap: '1.25rem', padding: '0',
          alignContent: 'start',
        }}>
          {activeCell ? (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1rem',
              paddingTop: '1rem',
              borderTop: '3px solid var(--archive-color-accent)', // Strong academic framing
            }}>
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                <p style={{ margin: 0, font: '600 0.65rem/1.2 var(--archive-font-ui)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  Selected Node Data
                </p>
                <p style={{ margin: 0, font: '400 1rem/1.4 var(--archive-font-body)', color: 'var(--archive-color-copy)' }}>
                  The subject <strong>{prettyLabel(activeCell.subject)}</strong> ({activeCell.source === 'yolo' ? 'YOLO' : 'Gemma'}) appears in <strong>{activeCell.count}</strong> photograph{activeCell.count !== 1 ? 's' : ''} from <em>{activeCell.place}</em>.
                  {activeCell.share > 0 && ` This accounts for ${activeCell.share}% of the location's total documentation.`}
                </p>
              </div>

              {activeCell.exampleFilenames?.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: activeCell.exampleFilenames.length === 1 ? '1fr' : '1fr 1fr',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {activeCell.exampleFilenames.map((filename) => (
                    <figure key={filename} style={{ margin: 0, aspectRatio: '4/3', background: 'rgba(29,35,41,0.04)', border: '1px solid var(--archive-color-rule)', padding: '0.25rem' }}>
                      <img
                        src={imageUrl(filename)}
                        alt={filename}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(20%) contrast(1.05)' }}
                      />
                    </figure>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--archive-color-rule)',
            }}>
              <p style={{ margin: 0, font: 'italic 400 0.9rem/1.5 var(--archive-font-body)', color: 'var(--archive-color-muted)' }}>
                Select a populated cell in the matrix to view specific archival examples and distribution metrics.
              </p>
            </div>
          )}
        </aside>

      </div>
    </article>
  )
}