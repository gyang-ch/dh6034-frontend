import { useEffect, useRef, useState, useMemo } from 'react'
import { scaleBand, scaleLinear } from 'd3'
import { brushX } from 'd3'
import { select } from 'd3'
import { photographUrl } from '../lib/photographs'

const chartHeight = 340
const BRUSH_H = 12
const BRUSH_GAP = 8
const paddingBase = { top: 16, right: 20, left: 54 }
const monthFmt = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' })

const imageUrl = photographUrl

function barPath(x, barTop, bw, bh) {
  if (bh <= 0) return ''
  const r = Math.min(4, bh / 2, bw / 2)
  return `M${x},${barTop + r} Q${x},${barTop} ${x + r},${barTop} H${x + bw - r} Q${x + bw},${barTop} ${x + bw},${barTop + r} V${barTop + bh} H${x} Z`
}

function gradId(key) {
  return `tg-${key.replace(/[^a-z0-9]/gi, '_')}`
}

export default function TemporalRibbon({ bins }) {
  const POPUP_WIDTH = 260
  const POPUP_OFFSET = 18
  const [granularity, setGranularity] = useState('year')
  const [activeKey, setActiveKey] = useState(null)
  const [brushedPixelRange, setBrushedPixelRange] = useState(null)
  const [popup, setPopup] = useState(null)
  const brushElRef = useRef(null)
  const shellRef = useRef(null)

  const monthBins = useMemo(() => bins.map((bin) => {
    const monthIndex = Number(bin.month.slice(5, 7))
    const monthLabel = monthFmt.format(new Date(Date.UTC(Number(bin.year), monthIndex - 1, 1)))
    return { ...bin, key: bin.month, monthLabel, showMonthTick: [1, 4, 7, 10].includes(monthIndex) }
  }), [bins])

  const yearBins = useMemo(() => {
    const map = new Map()
    for (const bin of bins) {
      const entry = map.get(bin.year)
      if (entry) {
        entry.count += bin.count
        for (const p of bin.places) { if (!entry.places.includes(p) && entry.places.length < 6) entry.places.push(p) }
        if (bin.count > entry.topCount) { entry.topCount = bin.count; entry.samples = bin.samples }
      } else {
        map.set(bin.year, { year: bin.year, count: bin.count, places: [...bin.places], samples: [...bin.samples], topCount: bin.count })
      }
    }
    return [...map.values()].map(({ topCount, ...e }) => ({ key: e.year, label: e.year, year: e.year, count: e.count, places: e.places, samples: e.samples }))
  }, [bins])

  const activeBins = granularity === 'month' ? monthBins : yearBins
  const paddingBottom = granularity === 'month' ? 86 : 54
  const chartWidth = granularity === 'month' ? Math.max(960, activeBins.length * 18) : Math.max(560, activeBins.length * 44)
  const maxCount = Math.max(...activeBins.map((b) => b.count), 1)
  const innerWidth = chartWidth - paddingBase.left - paddingBase.right
  const innerHeight = chartHeight - paddingBase.top - paddingBottom

  const xScale = useMemo(() =>
    scaleBand().domain(activeBins.map((b) => b.key)).range([0, innerWidth]).paddingInner(granularity === 'year' ? 0.18 : 0.08).paddingOuter(0.05),
    [activeBins, innerWidth, granularity]
  )
  const yScale = useMemo(() => scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0]), [maxCount, innerHeight])
  const yTicks = useMemo(() => {
    const steps = 4
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxCount / steps) * (steps - i)))
  }, [maxCount])

  const yearGroups = useMemo(() => {
    if (granularity !== 'month') return []
    const groups = new Map()
    for (const bin of activeBins) {
      const existing = groups.get(bin.year)
      if (existing) existing.endKey = bin.key
      else groups.set(bin.year, { year: bin.year, startKey: bin.key, endKey: bin.key })
    }
    return [...groups.values()]
  }, [activeBins, granularity])

  useEffect(() => {
    const exists = activeBins.some((b) => b.key === activeKey)
    if (!exists) {
      const peak = activeBins.find((b) => b.count === maxCount)
      setActiveKey(peak?.key ?? activeBins[0]?.key ?? null)
    }
  }, [activeBins, maxCount])

  useEffect(() => {
    if (!brushElRef.current || innerWidth <= 0) return
    setBrushedPixelRange(null)
    const brush = brushX().extent([[0, 0], [innerWidth, BRUSH_H]]).on('brush end', (event) => {
      setBrushedPixelRange(event.selection ?? null)
    })
    const sel = select(brushElRef.current)
    sel.call(brush)
    return () => { sel.selectAll('*').remove(); setBrushedPixelRange(null) }
  }, [innerWidth, granularity])

  function isInBrush(key) {
    if (!brushedPixelRange) return true
    const x = xScale(key)
    if (x === undefined) return true
    const mid = x + xScale.bandwidth() / 2
    return mid >= brushedPixelRange[0] && mid <= brushedPixelRange[1]
  }

  const brushedBins = brushedPixelRange ? activeBins.filter((b) => isInBrush(b.key)) : null
  const brushedTotal = brushedBins ? brushedBins.reduce((s, b) => s + b.count, 0) : null
  const brushedLabel = brushedBins?.length > 0 ? `${brushedBins[0].label} – ${brushedBins[brushedBins.length - 1].label}` : null

  const activeBin = activeBins.find((b) => b.key === activeKey) ?? activeBins[0] ?? null
  const popupPosition = popup && shellRef.current
    ? (() => {
        const shellWidth = shellRef.current.clientWidth
        const shellHeight = shellRef.current.clientHeight
        const estimatedHeight = activeBin?.samples?.length > 0 ? 240 : 132
        const left = Math.min(
          Math.max(popup.x + POPUP_OFFSET, 12),
          Math.max(12, shellWidth - POPUP_WIDTH - 12)
        )
        const top = Math.min(
          Math.max(popup.y + POPUP_OFFSET, 12),
          Math.max(12, shellHeight - estimatedHeight - 12)
        )
        return { left, top }
      })()
    : null

  const handleGranularityChange = (g) => {
    if (g === granularity) return
    setBrushedPixelRange(null)
    setGranularity(g)
  }

  return (
    <div ref={shellRef} className="ribbon-shell" style={{ position: 'relative', display: 'grid', gap: '1rem', padding: '1.2rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.75rem', background: 'linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,244,237,0.9)),radial-gradient(circle at 14% 18%,rgba(62,91,113,0.08),transparent 34%)' }}
      role="region" aria-label="Temporal histogram"
      onMouseMove={(e) => {
        const rect = shellRef.current?.getBoundingClientRect()
        if (rect) setPopup((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev)
      }}
    >
      {/* Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: 'auto auto', alignItems: 'start', gap: '0.75rem 1.5rem' }}>
        <div>
          <p style={{ margin: 0, font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Temporal Register</p>
          <h3 style={{ margin: '0.3rem 0 0', font: '500 clamp(1.45rem,1.2vw + 1rem,1.95rem)/1.12 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>When the archive thickens.</h3>
        </div>
        <div role="group" aria-label="Group by time period" style={{ display: 'flex', alignItems: 'center', padding: '3px', background: 'rgba(29,35,41,0.07)', borderRadius: '999px', gap: '2px' }}>
          {['Month', 'Year'].map((g) => {
            const key = g.toLowerCase()
            const active = granularity === key
            return (
              <button key={key} type="button" aria-pressed={active}
                onClick={() => handleGranularityChange(key)}
                style={{ padding: '0.35rem 0.95rem', border: 'none', borderRadius: '999px', font: '500 0.82rem/1 var(--archive-font-ui)', cursor: 'pointer', transition: 'background 150ms ease,color 150ms ease', background: active ? 'rgba(255,255,255,0.92)' : 'transparent', color: active ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)', boxShadow: active ? '0 1px 4px rgba(29,35,41,0.13)' : 'none' }}>
                {g}
              </button>
            )
          })}
        </div>
        <p style={{ gridColumn: '1/-1', margin: 0, maxWidth: '52rem', fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--archive-color-copy)' }}>
          {granularity === 'month' ? 'The archive is plotted month by month. Drag the range selector below the bars to zoom in on any period.' : 'The archive is plotted year by year. Drag the range selector to highlight any span.'}
        </p>
      </div>

      {/* Brush summary */}
      {brushedLabel && brushedTotal !== null && (
        <div role="status" aria-live="polite" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', padding: '0.6rem 1rem', borderRadius: '999px', background: 'rgba(62,91,113,0.09)', border: '1px solid rgba(62,91,113,0.2)', font: '0.84rem/1.2 var(--archive-font-ui)' }}>
          <span style={{ fontWeight: 600, color: 'var(--archive-color-ink)' }}>{brushedLabel}</span>
          <span style={{ color: 'var(--archive-color-copy)' }}>{brushedTotal} photos in selection</span>
          <button type="button" onClick={() => setBrushedPixelRange(null)} style={{ marginLeft: 'auto', padding: '0.3rem 0.7rem', border: '1px solid rgba(62,91,113,0.25)', borderRadius: '999px', background: 'rgba(255,255,255,0.8)', font: '0.78rem/1 var(--archive-font-ui)', color: 'var(--archive-color-accent)', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Chart */}
      <div style={{ display: 'grid', gap: '0.7rem' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '0.45rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.35rem' }}
          onMouseLeave={() => setPopup(null)}>
          <div style={{ minWidth: '100%', width: `${chartWidth}px`, padding: '0.9rem 0.9rem 0.35rem' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                {activeBins.map((bin) => {
                  if (bin.samples.length < 2) return null
                  const colors = bin.samples.slice(0, 3).map((s) => s.color)
                  return (
                    <linearGradient key={bin.key} id={gradId(bin.key)} x1="0" y1="0" x2="0" y2="1">
                      {colors.map((color, ci) => <stop key={ci} offset={`${Math.round((ci / (colors.length - 1)) * 100)}%`} stopColor={color} />)}
                    </linearGradient>
                  )
                })}
              </defs>
              <g transform={`translate(${paddingBase.left},${paddingBase.top})`}>
                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line x1="0" x2={innerWidth} y1={yScale(tick)} y2={yScale(tick)} stroke="rgba(29,35,41,0.1)" strokeWidth="1" strokeDasharray="4 4" shapeRendering="crispEdges" />
                    <text x="-12" y={yScale(tick) + 4} style={{ font: '0.7rem/1 var(--archive-font-ui)', fill: 'var(--archive-color-muted)' }} textAnchor="end">{tick}</text>
                  </g>
                ))}

                {granularity === 'month' && yearGroups.map((group, gi) => {
                  const startX = xScale(group.startKey) ?? 0
                  const endX = (xScale(group.endKey) ?? 0) + xScale.bandwidth()
                  return (
                    <g key={group.year}>
                      {gi > 0 && <line x1={startX - 6} x2={startX - 6} y1="0" y2={innerHeight} stroke="rgba(29,35,41,0.16)" strokeWidth="1" shapeRendering="crispEdges" />}
                      <text x={(startX + endX) / 2} y={innerHeight + 54} textAnchor="middle" style={{ font: '600 12px/1 var(--archive-font-ui)', fill: 'var(--archive-color-muted)', letterSpacing: '0.08em' }}>{group.year}</text>
                    </g>
                  )
                })}

                {activeBins.map((bin, i) => {
                  const x = xScale(bin.key) ?? 0
                  const bw = xScale.bandwidth()
                  const barTop = yScale(bin.count)
                  const bh = innerHeight - barTop
                  const dimmed = !isInBrush(bin.key)
                  const fill = bin.samples.length >= 2 ? `url(#${gradId(bin.key)})` : (bin.samples[0]?.color ?? '#7b8a95')
                  return (
                    <path key={bin.key}
                      d={barPath(x, barTop, bw, Math.max(0, bh))}
                      fill={fill}
                      fillOpacity={dimmed ? 0.18 : activeKey === bin.key ? 1 : 0.72}
                      style={{ cursor: 'pointer', shapeRendering: 'crispEdges', animationDelay: `${i * (granularity === 'year' ? 22 : 6)}ms` }}
                      onMouseEnter={(event) => {
                        setActiveKey(bin.key)
                        const rect = shellRef.current?.getBoundingClientRect()
                        if (rect) {
                          setPopup({
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                          })
                        }
                      }}
                      onClick={() => setActiveKey(bin.key)}
                      tabIndex="0" role="button"
                      aria-label={`${bin.label}, ${bin.count} photographs`}
                    />
                  )
                })}

                {activeBins.map((bin) => {
                  const x = xScale(bin.key) ?? 0
                  const bw = xScale.bandwidth()
                  if (granularity === 'year') {
                    return <text key={bin.key} x={x + bw / 2} y={innerHeight + 26} textAnchor="middle"
                      style={{ font: activeKey === bin.key ? '700 12px/1 var(--archive-font-ui)' : '600 12px/1 var(--archive-font-ui)', fill: activeKey === bin.key ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)' }}>
                      {bin.year}
                    </text>
                  } else if (bin.showMonthTick) {
                    return <text key={bin.key} x={x + bw / 2} y={innerHeight + 24} textAnchor="middle"
                      style={{ font: activeKey === bin.key ? '600 11px/1 var(--archive-font-ui)' : '11px/1 var(--archive-font-ui)', fill: activeKey === bin.key ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)' }}>
                      {bin.monthLabel}
                    </text>
                  }
                  return null
                })}

                <g ref={brushElRef} transform={`translate(0,${innerHeight + BRUSH_GAP})`} />
              </g>
            </svg>
          </div>
        </div>
        <p style={{ margin: 0, font: '0.78rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
          Drag the slim bar below the chart to select a {granularity === 'month' ? 'date' : 'year'} range · hover any bar for detail
        </p>
      </div>

      {/* Hover popup */}
      {activeBin && popupPosition && (
        <div style={{ position: 'absolute', zIndex: 20, pointerEvents: 'none', width: `${POPUP_WIDTH}px`, padding: '0.85rem 1rem', background: 'rgba(255,253,249,0.97)', border: '1px solid rgba(29,35,41,0.11)', borderRadius: '1.1rem', boxShadow: '0 6px 28px rgba(29,35,41,0.1)', backdropFilter: 'blur(6px)', display: 'grid', gap: '0.38rem', left: `${popupPosition.left}px`, top: `${popupPosition.top}px` }}>
          <p style={{ margin: 0, font: '600 0.9rem/1.2 var(--archive-font-ui)', color: 'var(--archive-color-ink)' }}>{activeBin.label}</p>
          <p style={{ margin: 0, font: '500 0.82rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>{activeBin.count} photographs</p>
          {activeBin.places.length > 0 && (
            <p style={{ margin: 0, font: '0.78rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{activeBin.places.slice(0, 4).join(' · ')}</p>
          )}
          {activeBin.samples.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem', marginTop: '0.25rem' }}>
              {activeBin.samples.slice(0, 3).map((s) => (
                <img key={s.filename} src={imageUrl(s.imagePath)} alt={s.filename} loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '0.5rem' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
