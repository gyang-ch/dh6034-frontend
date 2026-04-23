import { useState, useMemo, useRef, useCallback } from 'react'
import { assignment2Data } from '../data/assignment2Data'
import { gemmaKeywordsData } from '../data/gemmaKeywordsData'

// ── Stable color palette ──────────────────────────────────────────────────────
const PALETTE = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#86bcb6',
  '#4dc0e8','#d4a6c8','#a0cbe8','#ffbe7d','#8cd17d',
  '#b6992d','#499894','#d37295','#a8786a','#c9a227',
  '#cc3d3d','#2ecc71','#9b59b6','#e67e22','#1abc9c',
  '#e74c3c','#3498db','#f39c12','#16a085','#d35400',
  '#8e44ad','#2980b9','#27ae60','#7f8c8d','#c0392b',
  '#2c3e50','#1a7a4a','#7d3c98',
]

const YOLO_GROUPS = {
  'People':       ['person'],
  'Vehicles':     ['airplane', 'bicycle', 'bus', 'car', 'train'],
  'Animals':      ['bear', 'bird', 'cat', 'cow', 'dog', 'elephant', 'giraffe', 'horse', 'sheep', 'zebra'],
  'Food & Drink': ['apple', 'banana', 'bottle', 'bowl', 'cake', 'cup', 'pizza', 'sandwich', 'wine glass'],
  'Furniture':    ['bed', 'bench', 'chair', 'couch', 'dining table', 'potted plant', 'toilet'],
  'Personal':     ['backpack', 'book', 'cell phone', 'handbag', 'laptop', 'suitcase'],
}

const W = 900, H = 300
const PAD = { top: 20, right: 24, bottom: 46, left: 58 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

// ── Shared chart component ────────────────────────────────────────────────────
// yFormat: 'percent' → values are 0-1 fractions, label as %; 'avg' → raw avg per photo

function TimelineChart({ items, series, months, groups, colorOf, defaultVisible, yFormat = 'percent' }) {
  const [enabled, setEnabled] = useState(() => new Set(defaultVisible ?? items.slice(0, 8)))
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [legendSearch, setLegendSearch] = useState('')
  const svgRef = useRef(null)
  const searchRef = useRef(null)

  // Reset enabled + search when dataset switches
  const prevItemsRef = useRef(items)
  if (prevItemsRef.current !== items) {
    prevItemsRef.current = items
    enabled.clear()
    ;(defaultVisible ?? items.slice(0, 8)).forEach(i => enabled.add(i))
    setLegendSearch('')
  }

  const colorOfItem = useCallback((item) => colorOf(item), [colorOf])

  const maxVal = useMemo(() => {
    let m = 0.01
    for (const item of enabled) {
      const s = series[item]
      if (!s) continue
      for (const v of s) if (v > m) m = v
    }
    // percent mode: cap at 1; avg mode: uncapped
    return yFormat === 'percent' ? Math.min(m * 1.05, 1) : m * 1.1
  }, [enabled, series, yFormat])

  const paths = useMemo(() => {
    const result = {}
    for (const item of items) {
      const vals = series[item]
      if (!vals) continue
      result[item] = vals
        .map((v, i) => {
          const x = (PAD.left + (i / (months.length - 1)) * IW).toFixed(1)
          const y = (PAD.top + IH - (v / maxVal) * IH).toFixed(1)
          return `${i === 0 ? 'M' : 'L'}${x},${y}`
        })
        .join(' ')
    }
    return result
  }, [items, series, months.length, maxVal])

  const yearTicks = useMemo(() => {
    const ticks = []
    let last = null
    months.forEach((m, i) => {
      const yr = m.slice(0, 4)
      if (yr !== last) { last = yr; ticks.push({ i, label: yr }) }
    })
    return ticks
  }, [months])

  const yTicks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map(t => {
      const val = maxVal * t
      let label
      if (yFormat === 'percent') {
        label = (val * 100).toFixed(val < 0.1 ? 1 : 0) + '%'
      } else {
        label = val < 1 ? val.toFixed(2) : val.toFixed(1)
      }
      return { label, y: PAD.top + IH - t * IH }
    })
  }, [maxVal, yFormat])

  const onMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const svgX = (e.clientX - rect.left) / rect.width * W
    const idx  = Math.round(((svgX - PAD.left) / IW) * (months.length - 1))
    setHoveredIdx(Math.max(0, Math.min(months.length - 1, idx)))
  }, [months.length])

  const onMouseLeave = useCallback(() => setHoveredIdx(null), [])

  const tooltip = useMemo(() => {
    if (hoveredIdx === null) return null
    const x = PAD.left + (hoveredIdx / (months.length - 1)) * IW
    const rows = [...enabled]
      .map(item => ({ item, v: series[item]?.[hoveredIdx] ?? 0, color: colorOfItem(item) }))
      .filter(d => d.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 10)
    return { month: months[hoveredIdx], x, rows }
  }, [hoveredIdx, enabled, series, months, colorOfItem])

  const toggle = (item) =>
    setEnabled(prev => { const n = new Set(prev); n.has(item) ? n.delete(item) : n.add(item); return n })

  const toggleGroup = (members) => {
    const allOn = members.every(o => enabled.has(o))
    setEnabled(prev => {
      const n = new Set(prev)
      allOn ? members.forEach(o => n.delete(o)) : members.forEach(o => n.add(o))
      return n
    })
  }

  const enabledArr = [...enabled]

  const formatTooltipVal = (v) =>
    yFormat === 'percent'
      ? (v * 100).toFixed(1) + '%'
      : v < 1 ? v.toFixed(2) : v.toFixed(1)

  return (
    <>
      {/* Chart */}
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        >
          {yTicks.map(({ label, y }) => (
            <g key={label}>
              <line x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y}
                stroke="rgba(29,35,41,0.07)" strokeWidth="1" />
              <text x={PAD.left - 7} y={y} textAnchor="end" dominantBaseline="middle"
                style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.4)' }}>
                {label}
              </text>
            </g>
          ))}

          {yearTicks.map(({ i, label }) => {
            const x = PAD.left + (i / (months.length - 1)) * IW
            return (
              <g key={label}>
                <line x1={x} y1={PAD.top + IH} x2={x} y2={PAD.top + IH + 4}
                  stroke="rgba(29,35,41,0.2)" strokeWidth="1" />
                <text x={x} y={PAD.top + IH + 15} textAnchor="middle"
                  style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.45)' }}>
                  {label}
                </text>
              </g>
            )
          })}

          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH}
            stroke="rgba(29,35,41,0.15)" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH}
            stroke="rgba(29,35,41,0.15)" strokeWidth="1" />

          {enabledArr.map(item => (
            <path key={item} d={paths[item]} fill="none"
              stroke={colorOfItem(item)} strokeWidth="1.8"
              strokeLinejoin="round" strokeLinecap="round" opacity="0.82" />
          ))}

          {tooltip && (
            <>
              <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + IH}
                stroke="rgba(29,35,41,0.18)" strokeWidth="1" strokeDasharray="3 3" />
              {enabledArr.map(item => {
                const v = series[item]?.[hoveredIdx] ?? 0
                if (!v) return null
                const cy = PAD.top + IH - (v / maxVal) * IH
                return <circle key={item} cx={tooltip.x} cy={cy} r="3.5"
                  fill={colorOfItem(item)} stroke="white" strokeWidth="1.5" />
              })}
            </>
          )}

          <rect x={PAD.left} y={PAD.top} width={IW} height={IH}
            fill="transparent" style={{ cursor: 'crosshair' }} />
        </svg>

        {tooltip && tooltip.rows.length > 0 && (
          <div style={{
            position: 'absolute', top: 0,
            left: `${(tooltip.x / W * 100).toFixed(2)}%`,
            transform: tooltip.x > W * 0.58 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)',
            background: 'rgba(255,252,246,0.97)',
            border: '1px solid rgba(29,35,41,0.12)',
            borderRadius: '0.8rem', padding: '0.6rem 0.85rem',
            boxShadow: '0 8px 28px rgba(15,23,42,0.14)',
            pointerEvents: 'none', minWidth: '11rem',
            backdropFilter: 'blur(8px)', zIndex: 10,
          }}>
            <p style={{ margin: '0 0 0.45rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
              {tooltip.month}
            </p>
            {tooltip.rows.map(({ item, v, color }) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.22rem' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ font: '0.78rem/1 var(--archive-font-ui)', color: 'var(--archive-color-copy)', flex: 1 }}>{item}</span>
                <span style={{ font: '600 0.78rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)', marginLeft: '0.5rem' }}>
                  {formatTooltipVal(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gap: '0.5rem' }}>

        {items.length > 40 && (
          <div style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder={`Search ${items.length} keywords…`}
              value={legendSearch}
              onChange={(e) => setLegendSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.38rem 2.2rem 0.38rem 0.75rem',
                border: '1px solid rgba(29,35,41,0.18)',
                borderRadius: '999px',
                font: '0.78rem/1.4 var(--archive-font-ui)',
                color: 'var(--archive-color-ink)',
                background: 'rgba(255,255,255,0.7)',
                outline: 'none',
              }}
            />
            {legendSearch && (
              <button
                onClick={() => setLegendSearch('')}
                style={{
                  position: 'absolute', right: '0.55rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--archive-color-muted)',
                  font: '0.8rem/1 var(--archive-font-ui)', padding: '0.1rem',
                }}
              >✕</button>
            )}
          </div>
        )}

        <div
          data-lenis-prevent
          style={{
            maxHeight: items.length > 40 ? '16rem' : 'none',
            overflowY: items.length > 40 ? 'auto' : 'visible',
            display: 'grid', gap: '0.45rem',
            paddingRight: items.length > 40 ? '0.25rem' : 0,
          }}>
          {(() => {
            const q = legendSearch.trim().toLowerCase()

            if (q) {
              const matches = items.filter((i) => i.toLowerCase().includes(q))
              if (!matches.length) return (
                <p style={{ margin: 0, font: '0.78rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-muted)', padding: '0.4rem 0.2rem' }}>
                  No keywords match "{legendSearch}".
                </p>
              )
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {matches.map((item) => {
                    const on = enabled.has(item)
                    const color = colorOfItem(item)
                    return (
                      <button key={item} onClick={() => toggle(item)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.22rem 0.55rem', borderRadius: '999px',
                        border: `1.5px solid ${on ? color : 'rgba(29,35,41,0.12)'}`,
                        background: on ? `color-mix(in srgb,${color} 14%,white)` : 'transparent',
                        cursor: 'pointer', font: '0.72rem/1 var(--archive-font-ui)',
                        color: on ? color : 'var(--archive-color-muted)', transition: 'all 0.13s',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: on ? color : 'rgba(29,35,41,0.18)' }} />
                        {item}
                      </button>
                    )
                  })}
                </div>
              )
            }

            return Object.entries(groups).map(([group, members]) => {
              const available = members.filter((o) => items.includes(o))
              if (!available.length) return null
              const allOn = available.every((o) => enabled.has(o))
              return (
                <div key={group} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => toggleGroup(available)} style={{
                    background: 'none', border: '1px solid rgba(29,35,41,0.18)',
                    borderRadius: '999px', padding: '0.2rem 0.6rem',
                    font: '600 0.62rem/1.3 var(--archive-font-ui)', letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0,
                    color: allOn ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)',
                  }}>
                    {group}
                  </button>
                  {available.map((item) => {
                    const on = enabled.has(item)
                    const color = colorOfItem(item)
                    return (
                      <button key={item} onClick={() => toggle(item)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.22rem 0.55rem', borderRadius: '999px',
                        border: `1.5px solid ${on ? color : 'rgba(29,35,41,0.12)'}`,
                        background: on ? `color-mix(in srgb,${color} 14%,white)` : 'transparent',
                        cursor: 'pointer', font: '0.72rem/1 var(--archive-font-ui)',
                        color: on ? color : 'var(--archive-color-muted)', transition: 'all 0.13s',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: on ? color : 'rgba(29,35,41,0.18)' }} />
                        {item}
                      </button>
                    )
                  })}
                </div>
              )
            })
          })()}
        </div>
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

const YOLO_DEFAULT_VISIBLE = ['person', 'chair', 'cup', 'car', 'handbag', 'bowl', 'potted plant', 'bottle']

export default function YoloObjectTimeline() {
  const tl = assignment2Data.yoloTimeline
  if (!tl) return null

  const yoloItems   = useMemo(() => ['person', ...tl.objects], [tl])
  const yoloSeries  = useMemo(() => tl.seriesCounts, [tl])

  const gemmaItems  = gemmaKeywordsData.keywords
  const gemmaSeries = gemmaKeywordsData.series
  const gemmaMonths = gemmaKeywordsData.months
  const gemmaGroups = gemmaKeywordsData.groups

  const yoloColorOf  = useCallback((item) => PALETTE[yoloItems.indexOf(item)  % PALETTE.length], [yoloItems])
  const gemmaColorOf = useCallback((item) => PALETTE[gemmaItems.indexOf(item) % PALETTE.length], [gemmaItems])

  const cardStyle = {
    position: 'relative', display: 'grid', gap: '1rem', padding: '1.2rem',
    border: '1px solid var(--archive-color-rule)', borderRadius: '1.75rem',
    background:
      'linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,244,237,0.9)),' +
      'radial-gradient(circle at 14% 18%,rgba(62,91,113,0.08),transparent 34%)',
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* ── YOLO Objects chart ── */}
      <div style={cardStyle}>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <p style={{ margin: 0, font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Visual Signals Over Time — YOLO Objects
          </p>
          <h3 style={{ margin: 0, font: '500 clamp(1.45rem,1.2vw + 1rem,1.95rem)/1.12 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            Average number of each detected object per photo, by month.
          </h3>
          <p style={{ margin: 0, maxWidth: '52rem', fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--archive-color-copy)' }}>
            YOLO counts every instance in each photo — three chairs in one photo counts as three. The y-axis shows the average count per photo that month, so values above 1 mean the object appeared multiple times per photo on average.
          </p>
        </div>
        <TimelineChart
          items={yoloItems}
          series={yoloSeries}
          months={tl.months}
          groups={YOLO_GROUPS}
          colorOf={yoloColorOf}
          defaultVisible={YOLO_DEFAULT_VISIBLE}
          yFormat="avg"
        />
      </div>

      {/* ── Gemma Keywords chart ── */}
      <div style={cardStyle}>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <p style={{ margin: 0, font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Visual Signals Over Time — Gemma Keywords
          </p>
          <h3 style={{ margin: 0, font: '500 clamp(1.45rem,1.2vw + 1rem,1.95rem)/1.12 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            Share of photos each month mentioning each keyword.
          </h3>
          <p style={{ margin: 0, maxWidth: '52rem', fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--archive-color-copy)' }}>
            Each value is the fraction of photos in that month whose Gemma-generated caption contains the keyword — presence or absence per photo, not a count. {gemmaItems.length} keywords total — search below to find specific terms.
          </p>
        </div>
        <TimelineChart
          items={gemmaItems}
          series={gemmaSeries}
          months={gemmaMonths}
          groups={gemmaGroups}
          colorOf={gemmaColorOf}
          yFormat="percent"
        />
      </div>

    </div>
  )
}
