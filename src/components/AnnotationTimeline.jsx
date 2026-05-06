import { useState } from 'react'
import { annotationTimelineData } from '../data/annotationTimelineData'
import { assignment2Data } from '../data/assignment2Data'

const PCT_COLOR    = '#5c7c92'
const PEOPLE_COLOR = '#c28d5b'
const YOLO_COLOR   = '#7b6f9c'

const W = 700, H = 210
const PAD = { top: 20, right: 16, bottom: 36, left: 52 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top  - PAD.bottom

const MIN_YEAR = annotationTimelineData[0].year
const MAX_YEAR = annotationTimelineData[annotationTimelineData.length - 1].year

const yoloYearlyData = (() => {
  const { months, seriesCounts } = assignment2Data.yoloTimeline
  const personSeries = seriesCounts.person
  const byYear = {}
  months.forEach((month, i) => {
    const yr = parseInt(month.slice(0, 4), 10)
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(personSeries[i])
  })
  return annotationTimelineData.map(d => {
    const vals = byYear[d.year]
    if (!vals || vals.length === 0) return 0
    return vals.reduce((s, v) => s + v, 0) / vals.length
  })
})()

const MAX_PEOPLE = Math.ceil(
  Math.max(4, ...annotationTimelineData.map(d => d.avgMainPeople), ...yoloYearlyData) / 2
) * 2

const MAX_TOTAL = Math.max(...annotationTimelineData.map(d => d.total))

function xOf(year)   { return PAD.left + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * IW }
function yOfPct(v)   { return PAD.top  + IH - (v / 100) * IH }
function yOfPpl(v)   { return PAD.top  + IH - (v / MAX_PEOPLE) * IH }

function mkPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

const pctPts    = annotationTimelineData.map(d => ({ x: xOf(d.year), y: yOfPct(d.myselfPct) }))
const peoplePts = annotationTimelineData.map(d => ({ x: xOf(d.year), y: yOfPpl(d.avgMainPeople) }))
const yoloPts   = yoloYearlyData.map((v, i) => ({ x: xOf(annotationTimelineData[i].year), y: yOfPpl(v) }))
const baseY     = PAD.top + IH

const pctLinePath    = mkPath(pctPts)
const peoplePtsLine  = mkPath(peoplePts)
const yoloLinePath   = mkPath(yoloPts)
const pctAreaPath    = `${pctLinePath} L${pctPts.at(-1).x},${baseY} L${pctPts[0].x},${baseY} Z`
const peopleAreaPath = `${peoplePtsLine} L${peoplePts.at(-1).x},${baseY} L${peoplePts[0].x},${baseY} Z`

const X_TICKS        = [2004, 2008, 2012, 2016, 2020, 2024]
const Y_TICKS_PCT    = [0, 25, 50, 75, 100]
const Y_TICKS_PEOPLE = [0, 1, 2, 3, 4].map(i => Math.round(MAX_PEOPLE * i / 4))

const slotW = IW / annotationTimelineData.length

const CARD = {
  borderRadius: '1.6rem',
  border: '1px solid var(--archive-color-rule)',
  background: 'rgba(255,255,255,0.72)',
  padding: '1.4rem 1.6rem',
  boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)',
  margin: '0 4rem',
}

function XAxis() {
  return X_TICKS.map(yr => {
    const x = xOf(yr)
    return (
      <g key={yr}>
        <line x1={x} y1={baseY} x2={x} y2={baseY + 4} stroke="rgba(29,35,41,0.2)" strokeWidth="1" />
        <text x={x} y={baseY + 14} textAnchor="middle"
          style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.45)' }}>
          {yr}
        </text>
      </g>
    )
  })
}

function AxisLines() {
  return (
    <>
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseY} stroke="rgba(29,35,41,0.14)" strokeWidth="1" />
      <line x1={PAD.left} y1={baseY}   x2={PAD.left + IW} y2={baseY} stroke="rgba(29,35,41,0.14)" strokeWidth="1" />
    </>
  )
}

export function PresenceLineChart() {
  const [hov, setHov] = useState(null)
  const d = hov !== null ? annotationTimelineData[hov] : null
  const tipW = 168, tipH = 54
  const tipX = d ? (xOf(d.year) + 12 + tipW > PAD.left + IW ? xOf(d.year) - tipW - 12 : xOf(d.year) + 12) : 0
  const tipY = PAD.top + 4

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            My Presence
          </p>
          <h3 style={{ margin: 0, font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            Share of photos in which I appear.
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', paddingTop: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke={PCT_COLOR} strokeWidth="2" /><circle cx="11" cy="5" r="2.5" fill="white" stroke={PCT_COLOR} strokeWidth="1.5" /></svg>
            <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>% photos with me</span>
          </div>
          <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>dot size = total photos that year</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHov(null)}>
        <defs>
          <linearGradient id="pres-pct-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PCT_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PCT_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Y_TICKS_PCT.map(tick => {
          const y = yOfPct(tick)
          return (
            <g key={`pct-${tick}`}>
              <line x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y} stroke="rgba(29,35,41,0.07)" strokeWidth="1" />
              <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
                style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(92,124,146,0.7)' }}>
                {tick}%
              </text>
            </g>
          )
        })}

        <XAxis />
        <AxisLines />

        <path d={pctAreaPath} fill="url(#pres-pct-fill)" />
        <path d={pctLinePath} fill="none" stroke={PCT_COLOR} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {d && <line x1={xOf(d.year)} y1={PAD.top} x2={xOf(d.year)} y2={baseY}
          stroke="rgba(29,35,41,0.22)" strokeWidth="1" strokeDasharray="4 3" />}

        {annotationTimelineData.map((pt, i) => {
          const isHov = hov === i
          const rBase = 2 + (Math.sqrt(pt.total) / Math.sqrt(MAX_TOTAL)) * 2
          return (
            <g key={pt.year} onMouseEnter={() => setHov(i)} style={{ cursor: 'default' }}>
              <rect x={xOf(pt.year) - slotW / 2} y={PAD.top} width={slotW} height={IH} fill="transparent" />
              <circle cx={xOf(pt.year)} cy={yOfPct(pt.myselfPct)}
                r={isHov ? rBase + 1.7 : rBase} fill="white" stroke={PCT_COLOR} strokeWidth={isHov ? 2 : 1.5}
                style={{ transition: 'r 0.12s' }} />
            </g>
          )
        })}

        {d && (
          <g pointerEvents="none">
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7"
              fill="rgba(255,252,246,0.97)" stroke="rgba(29,35,41,0.11)" strokeWidth="1" />
            <text x={tipX + 10} y={tipY + 17}
              style={{ font: '600 10.5px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.72)' }}>
              {d.year} · {d.total.toLocaleString()} photos
            </text>
            <circle cx={tipX + 13} cy={tipY + 34} r="3.5" fill={PCT_COLOR} />
            <text x={tipX + 22} y={tipY + 37.5} dominantBaseline="middle"
              style={{ font: '10px var(--archive-font-ui)', fill: PCT_COLOR }}>
              present in {d.myselfPct}% of photos
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

export function PeopleCountLineChart() {
  const [hov, setHov] = useState(null)
  const d = hov !== null ? annotationTimelineData[hov] : null
  const tipW = 168, tipH = 72
  const tipX = d ? (xOf(d.year) + 12 + tipW > PAD.left + IW ? xOf(d.year) - tipW - 12 : xOf(d.year) + 12) : 0
  const tipY = PAD.top + 4

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            People in Photos
          </p>
          <h3 style={{ margin: 0, font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            Average number of people per photo.
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, paddingTop: '0.15rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke={PEOPLE_COLOR} strokeWidth="2" /><circle cx="11" cy="5" r="2.5" fill="white" stroke={PEOPLE_COLOR} strokeWidth="1.5" /></svg>
            <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>avg main people (manual)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke={YOLO_COLOR} strokeWidth="2" strokeDasharray="4 2" /><circle cx="11" cy="5" r="2.5" fill="white" stroke={YOLO_COLOR} strokeWidth="1.5" /></svg>
            <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>avg people (YOLO)</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHov(null)}>
        <defs>
          <linearGradient id="ppl-ppl-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PEOPLE_COLOR} stopOpacity="0.16" />
            <stop offset="100%" stopColor={PEOPLE_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Y_TICKS_PEOPLE.map(tick => {
          const y = yOfPpl(tick)
          return (
            <g key={`ppl-${tick}`}>
              <line x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y} stroke="rgba(29,35,41,0.07)" strokeWidth="1" />
              <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
                style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(194,141,91,0.7)' }}>
                {tick}
              </text>
            </g>
          )
        })}

        <XAxis />
        <AxisLines />

        <path d={peopleAreaPath} fill="url(#ppl-ppl-fill)" />
        <path d={peoplePtsLine} fill="none" stroke={PEOPLE_COLOR} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={yoloLinePath}  fill="none" stroke={YOLO_COLOR}   strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" />

        {d && <line x1={xOf(d.year)} y1={PAD.top} x2={xOf(d.year)} y2={baseY}
          stroke="rgba(29,35,41,0.22)" strokeWidth="1" strokeDasharray="4 3" />}

        {annotationTimelineData.map((pt, i) => {
          const isHov = hov === i
          return (
            <g key={pt.year} onMouseEnter={() => setHov(i)} style={{ cursor: 'default' }}>
              <rect x={xOf(pt.year) - slotW / 2} y={PAD.top} width={slotW} height={IH} fill="transparent" />
              <circle cx={xOf(pt.year)} cy={yOfPpl(pt.avgMainPeople)}
                r={isHov ? 4.5 : 2.8} fill="white" stroke={PEOPLE_COLOR} strokeWidth={isHov ? 2 : 1.5}
                style={{ transition: 'r 0.12s' }} />
              <circle cx={xOf(pt.year)} cy={yOfPpl(yoloYearlyData[i])}
                r={isHov ? 4.5 : 2.8} fill="white" stroke={YOLO_COLOR} strokeWidth={isHov ? 2 : 1.5}
                style={{ transition: 'r 0.12s' }} />
            </g>
          )
        })}

        {d && (
          <g pointerEvents="none">
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7"
              fill="rgba(255,252,246,0.97)" stroke="rgba(29,35,41,0.11)" strokeWidth="1" />
            <text x={tipX + 10} y={tipY + 17}
              style={{ font: '600 10.5px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.72)' }}>
              {d.year} · {d.total.toLocaleString()} photos
            </text>
            <circle cx={tipX + 13} cy={tipY + 34} r="3.5" fill={YOLO_COLOR} />
            <text x={tipX + 22} y={tipY + 37.5} dominantBaseline="middle"
              style={{ font: '10px var(--archive-font-ui)', fill: YOLO_COLOR }}>
              avg {yoloYearlyData[hov].toFixed(1)} people (YOLO)
            </text>
            <circle cx={tipX + 13} cy={tipY + 54} r="3.5" fill={PEOPLE_COLOR} />
            <text x={tipX + 22} y={tipY + 57.5} dominantBaseline="middle"
              style={{ font: '10px var(--archive-font-ui)', fill: PEOPLE_COLOR }}>
              avg {d.avgMainPeople} main people (manual)
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
