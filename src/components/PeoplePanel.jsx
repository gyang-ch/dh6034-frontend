import { useState } from 'react'

const PALETTE = ['#7f8ea0', '#9f6f45', '#6a8373', '#3e5b71', '#c28d5b']

const R = 36, CX = 48, CY = 52, START_DEG = 135, SWEEP_DEG = 270

function polarToXY(deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
}

export default function PeoplePanel({ bins, withPeople, totalImages }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [dialHovered, setDialHovered] = useState(false)

  const maxCount = Math.max(...bins.map((b) => b.count), 1)
  const pct = totalImages > 0 ? Math.round((withPeople / totalImages) * 100) : 0

  const trackStart = polarToXY(START_DEG)
  const trackEnd = polarToXY(START_DEG + SWEEP_DEG)
  const fillEnd = polarToXY(START_DEG + (SWEEP_DEG * pct) / 100)
  const fillLarge = (SWEEP_DEG * pct) / 100 > 180 ? 1 : 0

  return (
    <article className="archive-panel" style={{ display: 'grid', gap: '1.25rem', padding: '1.4rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.74)', transition: 'transform 0.3s, box-shadow 0.3s' }}>
      <header style={{ display: 'grid', gap: '0.45rem' }}>
        <p style={{ margin: 0, font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Social Presence</p>
        <h3 style={{ margin: 0, font: '500 1.45rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>How many people appear in each photograph.</h3>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '6rem 1fr', gap: '1rem', alignItems: 'center' }}>
        <div
          style={{ width: '100%', cursor: 'default' }}
          aria-label={`${pct}% of photos include at least one person`}
          onMouseEnter={() => setDialHovered(true)}
          onMouseLeave={() => setDialHovered(false)}
        >
          <svg viewBox="0 0 96 72" fill="none" aria-hidden="true" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <path d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 1 1 ${trackEnd.x} ${trackEnd.y}`} stroke="rgba(32,38,44,0.08)" strokeWidth="7" strokeLinecap="round" fill="none" />
            {pct > 0 && (
              <path d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 ${fillLarge} 1 ${fillEnd.x} ${fillEnd.y}`} stroke="#9f6f45" strokeWidth="7" strokeLinecap="round" fill="none" />
            )}
            {dialHovered ? (
              <>
                <text x={CX} y={CY - 7} textAnchor="middle" style={{ font: '700 14px/1 var(--archive-font-ui)', fill: 'var(--archive-color-ink)' }}>{withPeople.toLocaleString()}</text>
                <text x={CX} y={CY + 7} textAnchor="middle" style={{ font: '500 6px/1 var(--archive-font-ui)', fill: 'var(--archive-color-muted)' }}>with people</text>
              </>
            ) : (
              <>
                <text x={CX} y={CY - 6} textAnchor="middle" style={{ font: '700 14px/1 var(--archive-font-ui)', fill: 'var(--archive-color-ink)' }}>{pct}%</text>
                <text x={CX} y={CY + 8} textAnchor="middle" style={{ font: '500 6px/1 var(--archive-font-ui)', fill: 'var(--archive-color-muted)' }}>with people</text>
              </>
            )}
          </svg>
        </div>

        <div role="list" aria-label="Person count distribution" style={{ display: 'grid', gap: '0.85rem' }}>
          {bins.map((bin, i) => (
            <div
              key={bin.label}
              role="listitem"
              style={{ cursor: 'crosshair', opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.38 : 1, transition: 'opacity 0.22s ease' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.3rem', font: '0.88rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                <span>{bin.label}</span>
                <span>{bin.count.toLocaleString()}</span>
              </div>
              <div style={{ height: '0.6rem', borderRadius: '999px', background: 'rgba(32,38,44,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: `${(bin.count / maxCount) * 100}%`, background: PALETTE[i % PALETTE.length], transition: 'width 0.55s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
