import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { assignment2Data } from '../data/assignment2Data'
import AssignmentTwoGraph from './AssignmentTwoGraph'
import AssignmentTwoSonification from './AssignmentTwoSonification'
import ChromaticSwarm, { STEPS as SWARM_STEPS } from './ChromaticSwarm'
import PeoplePanel from './PeoplePanel'
import SemanticTimeline from './SemanticTimeline'
import PlaceSubjectAtlas from './PlaceSubjectAtlas'
import TemporalRibbon from './TemporalRibbon'
import GlobeView from './GlobeView'
import PhotoMap from './PhotoMap'
import StagedVisual from './StagedVisual'
import JsonScrollExplainer from './JsonScrollExplainer'
import YoloObjectTimeline from './YoloObjectTimeline'
import CentralityNetwork from './CentralityNetwork'
import GemmaSearch from './GemmaSearch'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import { photographUrl } from '../lib/photographs'

gsap.registerPlugin(useGSAP)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CLUSTER_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

const imageUrl = photographUrl

const HERO_PREVIEW_IMAGES = [
  '2019-01-08_Hanoi_00006.JPG',
  '2013-08-09_Lausanne_035.JPG',
  '2021-03-27_Linxia_001.jpg',
  '2010-06-25_Shanghai_021.JPG',
  '2024-02-14_Qinan_002.JPG',
  '2019-12-22_Hongkong_029.jpg',
  '2004-08-19_Suzhou_008.JPG',
  '2013-08-05_Italy_250.jpg',
  '2004-08-18_Suzhou_015.JPG',
  '2004-08-21_Shanghai_012.JPG',
  '2007-07-18_Tibet_093.JPG',
  '2024-01-23_Hangzhou_006.JPG',
  '2006-04-16_Lanzhou_009.JPG',
  '2013-08-06_Venice_070.JPG',
  '2006-07-10_Guizhou_034.JPG',
  '2013-07-03_Xinjiang_040.JPG',
  '2007-07-18_Tibet_081.JPG',
  '2007-07-20_Tibet_049.JPG',
  '2006-07-10_Guizhou_028.JPG',
  '2013-08-05_Italy_052.JPG',
  '2004-08-18_Suzhou_003.JPG',
  '2006-07-10_Guizhou_016.JPG',
  '2012-08-20_Xian_019.JPG',
  '2010-06-30_Kaifeng_007.JPG',
  '2006-04-16_Lanzhou_035.JPG',
  '2013-08-05_Italy_222.jpg',
  '2004-08-18_Suzhou_014.JPG',
  '2004-08-18_Suzhou_005.JPG',
  '2013-08-06_Venice_170.JPG',
  '2013-08-08_Lausanne_195.jpg',
  '2016-11-11_Shenzhen_001.jpg',
  '2013-08-06_Venice_189.JPG',
  '2013-08-08_Lausanne_046.JPG',
  '2013-08-04_Italy_019.JPG',
  '2007-07-23_Tibet_003.JPG',
  '2021-03-27_Linxia_005.jpg',
]

const HERO_RAIL_COUNT = 6
const HERO_RAILS = Array.from({ length: HERO_RAIL_COUNT }, (_, railIndex) =>
  HERO_PREVIEW_IMAGES.filter((_, imageIndex) => imageIndex % HERO_RAIL_COUNT === railIndex)
)

// ── Shared prose styles ───────────────────────────────────────────────────────

const S = {
  kicker: {
    margin: '0 0 0.6rem',
    font: '600 0.72rem/1.2 var(--archive-font-ui)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--archive-color-muted)',
  },
  h1: {
    margin: '0 0 0.55rem',
    font: '500 clamp(2.8rem,3.5vw + 1rem,5rem)/0.96 var(--archive-font-display)',
    letterSpacing: '-0.03em',
    color: 'var(--archive-color-ink)',
  },
  h2: {
    margin: '0 0 1.1rem',
    font: '500 clamp(1.6rem,2.1vw + 0.8rem,2.55rem)/1.12 var(--archive-font-display)',
    color: 'var(--archive-color-ink)',
  },
  subtitle: {
    margin: '0 0 1.4rem',
    font: '400 1rem/1.5 var(--archive-font-ui)',
    color: 'var(--archive-color-muted)',
    letterSpacing: '0.01em',
  },
  dek: {
    maxWidth: '31rem',
    margin: '0 0 1.2rem',
    font: '500 clamp(1.15rem,0.6vw + 1rem,1.45rem)/1.55 var(--archive-font-body)',
    color: 'var(--archive-color-ink)',
  },
  body: {
    margin: '0 0 1.15rem',
    font: '1rem/1.8 var(--archive-font-ui)',
    color: 'var(--archive-color-copy)',
    maxWidth: 'none',
  },
}

function ScrollSection({ id, kicker, title, children, style }) {
  return (
    <section id={id} style={{ width: 'min(100%, 88ch)', margin: '0 auto', padding: '4.5rem 0 2rem', ...style }}>
      {kicker && <p style={S.kicker}>{kicker}</p>}
      {title && <h2 style={S.h2}>{title}</h2>}
      {children}
    </section>
  )
}

function VisBlock({ children }) {
  return (
    <div style={{ margin: '2rem 0 3.5rem' }}>
      {children}
    </div>
  )
}

// ── Panel components ──────────────────────────────────────────────────────────

function BrightnessAreaChart() {
  const dist = assignment2Data.brightnessDistribution
  const avg  = assignment2Data.totals.avgBrightness
  if (!dist?.length) return null

  const W = 700, H = 180
  const PAD = { top: 18, right: 18, bottom: 34, left: 44 }
  const IW = W - PAD.left - PAD.right
  const IH = H - PAD.top - PAD.bottom
  const maxCount = Math.max(...dist.map(b => b.count), 1)

  const xOf = (brightness) => PAD.left + (brightness / 255) * IW
  const yOf = (count)      => PAD.top  + IH - (count / maxCount) * IH

  // Catmull-Rom → cubic Bézier smooth path through all bin midpoints
  const pts = dist.map(b => ({ x: xOf(b.mid), y: yOf(b.count) }))
  function crPath(points) {
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(1)
      const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(1)
      const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(1)
      const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(1)
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    }
    return d
  }
  const linePath = crPath(pts)
  const areaPath = `${linePath} L${pts.at(-1).x.toFixed(1)},${(PAD.top + IH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + IH).toFixed(1)} Z`

  const meanX   = xOf(avg)
  const xTicks  = [0, 64, 128, 192, 255]
  const yTicks  = [0, 0.5, 1].map(t => ({ y: yOf(maxCount * t), label: Math.round(maxCount * t).toLocaleString() }))

  return (
    <div style={{ borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)', padding: '1.4rem 1.6rem', boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)' }}>
      <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        Brightness Distribution
      </p>
      <h3 style={{ margin: '0 0 1rem', font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
        Most images sit in a restrained middle register
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          {/* Horizontal gradient dark → bright mirrors the brightness axis */}
          <linearGradient id="brt-area" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1a1a1a" stopOpacity="0.55" />
            <stop offset="45%"  stopColor="#6b7a8d" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e8e2d5" stopOpacity="0.30" />
          </linearGradient>
          <linearGradient id="brt-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#2c3e50" />
            <stop offset="100%" stopColor="#8a9aaa" />
          </linearGradient>
        </defs>

        {/* Y grid lines */}
        {yTicks.map(({ y, label }) => (
          <g key={label}>
            <line x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y}
              stroke="rgba(29,35,41,0.07)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
              style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.38)' }}>
              {label}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.12)" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.12)" strokeWidth="1" />

        {/* X axis ticks + labels */}
        {xTicks.map(v => (
          <g key={v}>
            <line x1={xOf(v)} y1={PAD.top + IH} x2={xOf(v)} y2={PAD.top + IH + 4}
              stroke="rgba(29,35,41,0.2)" strokeWidth="1" />
            <text x={xOf(v)} y={PAD.top + IH + 14} textAnchor="middle"
              style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.45)' }}>
              {v}
            </text>
          </g>
        ))}

        {/* Filled area */}
        <path d={areaPath} fill="url(#brt-area)" />

        {/* Outline */}
        <path d={linePath} fill="none" stroke="url(#brt-stroke)" strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Mean line */}
        <line x1={meanX} y1={PAD.top - 2} x2={meanX} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.45)" strokeWidth="1.2" strokeDasharray="4 3" />
        <text x={meanX} y={PAD.top - 6} textAnchor="middle"
          style={{ font: '600 9.5px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.55)' }}>
          μ = {avg}
        </text>
      </svg>
    </div>
  )
}

function SocialPresenceChart() {
  const bins        = assignment2Data.personCountHistogram
  const { withPeople, images: totalImages } = assignment2Data.totals
  const [hovered, setHovered] = useState(null)

  const W = 560, H = 210
  const PAD = { top: 38, right: 16, bottom: 42, left: 16 }
  const IW  = W - PAD.left - PAD.right
  const IH  = H - PAD.top  - PAD.bottom

  const maxCount = Math.max(...bins.map(b => b.count), 1)
  const slotW    = IW / bins.length
  const barW     = slotW * 0.58
  const barOff   = (slotW - barW) / 2

  // Grey → warm amber — encodes "no people" → "crowd"
  const COLORS = ['#8a9aaa', '#7d8f7e', '#b09070', '#c28d5b', '#7f5539']

  const withPeoplePct = totalImages > 0 ? ((withPeople / totalImages) * 100).toFixed(1) : '0'

  return (
    <div style={{ borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)', padding: '1.4rem 1.6rem', boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.8rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Social Presence
          </p>
          <h3 style={{ margin: 0, font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            How many people appear in each photograph.
          </h3>
        </div>
        {/* Stat badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '999px', background: 'rgba(159,111,69,0.1)', border: '1px solid rgba(159,111,69,0.25)', flexShrink: 0 }}>
          <span style={{ font: '700 1.1rem/1 var(--archive-font-ui)', color: '#9f6f45' }}>{withPeoplePct}%</span>
          <span style={{ font: '0.75rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>of photos<br/>feature people</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Subtle horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.top + IH - t * IH
          return (
            <line key={t} x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y}
              stroke="rgba(29,35,41,0.06)" strokeWidth="1" />
          )
        })}

        {/* Bars */}
        {bins.map((bin, i) => {
          const bh   = (bin.count / maxCount) * IH
          const x    = PAD.left + i * slotW + barOff
          const y    = PAD.top + IH - bh
          const pct  = ((bin.count / totalImages) * 100).toFixed(1)
          const isHov = hovered === i
          const color = COLORS[i]

          return (
            <g key={bin.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={bh}
                fill={color} rx="5" ry="5"
                opacity={hovered !== null && !isHov ? 0.3 : 1}
                style={{ transition: 'opacity 0.18s' }}
              />
              {/* Label above bar: % normally, count on hover */}
              <text x={x + barW / 2} y={y - 7} textAnchor="middle"
                style={{ font: `${isHov ? '600' : '500'} 11px var(--archive-font-ui)`, fill: isHov ? color : 'rgba(29,35,41,0.7)', transition: 'fill 0.18s' }}>
                {isHov ? bin.count.toLocaleString() : `${pct}%`}
              </text>
              {/* Category label below axis */}
              <text x={x + barW / 2} y={PAD.top + IH + 16} textAnchor="middle"
                style={{ font: '10.5px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.5)' }}>
                {bin.label}
              </text>
            </g>
          )
        })}

        {/* Baseline */}
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.12)" strokeWidth="1" />
      </svg>
    </div>
  )
}

function TagPanelInline() {
  const maxCount = assignment2Data.topTags[0]?.count ?? 1
  return (
    <div style={{ borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)', padding: '1.4rem 1.6rem', boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)' }}>
      <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Recurring CLIP Descriptors</p>
      <h3 style={{ margin: '0 0 1.1rem', font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>The tags lean toward daylight, outdoor scenes, and low-contrast atmospheres</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
        {assignment2Data.topTags.map((tag) => (
          <div key={tag.tag} style={{ borderRadius: '999px', border: '1px solid rgba(29,35,41,0.12)', background: 'rgba(255,255,255,0.82)', padding: '0.4rem 0.9rem', font: '0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-copy)', transform: `scale(${0.88 + (tag.count / maxCount) * 0.22})` }}>
            <span style={{ fontWeight: 500 }}>{tag.tag}</span>
            <span style={{ marginLeft: '0.5rem', font: '0.7rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{tag.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Which months belong to each story step (0-based month index Jan=0…Dec=11)
const SEASONAL_STEPS = [
  {
    key:   'overview',
    title: 'The full year at a glance',
    desc:  'Twelve months, merged across every year in the archive. The variation is striking — some months are packed while others are near-empty. Scroll to unpack the pattern.',
    highlight: null,          // all bars equal
  },
  {
    key:   'summer',
    title: 'Summer dominates',
    desc:  'July and August together hold more than a third of the entire archive. These are the months of extended travel, family reunions, and outdoor exploration — the conditions most likely to prompt a camera.',
    highlight: [6, 7],        // Jul, Aug
    color:     '#c28d5b',
  },
  {
    key:   'secondary',
    title: 'February and October also stand out',
    desc:  'Two shorter peaks break the quiet of the rest. February aligns with Chinese New Year — a season of family gatherings and celebrations. October corresponds to Golden Week, China\'s national holiday, which reliably produces travel photographs.',
    highlight: [1, 9],        // Feb, Oct
    color:     '#7b6f9c',
  },
  {
    key:   'quiet',
    title: 'The quiet months',
    desc:  'Spring and late autumn are sparse. March, April, May, September, November, and December together hold fewer photos than August alone. These months represent routine rather than occasion — commutes, deadlines, and the undocumented pace of ordinary weeks.',
    highlight: [0, 2, 3, 4, 8, 10, 11],   // Jan, Mar–May, Sep, Nov, Dec
    color:     '#8a9aaa',
  },
]

function SeasonalHistogramPanel({ activeStep = 0 }) {
  const monthTotals = MONTH_LABELS.map((label, monthIndex) => {
    const matchingBins = assignment2Data.temporalBins.filter(
      (bin) => Number(bin.month.slice(5, 7)) === monthIndex + 1
    )
    const count = matchingBins.reduce((sum, bin) => sum + bin.count, 0)
    return { label, count, monthIndex }
  })

  const maxCount  = Math.max(...monthTotals.map((b) => b.count), 1)
  const W = 440, H = 280
  const PAD = { top: 16, right: 16, bottom: 48, left: 48 }
  const IW  = W - PAD.left - PAD.right
  const IH  = H - PAD.top  - PAD.bottom
  const slotW = IW / monthTotals.length
  const bw    = slotW * 0.72
  const bOff  = (slotW - bw) / 2
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxCount * t))

  const step = SEASONAL_STEPS[activeStep] ?? SEASONAL_STEPS[0]

  function barStyle(monthIndex) {
    if (!step.highlight) return { fill: '#5c7c92', opacity: 0.82 }
    const isHighlighted = step.highlight.includes(monthIndex)
    return isHighlighted
      ? { fill: step.color, opacity: 1 }
      : { fill: '#5c7c92', opacity: 0.15 }
  }

  return (
    <div style={{
      padding: '1.2rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: '1.75rem',
      background: 'linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,244,237,0.9))',
    }}>
      <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        Seasonal Distribution
      </p>
      <h3 style={{ margin: '0 0 0.9rem', font: '500 1.25rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
        How the archive clusters by month.
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Y grid + labels */}
        {yTicks.map((tick) => {
          const y = PAD.top + IH - (tick / maxCount) * IH
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={PAD.left + IW} y1={y} y2={y}
                stroke="rgba(29,35,41,0.08)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.38)' }}>
                {tick}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {monthTotals.map(({ label, count, monthIndex }) => {
          const bh = (count / maxCount) * IH
          const x  = PAD.left + monthIndex * slotW + bOff
          const y  = PAD.top + IH - bh
          const { fill, opacity } = barStyle(monthIndex)
          return (
            <g key={label} style={{ transition: 'opacity 0.4s ease' }}>
              <rect x={x} y={y} width={bw} height={bh} rx="5" fill={fill} opacity={opacity}
                style={{ transition: 'fill 0.4s ease, opacity 0.4s ease' }}>
                <title>{`${label}: ${count}`}</title>
              </rect>
              <text x={x + bw / 2} y={PAD.top + IH + 16} textAnchor="middle"
                style={{ font: '600 10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.5)' }}>
                {label}
              </text>
            </g>
          )
        })}

        {/* Baseline */}
        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.12)" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ── Main narrative ────────────────────────────────────────────────────────────

export default function AssignmentTwoNarrative() {
  const { totals } = assignment2Data
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const overlayRef = useRef(null)
  const railTracksRef = useRef([])
  const tilesRef = useRef([])
  const tileFramesRef = useRef([])

  // Beeswarm scroll-driven step
  const [swarmStep, setSwarmStep] = useState(0)
  const swarmStepRefs = useRef([])

  // Seasonal histogram scroll-driven step
  const [seasonalStep, setSeasonalStep] = useState(0)
  const seasonalStepRefs = useRef([])
  const heroStats = [
    { label: 'Corpus', value: `${totals.images.toLocaleString()} images`, note: 'Photographs drawn from the personal image archive.' },
    { label: 'Clusters', value: `${totals.clusters} groups`, note: 'Visual families inferred from CLIP and DINO embeddings.' },
    { label: 'Aspect', value: `${totals.landscape} landscape`, note: `${totals.portrait} portrait · ${totals.squareish} near-square` },
    { label: 'Average', value: `${totals.avgBrightness}`, note: `Mean brightness · style energy avg ${totals.avgStyleEnergy}` },
  ]

  useGSAP(() => {
    const railTracks = railTracksRef.current.filter(Boolean)
    const tiles = tilesRef.current.filter(Boolean)
    const frames = tileFramesRef.current.filter(Boolean)

    if (!tiles.length) return

    gsap.set(railTracks, { yPercent: 0 })
    gsap.set(tiles, {
      transformOrigin: '50% 50%',
      transformPerspective: 1200,
    })
    gsap.set(frames, {
      transformOrigin: '50% 50%',
      transformPerspective: 1200,
      rotationX: 0,
      rotationY: 0,
      rotateZ: 0,
      z: 0,
    })

    const entranceTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    entranceTimeline.fromTo(
      tiles,
      { opacity: 0, y: 36, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion ? 0.01 : 1.45,
        stagger: prefersReducedMotion ? 0 : 0.025,
      }
    )

    if (overlayRef.current) {
      entranceTimeline.fromTo(
        overlayRef.current,
        { opacity: 0, y: 28, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: prefersReducedMotion ? 0.01 : 1.05 },
        prefersReducedMotion ? 0 : 0.18
      )
    }

    if (!prefersReducedMotion) {
      railTracks.forEach((track, rail) => {
        const direction = rail % 2 === 0 ? 1 : -1
        gsap.fromTo(track,
          { yPercent: direction > 0 ? -50 : 0 },
          {
            yPercent: direction > 0 ? 0 : -50,
            duration: 24 + rail * 1.4,
            repeat: -1,
            ease: 'none',
          }
        )
      })
    }

  }, { scope: heroRef, dependencies: [prefersReducedMotion] })

  // IntersectionObserver: advance beeswarm step when sentinel (mid-card) crosses screen centre
  useEffect(() => {
    const observers = swarmStepRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSwarmStep(i) },
        { rootMargin: '-49% 0px -49% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  // IntersectionObserver: advance seasonal step when sentinel (mid-card) crosses screen centre
  useEffect(() => {
    const observers = seasonalStepRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSeasonalStep(i) },
        { rootMargin: '-49% 0px -49% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  let tileIndex = 0

  function nextTileIndex() {
    const current = tileIndex
    tileIndex += 1
    return current
  }

  function handleMouseMove(event) {
    if (prefersReducedMotion || !heroRef.current) return

    const { left, top, width, height } = heroRef.current.getBoundingClientRect()
    const x = ((event.clientX - left) / width - 0.5) * 2
    const y = ((event.clientY - top) / height - 0.5) * 2

    tileFramesRef.current.forEach((frame, index) => {
      if (!frame) return

      const depth = (index % 5) + 1
      gsap.to(frame, {
        rotationY: x * (9.2 + depth * 0.95),
        rotationX: -y * (8.6 + depth * 0.82),
        rotateZ: x * 1.05,
        z: 40 + depth * 11,
        duration: 0.38,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    })
  }

  function handleMouseLeave() {
    if (prefersReducedMotion) return

    tileFramesRef.current.forEach((frame) => {
      if (!frame) return

      gsap.to(frame, {
        rotationX: 0,
        rotationY: 0,
        rotateZ: 0,
        z: 0,
        duration: 0.95,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    })
  }

  return (
    <div style={{ background: 'var(--archive-color-bg)', minHeight: '100vh', color: 'var(--archive-color-ink)' }}>

      {/* ── Hero ── */}
      <header
        ref={heroRef}
        className="assignment2-hero-shell hero-shell"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="assignment2-hero-bg" aria-hidden="true">
          <div className="assignment2-hero-aurora" />
          <div className="assignment2-hero-grid" />
          <div className="assignment2-hero-orb assignment2-hero-orb-a" />
          <div className="assignment2-hero-orb assignment2-hero-orb-b" />
          <div className="assignment2-hero-mosaic">
            {HERO_RAILS.map((railImages, railIndex) => (
              <div key={`rail-${railIndex}`} className="assignment2-hero-rail">
                <div
                  ref={(element) => {
                    railTracksRef.current[railIndex] = element
                  }}
                  className="assignment2-hero-rail-track"
                >
                  {[0, 1].map((copyIndex) => (
                    <div key={`rail-set-${railIndex}-${copyIndex}`} className="assignment2-hero-rail-set">
                      {railImages.map((filename) => {
                        const currentTileIndex = nextTileIndex()
                        return (
                          <figure
                            key={`${filename}-${copyIndex}`}
                            ref={(element) => {
                              tilesRef.current[currentTileIndex] = element
                            }}
                            className={`assignment2-hero-tile assignment2-hero-tile-${(currentTileIndex % 5) + 1}`}
                          >
                            <div
                              ref={(element) => {
                                tileFramesRef.current[currentTileIndex] = element
                              }}
                              className="assignment2-hero-tile-frame"
                            >
                              <img
                                src={imageUrl(filename)}
                                alt=""
                                loading={currentTileIndex < 12 ? 'eager' : 'lazy'}
                                decoding="async"
                              />
                            </div>
                          </figure>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="assignment2-hero-wash" />
        </div>

        <div ref={overlayRef} className="hero-overlay glass-card assignment2-hero-overlay">
          <div className="assignment2-hero-signal">
            <span className="assignment2-hero-signal-pill">Computational Photo Essay</span>
            <span className="assignment2-hero-signal-meta">Embeddings · Time · Place</span>
          </div>
          <p style={S.kicker}>DH6034 Assignment 2</p>
          <h1 style={{ ...S.h1, marginBottom: '0.8rem', color: '#f8fafc' }}>Excavating My<br />Image Archive</h1>
          <p style={{ ...S.subtitle, marginBottom: '1.05rem', color: 'rgba(226,232,240,0.88)' }}>
            A Data-Driven Analysis of Personal Life Through Photographs
          </p>
          <p style={{ ...S.dek, maxWidth: '36rem', marginBottom: '2rem', color: 'rgba(241,245,249,0.94)' }}>
            A scroll-driven exhibition translating a personal photo archive into an editorial sequence
            of embeddings, clusters, temporal rhythms, and geographic traces.
          </p>
          <div className="assignment2-hero-stats">
            {heroStats.map(({ label, value, note }) => (
              <div key={label} className="assignment2-hero-stat">
                <p className="assignment2-hero-stat-label">{label}</p>
                <p className="assignment2-hero-stat-value">{value}</p>
                <p className="assignment2-hero-stat-note">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Essay body ── */}
      <div style={{ margin: '0 auto', width: 'min(112rem,calc(100vw - 2rem))', padding: '0 1.5rem 6rem' }}>

        {/* 1 – Introduction */}
        <ScrollSection id="entry" kicker="Introduction">
          <p style={S.body}>
            To investigate patterns in my life and behaviour, I used my personal photographic archive as
            a dataset, analysing a collection of over 7,000 photographs accumulated over many years.
            Through computational pre-processing and visualisation, I examined how my photographic
            habits reflect changes in social relationships, daily activities, and personal interests
            across time.
          </p>
          <p style={S.body}>
            Although photographs are not traditionally considered quantified-self data in the same way
            as biometric or sensor logs, they constitute a form of self-documentation that records what
            an individual chooses to preserve, remember, and represent. As such, photographic archives
            can function as an indirect but meaningful quantification of lived experience.
          </p>
        </ScrollSection>

        {/* 2 – Methodology */}
        <ScrollSection id="registers" kicker="Methodology" title="Building the dataset and computing embeddings.">
          <p style={S.body}>
            I collected and curated photographs from my phone, MacBook, and cloud storage, resulting in
            a dataset of over 7,000 images. While some photographs contained embedded EXIF metadata such
            as date and location, many lacked complete metadata. To address this, I manually annotated
            missing temporal and geographical information and stored the resulting metadata in a
            structured JSON file.
          </p>
          <p style={S.body}>
            To enable computational analysis beyond basic metadata, I generated image embeddings for all
            photographs using OpenCLIP and DINOv2. These embeddings provide high-dimensional
            representations of visual content, allowing for similarity comparison, clustering, and
            thematic grouping across the dataset. In addition, I computed the dominant colour of each
            photograph to support chromatic visualisations. I also manually labelled the number of
            people in each photo, where YOLO was used for assistance.
          </p>
          <p style={S.body}>
            I stored all the metadata in a structured JSON file, as shown below.
          </p>
          <JsonScrollExplainer />
        </ScrollSection>

        <VisBlock>
          <TagPanelInline />
        </VisBlock>

        <VisBlock>
          <BrightnessAreaChart />
        </VisBlock>

        <VisBlock>
          <SocialPresenceChart />
        </VisBlock>

        {/* 3 – Constellation */}
        <ScrollSection id="constellation-room" kicker="Overview of Findings" title="A shift from family archives to individual practice.">
          <p style={S.body}>
            Several clear patterns emerged from the analysis. Photographs from my early years consist
            predominantly of family group portraits, reflecting the centrality of family life during
            childhood. This pattern declines noticeably after my move to university, when geographical
            distance reduced opportunities for family gatherings.
          </p>
          <p style={S.body}>
            The constellation maps eight visual clusters derived from OpenCLIP embeddings. Each node is
            a photograph; colour marks its cluster. Lines connect nearest neighbours in the feature
            space — dense webs indicate strong local coherence. Hover or click any node to inspect the
            image and its neighbours.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing visual constellation" minHeight="min(75vh,44rem)">
            <AssignmentTwoGraph />
          </StagedVisual>
        </VisBlock>

        <ScrollSection id="centrality-network" kicker="Centrality Network" title="Which photographs act as visual archetypes?">
          <p style={S.body}>
            The sampled constellation above shows cluster structure for a subset of images. This
            second network goes further: it includes <strong>all {'{'}7{','}244{'}'} photographs</strong> and draws a{' '}
            <em>directed</em> edge from every photo to each of its five most visually similar
            neighbours. Because similarity is asymmetric — A can be among B&apos;s closest matches
            without B appearing in A&apos;s top five — the resulting graph is directed.
          </p>
          <p style={S.body}>
            A node&apos;s <em>in-degree</em> counts how many other photographs list it as a top-5
            neighbour. High in-degree photographs are visual archetypes: scenes so compositionally or
            chromatically representative that many unrelated images converge on them. The colour
            gradient runs from slate (in-degree&nbsp;0) through blue to red (maximum in-degree).
            Layout is computed by UMAP run directly on the precomputed k-NN graph, so it
            optimises for short edges — similar photographs land close together, and k-NN arrows
            stay local. All nodes are the same size; only colour encodes centrality.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing centrality network" minHeight="min(80vh,50rem)">
            <CentralityNetwork />
          </StagedVisual>
        </VisBlock>

        {/* 4 – Temporal ribbon */}
        <ScrollSection id="time" kicker="Temporal Register" title="New categories emerge in recent years.">
          <p style={S.body}>
            At the same time, new thematic categories begin to appear more frequently in recent years.
            These include photographs of classroom environments, museum visits, and Chinese calligraphy
            practice. The emergence of these subjects reflects the increasing influence of academic
            life, cultural engagement, and specialised personal interests on my daily routine.
          </p>
          <p style={S.body}>
            Taken together, the archive reveals a gradual shift in the structure of my lived experience:
            from family-oriented documentation in childhood toward a more individualised and
            academically shaped visual record in adulthood. Drag the range selector beneath the bars to
            isolate any period; hover any bar for a month detail card.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing temporal ribbon" minHeight="min(60vh,28rem)">
            <TemporalRibbon bins={assignment2Data.temporalBins} />
          </StagedVisual>
        </VisBlock>

        {/* Seasonal distribution — sticky chart left, scrollable story cards right */}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', padding: '2rem 0' }}>

          {/* Left: sticky chart — full viewport height so the chart centres vertically */}
          <div style={{ flex: '0 0 64%', position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <SeasonalHistogramPanel activeStep={seasonalStep} />
            </div>
          </div>

          {/* Right: scrollable story cards */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 37.5vh - 1rem)' }}>
            {SEASONAL_STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{ minHeight: '75vh', position: 'relative', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                {/* Sentinel at vertical centre of this card — observed to fire at screen centre */}
                <div ref={el => { seasonalStepRefs.current[i] = el }}
                  style={{ position: 'absolute', top: '50%', left: 0, width: '1px', height: '1px',
                           transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <div style={{
                  width: '100%',
                  borderRadius: '1rem',
                  padding: '1.5rem 1.6rem',
                  border: `1px solid ${seasonalStep === i ? 'rgba(29,35,41,0.25)' : 'var(--archive-color-rule)'}`,
                  background: seasonalStep === i ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.42)',
                  boxShadow: seasonalStep === i ? '0 8px 32px -8px rgba(15,23,42,0.14)' : 'none',
                  opacity: seasonalStep === i ? 1 : 0.4,
                  transform: seasonalStep === i ? 'translateX(0)' : 'translateX(6px)',
                  transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
                }}>
                  <p style={{ margin: '0 0 0.4rem', font: '600 0.68rem/1 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                    {i + 1} of {SEASONAL_STEPS.length}
                  </p>
                  <h3 style={{ margin: '0 0 0.75rem', font: '500 1.2rem/1.25 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, font: '0.9rem/1.75 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <VisBlock>
          <StagedVisual label="Preparing object timeline" minHeight="28rem">
            <YoloObjectTimeline />
          </StagedVisual>
        </VisBlock>

        {/* 4b – Semantic timeline */}
        <ScrollSection id="semantic-timeline" kicker="Semantic Register" title="The machine's subject language shifts with the life being documented.">
          <p style={S.body}>
            Once BLIP captions, keywords, and VQA subject labels are folded together, a second timeline
            appears. Early years remain anchored in people and family presence; later years accumulate
            more architectural, artistic, and study-oriented traces.
          </p>
          <p style={S.body}>
            Hover any year column to inspect which semantic families dominate that slice of the archive,
            alongside the most common subjects and cleaned keywords attached to those images.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing semantic timeline" minHeight="min(66vh,36rem)">
            <SemanticTimeline years={assignment2Data.semanticTimeline} />
          </StagedVisual>
        </VisBlock>

        {/* 5 – Place × Subject Atlas */}
        <ScrollSection id="subject-atlas" kicker="Place × Subject Atlas" title="Each place is remembered through a different subject vocabulary.">
          <p style={S.body}>
            This heatmap crosses the archive's largest places with the most distinctive VQA subjects
            they contain. Rather than raw photo totals, it reveals what each location tends to be about:
            water-play in Beidaihe, paintings in Paris, boats in Venice, statues in Lisbon.
          </p>
          <p style={S.body}>
            Hover any cell to read the count and inspect a representative image from that place-subject
            intersection.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing place subject atlas" minHeight="min(72vh,42rem)">
            <PlaceSubjectAtlas atlas={assignment2Data.placeSubjectAtlas} />
          </StagedVisual>
        </VisBlock>

        {/* 5b – 2D Map */}
        <ScrollSection id="map-room" kicker="Geographic Distribution" title="Where the photographs were taken, and what each place tends to hold.">
          <p style={S.body}>
            All {assignment2Data.totals.images.toLocaleString()} images mapped to their place of origin. The corpus has a dense centre of gravity
            in mainland China, particularly in major cities and along travel routes. Scattered clusters mark
            travels to Southeast Asia — Hanoi, Da Nang, Bangkok — as well as European cities including London,
            Paris, Brussels, Venice, and Lausanne.
          </p>
          <p style={S.body}>
            Use the mode toggle to switch the field from pure quantity to subject-family or indoors/outdoors
            balance. Click any cluster to zoom in; click an individual point to pin its detail card.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing geographic field" minHeight="34rem">
            <PhotoMap semanticMap={assignment2Data.semanticMap} />
          </StagedVisual>
        </VisBlock>

        {/* 6 – Globe */}
        <ScrollSection id="globe-room" kicker="Geographic Distribution — 3D" title="The same corpus, rendered on a globe.">
          <p style={S.body}>
            The flat map compresses the world onto a plane; the globe restores the spherical geometry of
            the archive. Each spike rises from its coordinates — taller and thicker where more
            photographs were taken. The dominant mass over central China is immediately apparent, while
            the thinner spikes mark the scattered traces of international travel.
          </p>
          <p style={S.body}>
            Drag to rotate the globe and inspect any region. Hover a spike to read the location name and
            photo count. The auto-rotation can be interrupted by clicking and dragging; it resumes on
            release.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing 3D globe" minHeight="34rem">
            <GlobeView />
          </StagedVisual>
        </VisBlock>

        {/* 7 – Chromatic Fugue */}
        <ScrollSection id="fugue" kicker="Chromatic Fugue" title="Colour as another index of the corpus.">
          <p style={S.body}>
            The dominant colour of each photograph was computed to support chromatic visualisations and
            to explore whether colour distributions might reveal broader aesthetic or contextual
            patterns within the archive. Each stripe represents a photograph — colour comes from the
            dominant palette, height reflects style energy.
          </p>
          <p style={S.body}>
            Hover a stripe to audition its tone. Sort modes let the corpus be reread by cluster, hue,
            brightness, or woven constellation pattern.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing chromatic field" minHeight="min(65vh,36rem)">
            <AssignmentTwoSonification />
          </StagedVisual>
        </VisBlock>

        {/* 8 – Beeswarm: sticky viz left, scrollable text right */}
        <div id="swarm" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', padding: '4.5rem 0 2rem' }}>

          {/* Left: sticky canvas */}
          <div style={{ flex: '0 0 64%', position: 'sticky', top: '1.5rem' }}>
            <StagedVisual label="Preparing beeswarm" minHeight="100vh">
              <ChromaticSwarm step={swarmStep} />
            </StagedVisual>
          </div>

          {/* Right: scrollable step cards */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 40vh - 1rem)' }}>

            {/* Section header */}
            <div style={{ padding: '0 0 1rem' }}>
              <p style={S.kicker}>Scroll-Driven Beeswarm</p>
              <h2 style={S.h2}>The same corpus read as freely moving circles.</h2>
              <p style={S.body}>
                The stripes above collapse each photograph into a one-dimensional mark. Here the same data expands into two dimensions: each circle can drift, cluster, or align along an axis.
              </p>
              <p style={S.body}>
                Hover any circle to inspect the photograph and click to pin a detail strip. Radius encodes style energy; colour is the dominant hue.
              </p>
            </div>

            {/* One card per beeswarm step */}
            {SWARM_STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{ minHeight: '80vh', position: 'relative', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                <div ref={el => { swarmStepRefs.current[i] = el }}
                  style={{ position: 'absolute', top: '50%', left: 0, width: '1px', height: '1px',
                           transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <div style={{
                  width: '100%',
                  borderRadius: '1rem',
                  padding: '1.5rem 1.6rem',
                  border: `1px solid ${swarmStep === i ? 'rgba(29,35,41,0.25)' : 'var(--archive-color-rule)'}`,
                  background: swarmStep === i ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.42)',
                  boxShadow: swarmStep === i ? '0 8px 32px -8px rgba(15,23,42,0.14)' : 'none',
                  opacity: swarmStep === i ? 1 : 0.4,
                  transform: swarmStep === i ? 'translateX(0)' : 'translateX(6px)',
                  transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
                }}>
                  <p style={{
                    margin: '0 0 0.4rem',
                    font: '600 0.68rem/1 var(--archive-font-ui)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--archive-color-muted)',
                  }}>
                    Step {i + 1} of {SWARM_STEPS.length}
                  </p>
                  <h3 style={{
                    margin: '0 0 0.75rem',
                    font: '500 1.2rem/1.25 var(--archive-font-display)',
                    color: 'var(--archive-color-ink)',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    font: '0.9rem/1.75 var(--archive-font-ui)',
                    color: 'var(--archive-color-copy)',
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Notes */}
        {/* Photo search */}
        <ScrollSection id="photo-search" kicker="Caption Search" title="Find photographs by what they contain.">
          <p style={S.body}>
            Every photograph in the archive was described in natural language by Gemma, a vision-language
            model. The search below queries all {(7243).toLocaleString()} captions simultaneously — type
            any word or phrase to retrieve the photographs whose descriptions contain it. Results are
            shown as thumbnails with the matching excerpt highlighted.
          </p>
        </ScrollSection>

        <VisBlock>
          <GemmaSearch />
        </VisBlock>

        <ScrollSection id="endnotes" kicker="Notes" title="Reading the archive as evidence.">
          <p style={S.body}>
            The visualisations do not claim photographic truth. They show what was kept, photographed,
            and later recoverable through metadata and embeddings.
          </p>
          <p style={S.body}>
            Where metadata was incomplete, dates and locations were manually restored. Person counts
            were manually checked after assisted detection to keep the archive legible rather than
            fully automated.
          </p>
          <p style={S.body}>
            All interaction patterns are designed for gradual reading: hover reveals detail, click
            opens deeper inspection, and reduced-motion preferences suppress decorative transitions.
          </p>
        </ScrollSection>

      </div>
    </div>
  )
}
