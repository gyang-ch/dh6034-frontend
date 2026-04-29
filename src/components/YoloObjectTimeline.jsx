import { useState, useMemo, useRef, useCallback } from 'react'
import { assignment2Data } from '../data/assignment2Data'
import { gemmaKeywordsData } from '../data/gemmaKeywordsData'

const PALETTE = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#86bcb6',
  '#4dc0e8','#d4a6c8','#a0cbe8','#ffbe7d','#8cd17d',
  '#b6992d','#499894','#d37295','#a8786a','#c9a227'
]

const YOLO_GROUPS = {
  'People':       ['person'],
  'Vehicles':     ['airplane', 'bicycle', 'bus', 'car', 'train'],
  'Animals':      ['bear', 'bird', 'cat', 'cow', 'dog', 'elephant', 'horse'],
  'Furniture':    ['bed', 'bench', 'chair', 'couch', 'dining table', 'potted plant'],
  'Personal':     ['backpack', 'book', 'cell phone', 'handbag', 'laptop'],
}

const W = 900, H = 300
const PAD = { top: 20, right: 24, bottom: 46, left: 58 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

function TimelineChart({ items, series, months, groups, colorOf, defaultVisible, yFormat = 'percent' }) {
  const [enabled, setEnabled] = useState(() => new Set(defaultVisible ?? items.slice(0, 8)))
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [legendSearch, setLegendSearch] = useState('')
  const svgRef = useRef(null)

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
      let label = yFormat === 'percent' 
        ? (val * 100).toFixed(val < 0.1 ? 1 : 0) + '%'
        : val < 1 ? val.toFixed(2) : val.toFixed(1)
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

  const enabledArr = [...enabled]

  const formatTooltipVal = (v) =>
    yFormat === 'percent' ? (v * 100).toFixed(1) + '%' : v < 1 ? v.toFixed(2) : v.toFixed(1)

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Chart */}
      <div style={{ position: 'relative', border: '1px solid var(--archive-color-rule)', background: 'rgba(29,35,41,0.01)', padding: '1rem 0' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
          
          {/* Y-Axis Grid & Labels */}
          {yTicks.map(({ label, y }) => (
            <g key={label}>
              <line x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y} stroke="var(--archive-color-rule)" strokeWidth="1" strokeDasharray="2 4" />
              <text x={PAD.left - 10} y={y} textAnchor="end" dominantBaseline="middle" style={{ font: '11px var(--archive-font-data)', fill: 'var(--archive-color-muted)' }}>
                {label}
              </text>
            </g>
          ))}

          {/* X-Axis Ticks */}
          {yearTicks.map(({ i, label }) => {
            const x = PAD.left + (i / (months.length - 1)) * IW
            return (
              <g key={label}>
                <line x1={x} y1={PAD.top + IH} x2={x} y2={PAD.top + IH + 5} stroke="var(--archive-color-ink)" strokeWidth="1" />
                <text x={x} y={PAD.top + IH + 18} textAnchor="middle" style={{ font: '11px var(--archive-font-data)', fill: 'var(--archive-color-copy)' }}>
                  {label}
                </text>
              </g>
            )
          })}

          {/* Solid Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH} stroke="var(--archive-color-ink)" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH} stroke="var(--archive-color-ink)" strokeWidth="1" />

          {/* Data Lines */}
          {enabledArr.map(item => (
            <path key={item} d={paths[item]} fill="none" stroke={colorOfItem(item)} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />
          ))}

          {/* Interactive Tooltip Cursor */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + IH} stroke="var(--archive-color-ink)" strokeWidth="1" opacity="0.3" />
              {enabledArr.map(item => {
                const v = series[item]?.[hoveredIdx] ?? 0
                if (!v) return null
                const cy = PAD.top + IH - (v / maxVal) * IH
                return <circle key={item} cx={tooltip.x} cy={cy} r="3" fill={colorOfItem(item)} stroke="var(--archive-color-bg)" strokeWidth="1.5" />
              })}
            </>
          )}
          <rect x={PAD.left} y={PAD.top} width={IW} height={IH} fill="transparent" style={{ cursor: 'crosshair' }} />
        </svg>

        {tooltip && tooltip.rows.length > 0 && (
          <div style={{
            position: 'absolute', top: 0,
            left: `${(tooltip.x / W * 100).toFixed(2)}%`,
            transform: tooltip.x > W * 0.58 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)',
            background: 'var(--archive-color-bg)',
            border: '1px solid var(--archive-color-ink)',
            borderRadius: '4px', padding: '0.75rem',
            boxShadow: '4px 4px 0 rgba(29,35,41,0.08)', // Academic shadow
            pointerEvents: 'none', minWidth: '11rem', zIndex: 10,
          }}>
            <p style={{ margin: '0 0 0.5rem', font: '600 0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
              {tooltip.month}
            </p>
            {tooltip.rows.map(({ item, v, color }) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ width: 8, height: 8, background: color, flexShrink: 0 }} />
                <span style={{ font: '400 0.85rem/1 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-copy)', flex: 1 }}>{item}</span>
                <span style={{ font: '400 0.8rem/1 var(--archive-font-data)', color: 'var(--archive-color-ink)', marginLeft: '0.5rem' }}>
                  {formatTooltipVal(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend & Controls */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {items.length > 40 && (
          <div style={{ position: 'relative', maxWidth: '16rem' }}>
            <input
              type="text"
              placeholder="Filter subjects..."
              value={legendSearch}
              onChange={(e) => setLegendSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.25rem 0',
                border: 'none',
                borderBottom: '1px solid var(--archive-color-ink)', // Academic input style
                background: 'transparent',
                font: '400 0.9rem/1 "Aptos", "Segoe UI", sans-serif',
                color: 'var(--archive-color-ink)',
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{
            maxHeight: items.length > 40 ? '12rem' : 'none',
            overflowY: items.length > 40 ? 'auto' : 'visible',
            paddingRight: items.length > 40 ? '0.5rem' : 0,
        }} className="custom-scrollbar">
          {(() => {
            const q = legendSearch.trim().toLowerCase()
            const displayItems = q ? items.filter((i) => i.toLowerCase().includes(q)) : items

            if (q && !displayItems.length) return (
              <p style={{ margin: 0, font: '400 0.85rem "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-muted)' }}>
                No records match "{legendSearch}".
              </p>
            )

            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {displayItems.map((item) => {
                  const on = enabled.has(item)
                  const color = colorOfItem(item)
                  return (
                    <button key={item} onClick={() => toggle(item)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.28rem 0.65rem',
                      border: `1px solid ${on ? color : 'var(--archive-color-rule)'}`,
                      borderRadius: '999px',
                      background: on ? `${color}18` : 'var(--archive-color-bg)',
                      cursor: 'pointer',
                      font: `${on ? '600' : '400'} 0.78rem/1 var(--archive-font-ui)`,
                      color: on ? 'var(--archive-color-ink)' : 'var(--archive-color-copy)',
                      transition: 'all 0.15s ease',
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: on ? color : 'var(--archive-color-rule)' }} />
                      {item}
                    </button>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

const YOLO_DEFAULT_VISIBLE = ['person', 'chair', 'cup', 'car', 'handbag', 'bowl']

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

  const articleStyle = {
    display: 'grid', gap: '1.5rem', padding: '2.5rem',
    border: '1px solid var(--archive-color-rule)',
    borderRadius: 'var(--radius-soft, 8px)',
    background: 'var(--archive-color-bg)',
    boxShadow: '0 4px 30px -15px rgba(0,0,0,0.06)',
    marginBottom: '2rem'
  }

  return (
    <div>
      {/* ── YOLO Objects ── */}
      <article style={articleStyle}>
        <header style={{ display: 'grid', gap: '0.75rem', borderBottom: '1px solid var(--archive-color-rule)', paddingBottom: '1.5rem' }}>
          <p style={{ margin: 0, font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>
            Figure 3. Visual Signals Over Time — YOLO Objects
          </p>
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '45rem' }}>
            Average number of each detected object per photograph.
          </h3>
          <p style={{ margin: 0, maxWidth: '45rem', font: '400 0.9rem/1.6 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-copy)' }}>
            YOLO counts every instance in each photo. The y-axis shows the average count per photo that month, so values above 1 mean the object appeared multiple times per photo on average.
          </p>
        </header>
        <TimelineChart items={yoloItems} series={yoloSeries} months={tl.months} groups={YOLO_GROUPS} colorOf={yoloColorOf} defaultVisible={YOLO_DEFAULT_VISIBLE} yFormat="avg" />
      </article>

      {/* ── Gemma Keywords ── */}
      <article style={articleStyle}>
        <header style={{ display: 'grid', gap: '0.75rem', borderBottom: '1px solid var(--archive-color-rule)', paddingBottom: '1.5rem' }}>
          <p style={{ margin: 0, font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>
            Figure 4. Visual Signals Over Time — Gemma Keywords
          </p>
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '45rem' }}>
            Share of photos each month mentioning specific concepts.
          </h3>
          <p style={{ margin: 0, maxWidth: '45rem', font: '400 0.9rem/1.6 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-copy)' }}>
            Each value represents the fraction of photos in a given month where the generated caption contains the exact keyword. Presence or absence is noted per photo, regardless of multiple occurrences.
          </p>
        </header>
        <TimelineChart items={gemmaItems} series={gemmaSeries} months={gemmaMonths} groups={gemmaGroups} colorOf={gemmaColorOf} yFormat="percent" />
      </article>
    </div>
  )
}