import { useEffect, useRef, useState } from 'react'
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
import AnnotationTimeline from './AnnotationTimeline'
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
  h3: {
    margin: '2rem 0 0.75rem',
    font: '500 clamp(1.15rem,1.2vw + 0.5rem,1.5rem)/1.2 var(--archive-font-display)',
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

const SEC = { width: 'min(100%, 88ch)', margin: '0 auto', padding: '4.5rem 0 2rem' }
const SEC_CONT = { width: 'min(100%, 88ch)', margin: '0 auto', padding: '1.5rem 0 1rem' }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '999px', background: 'rgba(159,111,69,0.1)', border: '1px solid rgba(159,111,69,0.25)', flexShrink: 0 }}>
          <span style={{ font: '700 1.1rem/1 var(--archive-font-ui)', color: '#9f6f45' }}>{withPeoplePct}%</span>
          <span style={{ font: '0.75rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>of photos<br/>feature people</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.top + IH - t * IH
          return (
            <line key={t} x1={PAD.left} y1={y} x2={PAD.left + IW} y2={y}
              stroke="rgba(29,35,41,0.06)" strokeWidth="1" />
          )
        })}

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
              <rect x={x} y={y} width={barW} height={bh}
                fill={color} rx="5" ry="5"
                opacity={hovered !== null && !isHov ? 0.3 : 1}
                style={{ transition: 'opacity 0.18s' }}
              />
              <text x={x + barW / 2} y={y - 7} textAnchor="middle"
                style={{ font: `${isHov ? '600' : '500'} 11px var(--archive-font-ui)`, fill: isHov ? color : 'rgba(29,35,41,0.7)', transition: 'fill 0.18s' }}>
                {isHov ? bin.count.toLocaleString() : `${pct}%`}
              </text>
              <text x={x + barW / 2} y={PAD.top + IH + 16} textAnchor="middle"
                style={{ font: '10.5px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.5)' }}>
                {bin.label}
              </text>
            </g>
          )
        })}

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
    highlight: null,
  },
  {
    key:   'summer',
    title: 'Summer dominates',
    desc:  'July and August together hold more than a third of the entire archive. These are the months of extended travel, family reunions, and outdoor exploration — the conditions most likely to prompt a camera.',
    highlight: [6, 7],
    color:     '#c28d5b',
  },
  {
    key:   'secondary',
    title: 'February and October also stand out',
    desc:  'Two shorter peaks break the quiet of the rest. February aligns with Chinese New Year — a season of family gatherings and celebrations. October corresponds to Golden Week, China\'s national holiday, which reliably produces travel photographs.',
    highlight: [1, 9],
    color:     '#7b6f9c',
  },
  {
    key:   'quiet',
    title: 'The quiet months',
    desc:  'Spring and late autumn are sparse. March, April, May, September, November, and December together hold fewer photos than August alone. These months represent routine rather than occasion — commutes, deadlines, and the undocumented pace of ordinary weeks.',
    highlight: [0, 2, 3, 4, 8, 10, 11],
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
          <h1 style={{ ...S.h1, marginBottom: '0.8rem', color: '#f8fafc' }}>From Portraits<br />to Patterns</h1>
          <p style={{ ...S.subtitle, marginBottom: '2rem', color: 'rgba(226,232,240,0.88)' }}>
            A Data-Driven Analysis of Personal Life Through Photographs
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
        <section id="intro" style={SEC}>
          <h2 style={S.h2}>1  Introduction</h2>
          <p style={S.body}>
            From the yellow loess of Lanzhou to the vertical neon of Hong Kong, and later to life in Europe, my experience has unfolded across distinct cultural and visual environments. Over the past two decades, I have accumulated a personal archive of more than 7,000 photographs. These images form a longitudinal record of everyday life, documenting shifts in social relationships, environments, and routines. Rather than treating them as isolated memories, this project approaches the collection as a dataset that can be analysed computationally. Through image pre-processing and visualisation, I examine how photographic patterns reflect changes in life stages, social interactions, daily activities, and personal interests over time.
          </p>
          <p style={S.body}>
            This approach reflects a broader shift in cultural analysis, where computational methods and visualisation support the identification of patterns within large-scale image collections that would otherwise remain difficult to discern (Manovich, 2020). Recent research in cultural heritage visualisation further demonstrates how such collections can be explored as complex information spaces through interactive visualisation, opening new possibilities for analysis and interpretation (Windhager et al., 2018).
          </p>
          <p style={S.body}>
            Following Johanna Drucker's critique of information visualisation, these 7,000 images are treated not as objective data (the given), but as capta (the taken). In the humanities, knowledge is always situated and partial; this archive does not present a neutral record of life, but reflects what was photographed, what was ignored, and the situations in which images were taken. By framing the collection as capta, the visualisation is understood as an interpretative practice of self-reflection. This perspective recognises that in digital humanities, where objective ground truths are often unavailable, methodological trustworthiness depends on the explicit articulation of perspective and the construction of appropriate criteria for analysis.
          </p>
          <p style={S.body}>
            Although photographs are not typically treated as data in the same way as biometric or sensor logs, they are composed of pixel-based information and can be analysed computationally. At the same time, they function as a form of self-documentation, offering an indirect yet meaningful representation of lived experience. As such, photographic archives can be approached as complex datasets that encode patterns of behaviour and environment over time.
          </p>
        </section>

        {/* 2 – Methodology */}
        <section id="methodology" style={SEC}>
          <h2 style={S.h2}>2  Methodology</h2>
          <h3 style={S.h3}>2.1  Preparation of data</h3>
          <p style={S.body}>
            I assembled a dataset of over 7,000 photographs collected from personal devices, including a phone, laptop, and cloud storage. While most of the images contained timestamps in the embedded EXIF metadata, all of them lacked location coordinates. To ensure temporal and spatial continuity across the archive, missing metadata was manually supplemented. This process highlights a key principle in Digital Humanities: datasets are not passively "given" but actively constructed through processes of selection, correction, and interpretation. This manual labour constitutes what Wrisley defines as pre-visualisation, defined as interdisciplinary and transmedial critical work that links the raw archive to the final visual system (Wrisley, 2018).
          </p>
          <p style={S.body}>
            In this project, the photographic archive is treated as a form of cultural data that can be rendered computationally analysable through a data science approach to humanities materials. This aligns with cultural analytics, which applies computational and visual methods to explore patterns in large-scale cultural datasets (Manovich, 2020). Following Johanna Drucker's distinction between data and capta, the dataset is understood not as an objective record of lived experience but as a situated and partial collection shaped by subjective acts of capture and preservation. The preparation of the dataset through annotation, categorisation, and feature extraction therefore constitutes an interpretative process that conditions all subsequent analysis.
          </p>
          <p style={S.body}>
            To enable large-scale analysis, I generated high-dimensional image embeddings for each photograph using OpenCLIP and DINOv2. These models encode visual features into vector representations, allowing for similarity comparison, clustering, and the identification of latent thematic structures across the archive. In contrast to earlier approaches in distant viewing that rely on supervised classification models such as ResNet-50 (Arnold & Tilton, 2023), the use of self-supervised and multimodal models allows for a more flexible and semantically rich representation of visual content.
          </p>
          <p style={S.body}>
            In addition to visual embeddings, I extracted dominant colour values from each image to support chromatic analysis. Following Arnold and Tilton's use of colour to relate visual aesthetics to cultural patterns, I extracted the dominant colour of each photograph to support chromatic visualisations and to examine whether colour distributions reveal broader aesthetic or contextual patterns within the archive.
          </p>
          <p style={S.body}>
            To capture semantic and contextual information, I employed a combination of computer vision and vision–language models. Object detection was performed using YOLO to estimate the number of people present in each image. However, while object detection provides a quantitative proxy for social presence, it does not adequately capture socially meaningful relationships. To address this limitation, I manually annotated each photograph to identify the number of primary subjects (excluding incidental figures) and categorised their social context (e.g., family, friends, professional/academic). This step underscores the necessity of combining automated methods with human interpretation in order to produce meaningful humanities analysis. This reflects a broader understanding that computational methods extend, rather than replace, human interpretative capacities when working with complex cultural data (Manovich, 2020).
          </p>
          <p style={S.body}>
            Furthermore, textual descriptions of the images were generated using vision–language models. Initially, I produced captions using BLIP, but they were found to be insufficiently accurate, particularly in capturing nuanced or context-specific content. These were subsequently replaced with captions and keywords generated using the Gemma 4 31B-it model via Together AI, which produced more reliable semantic descriptions. To improve consistency and reduce hallucinated or interpretative outputs, the model was prompted to generate short, literal descriptions restricted to observable visual content, and to return results in a structured JSON format (including a single-sentence caption and a fixed set of keywords). This ensured that the generated text remained comparable across the dataset and suitable for downstream computational analysis. The integration of visual features (embeddings), detected objects, and generated text reflects a "multimodal turn" in Digital Humanities, in which computational analysis operates across multiple representational layers rather than relying on a single data modality.
          </p>
          <p style={S.body}>
            All extracted features and annotations were stored in a structured JSONL format, linking each image to its associated metadata, embeddings, captions, and categorical labels. In this sense, the dataset is not merely a collection of photographs but a layered representation of visual, textual, and interpretative information, enabling both quantitative analysis and qualitative interpretation at scale. This reflects broader observations that cultural collections are characterised by rich and heterogeneous metadata, requiring computational and visual methods to support meaningful exploration (Windhager et al., 2018). The structured metadata results from collaboration between computational tools and humanistic inquiry, embodying the pre-visualisation phase where the archive is prepared to speak as a cohesive model (Wrisley, 2018).
          </p>
          <p style={S.body}>
            I stored all the metadata in a structured JSON file, as shown below.
          </p>
        </section>

        <VisBlock>
          <JsonScrollExplainer />
        </VisBlock>

        {/* 3 – Findings */}
        <section id="findings" style={SEC}>
          <h2 style={S.h2}>3  Findings</h2>
          <h3 style={S.h3}>3.1  Overview</h3>
          <p style={S.body}>
            Several patterns emerged from the analysis. Photographs from my early years consist predominantly of family group portraits, reflecting the centrality of family life during childhood. This pattern declines noticeably after my move to university, when geographical distance reduced opportunities for family gatherings.
          </p>
          <p style={S.body}>
            At the same time, new thematic categories begin to appear more frequently in recent years. These include photographs of classroom environments, museum visits, and Chinese calligraphy practice. The emergence of these subjects reflects the increasing influence of academic life, cultural engagement, and specialised personal interests on my daily routine.
          </p>
          <p style={S.body}>
            The archive reveals a gradual shift in the structure of my lived experience: from family-oriented documentation in childhood toward a more individualised and academically shaped visual record in adulthood.
          </p>
        </section>

        <VisBlock>
          <AnnotationTimeline />
        </VisBlock>

        {/* 3.2 – Temporal Patterns */}
        <section id="temporal" style={SEC_CONT}>
          <h3 style={S.h3}>3.2  Temporal Patterns</h3>
          <p style={S.body}>
            To understand how my photographic practices evolved over time, I analyse both the temporal distribution of images and shifts in their semantic content.
          </p>
          <p style={S.body}>
            The histogram below shows the distribution of photographs across time. A histogram is appropriate here because it highlights variations in photographic activity, making periods of high and low activity easy to identify. The distribution is uneven, with noticeable peaks corresponding to periods of travel. This suggests that mobility plays a significant role in shaping when photographs are taken, as trips tend to generate concentrated bursts of images.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing temporal ribbon" minHeight="min(60vh,28rem)">
            <TemporalRibbon bins={assignment2Data.temporalBins} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            A seasonal pattern can also be observed. When aggregating photographs by month across all years, the summer months contain substantially more images than the rest of the year. October, December, and February also show moderate increases, which likely correspond to recurring events such as the Chinese National Day holiday and the Chinese New Year. These patterns indicate that photographic activity is structured not only by personal circumstances but also by cyclical cultural and social rhythms.
          </p>
        </section>

        {/* Seasonal distribution — sticky chart left, scrollable story cards right */}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', padding: '2rem 0' }}>
          <div style={{ flex: '0 0 64%', position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <SeasonalHistogramPanel activeStep={seasonalStep} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 37.5vh - 1rem)' }}>
            {SEASONAL_STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{ minHeight: '75vh', position: 'relative', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
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

        <section style={SEC_CONT}>
          <p style={S.body}>
            Changes over time can also be examined through semantic features derived from Gemma-generated keywords. The line graph below visualises the frequency of selected terms across different periods. Visualisation provides a way to represent gradual temporal shifts across a large image collection, offering a descriptive perspective that is difficult to achieve through textual inspection alone (Manovich, 2020). The terms "boy" and "child" appear frequently in earlier years but decline sharply in later periods, reflecting a transition in how subjects are represented within the archive. This shift corresponds to my own ageing, as the collection moves from documenting childhood to adult life.
          </p>
          <p style={S.body}>
            Other terms highlight changes in activities and interests. "Calligraphy" and "Chinese calligraphy" increase significantly between 2022 and 2024, a period when I devoted substantial time to practice and visited exhibitions featuring both contemporary and historical works. The term "classroom" appears much more frequently after 2023, aligning with my transition into a more structured academic environment.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing semantic timeline" minHeight="min(66vh,36rem)">
            <SemanticTimeline years={assignment2Data.semanticTimeline} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The graph below shows the frequency of selected keywords and objects over time, calculated by dividing the number of occurrences in each month by the total number of photographs taken in that month. This normalisation accounts for fluctuations in image volume, ensuring that the trends reflect changes in content rather than differences in quantity. For example, the decline of the term "boy" across time remains visible even after controlling for the number of photographs, reinforcing the interpretation that the dataset captures a shift in life stage. A more precise analysis could distinguish whether the term refers specifically to myself or to other individuals, but the overall trend still provides a meaningful indication of personal development.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing object timeline" minHeight="28rem">
            <YoloObjectTimeline />
          </StagedVisual>
        </VisBlock>

        {/* 3.3 – Semantic analysis */}
        <section id="semantic" style={SEC_CONT}>
          <h3 style={S.h3}>3.3  Semantic analysis</h3>
          <p style={S.body}>
            To analyse the semantic content of the photographs, I draw on several computational descriptions, including object detection (YOLO), vision–language tagging (CLIP), and caption generation (Gemma). Each captures a different dimension of image meaning: YOLO identifies discrete objects, CLIP assigns descriptive labels, and Gemma produces full-sentence captions. Used in combination, these representations allow the dataset to be examined through objects, scenes, and inferred descriptions.
          </p>
          <p style={S.body}>
            This approach aligns with the logic of large-scale image analysis described in Distant Viewing, where visual collections are transformed into structured data that can be queried, aggregated, and compared. Rather than relying entirely on manual interpretation, semantic features make it possible to trace recurring elements, such as "classroom", "calligraphy", or "family", across thousands of images.
          </p>
        </section>

        <VisBlock>
          <TagPanelInline />
        </VisBlock>

        <VisBlock>
          <BrightnessAreaChart />
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The search function below allows viewers to search using words or phrases, which are matched against the Gemma-generated captions of all photos. This provides an additional way to access the dataset, enabling targeted exploration alongside the broader patterns revealed through visualisation. While charts and maps highlight aggregate trends, search allows for the retrieval of specific instances, linking abstract patterns back to concrete images. The interface supports both distant and close reading: users can identify large-scale semantic patterns (e.g. the rise of "calligraphy" or "classroom") and then directly examine the individual photographs that constitute these trends.
          </p>
        </section>

        <VisBlock>
          <GemmaSearch />
        </VisBlock>

        {/* 3.4 – Geographical Patterns */}
        <section id="geography" style={SEC_CONT}>
          <h3 style={S.h3}>3.4  Geographical Patterns</h3>
          <p style={S.body}>
            To examine how place shapes visual content, I analyse the spatial distribution of objects and activities across locations.
          </p>
          <p style={S.body}>
            The map below shows the geographical distribution of my photographs. This visualisation situates photographic activity in space, making patterns of movement and spatial variation easier to interpret. It records where images were taken and highlights the uneven spatial concentration of my archive.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing geographic field" minHeight="34rem">
            <PhotoMap semanticMap={assignment2Data.semanticMap} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            By linking YOLO-detected objects and Gemma-generated keywords to geographic coordinates, place-specific visual patterns can be identified. In this visualisation, object and keyword frequencies are aggregated by location, allowing comparisons across different regions. Variations in these distributions reflect both environmental conditions and the social contexts in which photographs were taken. For example, "cow" and "sheep" occur more frequently in Tibet and Xinjiang, corresponding to pastoral landscapes, including Tibetan yaks and local cattle. "Horse" appears more often in Xinjiang than in Tibet. "Suitcase" is especially common in Hong Kong, reflecting a period when my parents accompanied me there at the beginning of my university studies.
          </p>
          <p style={S.body}>
            In Dunhuang, the high frequency of "bottle" and "people" corresponds to a group school trip in a hot desert environment, where both climate and group activity influenced photographic behaviour. By contrast, "car" appears relatively infrequently in Dunhuang and Venice, which can be explained by the desert setting of the former and the car-free infrastructure of the latter. Landscape-related terms such as "landscape" and "mountain" are strongly associated with Tibet and Xinjiang, indicating an emphasis on scenic documentation in these regions.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing place subject atlas" minHeight="min(72vh,42rem)">
            <PlaceSubjectAtlas atlas={assignment2Data.placeSubjectAtlas} />
          </StagedVisual>
        </VisBlock>

        <VisBlock>
          <StagedVisual label="Preparing 3D globe" minHeight="34rem">
            <GlobeView />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            These patterns highlight how place influences both activity and attention. The photographs capture not just movement across locations, but also shifts in what I noticed and chose to document in different environments.
          </p>
        </section>

        {/* 3.5 – Social Structure */}
        <section id="social" style={SEC_CONT}>
          <h3 style={S.h3}>3.5  Social Structure</h3>
          <p style={S.body}>
            Based on my using YOLO to count the number of people in each photograph, and my manual labelling of how many main people in each photo (excluding passers-by), and if it belongs to family, friends, professional/academic group, or neither. These features reveal changes in my social relationships across time, including shifts between family, friendship, and academic contexts.
          </p>
        </section>

        <VisBlock>
          <SocialPresenceChart />
        </VisBlock>

        {/* 3.6 – Visual Similarity and Clustering */}
        <section id="clustering" style={SEC_CONT}>
          <h3 style={S.h3}>3.6  Visual Similarity and Clustering</h3>
          <p style={S.body}>
            With the CLIP and DINOv2 embeddings, I can calculate clusters and similar images for all the photos. Similarity is computed using high-dimensional embeddings, and visualised through nearest-neighbour retrieval, which allows related images to be grouped without relying on predefined categories. This supports exploration of visual patterns within the archive. The two groups of images below are curated using image similarity, highlighting recurring scenes such as eating at tables and conference room settings.
          </p>

          {/* Similarity image groups */}
          <div style={{ display: 'flex', gap: '2rem', margin: '0.5rem 0 1.8rem', flexWrap: 'wrap' }}>
            {[
              {
                label: 'Food, eating at table',
                images: [
                  '2014-01-30_Hangzhou_001.jpg',
                  '2018-02-15_Shenzhen_001.jpg',
                  '2018-02-15_Shenzhen_002.jpg',
                  '2024-02-09_Chengdu_002.jpg',
                  '2021-05-05_Zhuhai_001.jpg',
                  '2017-10-05_Hongkong_001.jpg',
                ],
              },
              {
                label: 'Conference room',
                images: [
                  '2023-07-22_Beijing_001.JPG',
                  '2023-07-22_Beijing_002.JPG',
                  '2024-03-28_Hongkong_001.JPG',
                  '2024-03-02_Hongkong_003.JPG',
                  '2025-11-04_Vienna_005.jpg',
                  '2024-05-25_Hongkong_002.JPG',
                ],
              },
            ].map(group => (
              <div key={group.label} style={{ flex: '1 1 260px' }}>
                <p style={{ margin: '0 0 0.5rem', font: '600 0.68rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  {group.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                  {group.images.map(filename => (
                    <img
                      key={filename}
                      src={imageUrl(filename)}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '0.5rem', display: 'block' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={S.body}>
            The network below shows the clustering of all photographs in the dataset. Each node represents an individual image, positioned according to its similarity to others in the high-dimensional embedding space and projected into two dimensions using UMAP. Colours show the cluster to which each image is assigned, revealing groups of visually related images that share common features without relying on predefined semantic categories. Dense regions in the network correspond to recurring visual themes in the archive, while more sparsely connected nodes suggest outliers or less frequently captured scenes. This network-based representation provides an overview of the structural organisation of the dataset, complementing the local perspective offered by nearest-neighbour retrieval.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing visual constellation" minHeight="min(75vh,44rem)">
            <AssignmentTwoGraph />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            This form of visualisation supports exploratory analysis, enabling patterns to emerge through interaction rather than predefined classification. This makes thematic exploration more effective. Such patterns would be difficult to identify without computational similarity search.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing centrality network" minHeight="min(80vh,50rem)">
            <CentralityNetwork />
          </StagedVisual>
        </VisBlock>

        <VisBlock>
          <StagedVisual label="Preparing chromatic field" minHeight="min(65vh,36rem)">
            <AssignmentTwoSonification />
          </StagedVisual>
        </VisBlock>

        {/* Beeswarm: sticky viz left, scrollable text right */}
        <div id="swarm" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', padding: '4.5rem 0 2rem' }}>
          <div style={{ flex: '0 0 64%', position: 'sticky', top: '1.5rem' }}>
            <StagedVisual label="Preparing beeswarm" minHeight="100vh">
              <ChromaticSwarm step={swarmStep} />
            </StagedVisual>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 40vh - 1rem)' }}>
            <div style={{ padding: '0 0 1rem' }}>
              <p style={{ ...S.kicker, marginBottom: '0.4rem' }}>Scroll-Driven Beeswarm</p>
              <h3 style={{ ...S.h3, marginTop: 0 }}>The same corpus read as freely moving circles.</h3>
              <p style={S.body}>
                The stripes above collapse each photograph into a one-dimensional mark. Here the same data expands into two dimensions: each circle can drift, cluster, or align along an axis.
              </p>
              <p style={S.body}>
                Hover any circle to inspect the photograph and click to pin a detail strip. Radius encodes style energy; colour is the dominant hue.
              </p>
            </div>
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

        {/* 4 – Conclusion */}
        <section id="conclusion" style={SEC}>
          <h2 style={S.h2}>4  Conclusion</h2>
          <p style={S.body}>
            To communicate these findings, the web-based visualisation utilises a Narrative Visualisation framework, specifically the "Martini Glass" structure described by Segel and Heer. The interface begins with a directed narrative that guides the viewer through the major temporal and geographical shifts of my 20-year archive. It then opens up into an interactive exploration. This structure supports both guided interpretation and open exploration, aligning with principles of narrative visualisation that balance author-driven storytelling with user-driven discovery. This supports both an author-led story about my personal growth and a user-led discovery phase where the viewer can filter by "Chinese calligraphy" or "Paris" to see the specific images that ground the data.
          </p>
          <p style={S.body}>
            Ultimately, this project demonstrates that the Quantified Self is not limited to heart rates or step counts. By applying computational methods to a lifetime of photography, I have constructed a digital mirror that reflects my changing priorities and environments. This synthesis of machine-driven analysis and humanistic interpretation allows the archive to speak as a cohesive narrative, turning a fragmented collection of files into a legible history of a lived experience.
          </p>
        </section>

        {/* 5 – Reflection on design */}
        <section id="reflection" style={SEC}>
          <h2 style={S.h2}>5  Reflection on design</h2>
          <p style={S.body}>
            When designing the website, I initially considered a strict two-column, scroll-based storytelling layout, similar to k-means-explorable. However, this approach made the interface overly crowded and restrictive. Not all sections of the narrative required accompanying visualisations, and the fixed two-column structure risked forcing visual elements where they were not necessary. As a result, I shifted to a primarily single-column essay format.
          </p>
          <p style={S.body}>
            This decision reflects a key visualisation principle: reducing visual clutter in order to improve readability and interpretability. A simpler layout allows the viewer to focus more clearly on both the textual argument and the visual content without unnecessary distraction.
          </p>
          <p style={S.body}>
            At the same time, I found that selectively reintroducing a two-column layout in certain sections was beneficial. In these cases, placing visualisations alongside the relevant text creates a closer connection between analysis and representation, and makes more efficient use of space when visual elements are relatively compact.
          </p>
          <p style={S.body}>
            Overall, the design balances clarity with flexibility, prioritising consistency and the close integration of text and visualisation. This ensures that visual elements directly support the narrative argument rather than interrupt or overwhelm it.
          </p>
        </section>

        {/* References */}
        <section id="references" style={SEC}>
          <h2 style={S.h2}>References</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Arnold, Taylor, and Lauren Tilton. Distant viewing: Computational exploration of digital images. MIT Press, 2023.',
              'Arnold, Taylor, Nathaniel Ayers, Justin Madron, Robert Nelson, and Lauren Tilton. "Visualizing a large spatiotemporal collection of historic photography with a generous interface." In 2020 IEEE 5th Workshop on Visualization for the Digital Humanities (VIS4DH), pp. 30-35. IEEE, 2020.',
              'Drucker, Johanna. "Humanities approaches to graphical display." Digital Humanities Quarterly 5, no. 1 (2011): 1-21.',
              'Manovich, Lev. Cultural analytics. Mit Press, 2020.',
              'Segel, Edward, and Jeffrey Heer. "Narrative visualization: Telling stories with data." IEEE transactions on visualization and computer graphics 16, no. 6 (2010): 1139-1148.',
              'Van Den Berg, Hein, Arianna Betti, Thom Castermans, Rob Koopman, Bettina Speckmann, K. A. B. Verbeek, Titia Van der Werf, Shenghui Wang, and Michel A. Westenberg. "A philosophical perspective on visualization for digital humanities." (2018).',
              'Windhager, Florian, Paolo Federico, Günther Schreder, Katrin Glinka, Marian Dörk, Silvia Miksch, and Eva Mayr. "Visualization of cultural heritage collection data: State of the art and future challenges." IEEE transactions on visualization and computer graphics 25, no. 6 (2018): 2311-2330.',
              'Wrisley, David Joseph. "Pre-visualization." IEEE 3rd Workshop for Visualization and the Digital Humanities, 2018.',
            ].map((ref, i) => (
              <p key={i} style={{ ...S.body, margin: 0, fontSize: '0.92rem', lineHeight: '1.65', paddingLeft: '2em', textIndent: '-2em' }}>
                {ref}
              </p>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
