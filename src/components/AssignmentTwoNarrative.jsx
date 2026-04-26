import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { assignment2Data } from '../data/assignment2Data'
import AssignmentTwoGraph from './AssignmentTwoGraph'
import ChromaticSwarm, { STEPS as SWARM_STEPS } from './ChromaticSwarm'
import PeoplePanel from './PeoplePanel'
import SemanticTimeline from './SemanticTimeline'
import PlaceSubjectAtlas from './PlaceSubjectAtlas'
import TemporalRibbon from './TemporalRibbon'
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
    font: '1rem/1.8 "Aptos", "Aptos Display", "Segoe UI", "Calibri", sans-serif',
    color: 'var(--archive-color-copy)',
    maxWidth: 'none',
  },
  link: {
    color: 'var(--archive-color-ink)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--archive-color-muted)',
    textUnderlineOffset: '3px',
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

// ── Donut chart helpers ───────────────────────────────────────────────────────

function donutArc(cx, cy, R, r, a0, a1) {
  const G = 0.022
  const s = a0 + G, e = a1 - G
  if (e <= s) return ''
  const lg = e - s > Math.PI ? 1 : 0
  const pt = (a, rad) => `${(cx + rad * Math.cos(a)).toFixed(3)} ${(cy + rad * Math.sin(a)).toFixed(3)}`
  return `M ${pt(s,R)} A ${R} ${R} 0 ${lg} 1 ${pt(e,R)} L ${pt(e,r)} A ${r} ${r} 0 ${lg} 0 ${pt(s,r)} Z`
}

function DonutChart({ slices, title, defaultCenter }) {
  const [hov, setHov] = useState(null)
  const total = slices.reduce((s, d) => s + d.count, 0)
  const CX = 80, CY = 80, R = 60, r = 36
  let angle = -Math.PI / 2
  const arcs = slices.map(sl => {
    const sweep = (sl.count / total) * 2 * Math.PI
    const arc = { ...sl, a0: angle, a1: angle + sweep }
    angle += sweep
    return arc
  })
  const active = hov !== null ? arcs[hov] : null
  const cVal = active ? `${((active.count / total) * 100).toFixed(0)}%` : defaultCenter.value
  const cSub = active ? (active.shortLabel ?? active.label) : defaultCenter.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}>
      <p style={{ margin: 0, font: '600 0.68rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-muted)', textAlign: 'center' }}>
        {title}
      </p>
      <svg viewBox="0 0 160 160" style={{ width: '100%', maxWidth: 160, display: 'block' }}>
        {arcs.map((arc, i) => (
          <path key={i} d={donutArc(CX, CY, R, r, arc.a0, arc.a1)} fill={arc.color}
            opacity={hov === null || hov === i ? 1 : 0.28}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ transition: 'opacity 0.18s', cursor: 'default' }} />
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle"
          style={{ font: '700 15px var(--archive-font-ui)', fill: 'var(--archive-color-ink)' }}>
          {cVal}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle"
          style={{ font: '9.5px var(--archive-font-ui)', fill: 'var(--archive-color-muted)' }}>
          {cSub}
        </text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.18rem 0.5rem', width: '100%' }}>
        {slices.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sl.color, flexShrink: 0 }} />
            <span style={{ font: '9.5px var(--archive-font-ui)', color: 'var(--archive-color-copy)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sl.shortLabel ?? sl.label}{' '}
              <span style={{ color: 'var(--archive-color-muted)' }}>
                {((sl.count / total) * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SHORT_CLUSTER = {
  0: 'City', 1: 'Street', 2: 'Temple', 3: 'Indoor',
  4: 'Museum', 5: 'Mountain', 6: 'Art', 7: 'Water',
}

function SocialDonutPanel() {
  const { totals, personCountHistogram, clusterCentroids, clusterNames } = assignment2Data
  const PERSON_COLORS = ['#8a9aaa', '#7d8f7e', '#b09070', '#c28d5b', '#7f5539']

  return (
    <div style={{
      borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)',
      background: 'rgba(255,255,255,0.72)', padding: '1.6rem 1.8rem',
      boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)',
      maxWidth: '680px', margin: '0 auto',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.8rem 2.4rem' }}>
        <DonutChart
          title="Person Count"
          slices={personCountHistogram.map((b, i) => ({ label: b.label, count: b.count, color: PERSON_COLORS[i] }))}
          defaultCenter={{ value: totals.images.toLocaleString(), label: 'photos' }}
        />
        <DonutChart
          title="My Presence"
          slices={[
            { label: 'I appear',     count: 2893, color: '#274c77' },
            { label: "Don't appear", count: 4350, color: '#c8d8e6' },
          ]}
          defaultCenter={{ value: '40%', label: 'I appear' }}
        />
        <DonutChart
          title="Visual Themes"
          slices={[...clusterCentroids].sort((a, b) => b.count - a.count).map(c => ({
            label: clusterNames[c.cluster_id],
            shortLabel: SHORT_CLUSTER[c.cluster_id],
            count: c.count,
            color: CLUSTER_COLOURS[c.cluster_id],
          }))}
          defaultCenter={{ value: '8', label: 'clusters' }}
        />
        <DonutChart
          title="Orientation"
          slices={[
            { label: 'Landscape', count: totals.landscape, color: '#4d6a6d' },
            { label: 'Portrait',  count: totals.portrait,  color: '#e09f3e' },
          ]}
          defaultCenter={{ value: '85%', label: 'landscape' }}
        />
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
    desc:  'June, July, and August together hold more than a third of the entire archive. These are the months of extended travel, family reunions, and outdoor exploration — the conditions most likely to prompt a camera.',
    highlight: [5, 6, 7],
    color:     '#c28d5b',
  },
  {
    key:   'secondary',
    title: 'February, October, and December also stand out',
    desc:  'Three shorter peaks break the quiet of the rest. February aligns with Chinese New Year — a season of family gatherings and celebrations. October corresponds to Golden Week, China\'s national holiday, which reliably produces travel photographs. December follows a similar pattern, likely tied to end-of-year festivities and the lead-up to the Lunar New Year.',
    highlight: [1, 9, 11],
    color:     '#7b6f9c',
  },
  {
    key:   'quiet',
    title: 'The quiet months',
    desc:  'Spring and mid-autumn are sparse. March, April, May, September, and November together hold fewer photos than August alone. These months represent routine rather than occasion — commutes, deadlines, and the undocumented pace of ordinary weeks.',
    highlight: [0, 2, 3, 4, 8, 10],
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
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const overlayRef = useRef(null)
  const railTracksRef = useRef([])
  const tilesRef = useRef([])
  const tileFramesRef = useRef([])

  // Beeswarm scroll-driven step
  const [swarmStep, setSwarmStep] = useState(0)
  const swarmCardRefs = useRef([])

  // Seasonal histogram scroll-driven step
  const [seasonalStep, setSeasonalStep] = useState(0)
  const seasonalCardRefs = useRef([])

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

  // Beeswarm cards: IntersectionObserver detects which card is centred in viewport
  useEffect(() => {
    const cards = swarmCardRefs.current.filter(Boolean)
    if (!cards.length) return
    gsap.set(cards[0], { opacity: 1, filter: 'blur(0px)', scale: 1 })
    cards.slice(1).forEach(c => gsap.set(c, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98 }))
    const observers = cards.map((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSwarmStep(i) },
        { rootMargin: '-49% 0px -49% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Beeswarm cards: GSAP animates blur/scale/opacity when active step changes
  useEffect(() => {
    const cards = swarmCardRefs.current.filter(Boolean)
    cards.forEach((c, j) => gsap.to(c, {
      opacity: j === swarmStep ? 1 : 0.3,
      filter: j === swarmStep ? 'blur(0px)' : 'blur(2px)',
      scale: j === swarmStep ? 1 : 0.98,
      duration: 0.5, ease: 'power2.out', overwrite: 'auto',
    }))
  }, [swarmStep])

  // Seasonal cards: IntersectionObserver detects which card is centred in viewport
  useEffect(() => {
    const cards = seasonalCardRefs.current.filter(Boolean)
    if (!cards.length) return
    gsap.set(cards[0], { opacity: 1, filter: 'blur(0px)', scale: 1 })
    cards.slice(1).forEach(c => gsap.set(c, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98 }))
    const observers = cards.map((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSeasonalStep(i) },
        { rootMargin: '-49% 0px -49% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Seasonal cards: GSAP animates blur/scale/opacity when active step changes
  useEffect(() => {
    const cards = seasonalCardRefs.current.filter(Boolean)
    cards.forEach((c, j) => gsap.to(c, {
      opacity: j === seasonalStep ? 1 : 0.3,
      filter: j === seasonalStep ? 'blur(0px)' : 'blur(2px)',
      scale: j === seasonalStep ? 1 : 0.98,
      duration: 0.5, ease: 'power2.out', overwrite: 'auto',
    }))
  }, [seasonalStep])

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
          <p style={S.kicker}>DH6034 Assignment 2</p>
          <h1 className="assignment2-hero-title" style={{ ...S.h1, color: '#f8fafc' }}>From Portraits<br />to Patterns</h1>
          <p className="assignment2-hero-subtitle" style={{ ...S.subtitle, color: 'rgba(226,232,240,0.88)' }}>
            A Data-Driven Analysis of Personal Life Through Photographs
          </p>
        </div>
      </header>

      {/* ── Essay body ── */}
      <div style={{ margin: '0 auto', width: 'min(112rem,calc(100vw - 2rem))', padding: '0 1.5rem 6rem' }}>

        {/* 1 – Introduction */}
        <section id="intro" style={SEC}>
          <h2 style={S.h2}>1  Introduction</h2>
          <p style={S.body}>
            From the yellow loess of Lanzhou to the vertical neon of Hong Kong, and later to life in Europe, my life has unfolded across distinct cultural and visual environments. Over the past two decades, I have accumulated a personal archive of more than 7,000 photographs. These images record everyday moments, capturing changes in my relationships, surroundings, and routines. I analyse this collection computationally through image pre-processing and visualisation to examine how photographic patterns reflect changes in life stages, social interactions, daily activities, and personal interests over time.
          </p>
          <p style={S.body}>
            This approach reflects a broader shift in cultural analysis, where computational methods and visualisation help identify patterns in large-scale image collections that would otherwise be difficult to discern (Manovich 2020). These collections can then be explored through interactive visualisations.
          </p>
          <p style={S.body}>
            Following Johanna Drucker (2011), these 7,000 images are treated not as objective data (the given), but as capta (the taken). In the humanities, knowledge is always situated and partial; this archive does not present a neutral record of life, but reflects what was photographed, what was ignored, and the situations in which images were taken. In this way, the visualisation is understood as an interpretative practice of self-reflection.
          </p>
          <p style={S.body}>
            Although photographs are not typically treated as data in the same way as biometric or sensor logs, they are composed of pixel-based information and can be analysed computationally. At the same time, they function as a form of self-documentation, offering an indirect yet meaningful representation of lived experience. As such, photographic archives can be approached as complex datasets that encode patterns of behaviour and environment over time.
          </p>
        </section>

        {/* 2 – Methodology */}
        <section id="methodology" style={SEC}>
          <h2 style={S.h2}>2  Methodology</h2>
          <h3 style={S.h3}>2.1  Data Preparation</h3>
          <p style={S.body}>
            I assembled a dataset of over 7,000 photographs collected from my phone, laptop, and cloud storage. While most of the images contained timestamps in the embedded EXIF metadata, all of them lacked location coordinates. To ensure temporal and spatial continuity across the archive, missing metadata was manually supplemented, including the assignment of latitude and longitude coordinates using Google Maps. This process highlights a key principle in Digital Humanities: datasets are not passively “given” but actively constructed through processes of selection, correction, and interpretation. This manual labour constitutes what Wrisley defines as pre-visualisation, defined as interdisciplinary and transmedial critical work that links the raw archive to the final visual system (Wrisley, 2018).
          </p>
          <p style={S.body}>
            In this project, the photographic archive is treated as a form of cultural data that can be rendered computationally analysable through data science approaches to humanities materials. This aligns with cultural analytics, which applies computational and visual methods to explore patterns in large-scale cultural datasets (Manovich 2020). The dataset is therefore understood not as an objective record of lived experience, but as a partial collection shaped by what was captured and preserved. The preparation of the dataset through annotation and categorisation therefore constitutes an interpretative process that conditions all subsequent analysis.
          </p>
          <p style={S.body}>
            To address the limitations of automated person detection (discussed below) in capturing socially meaningful relationships, I manually annotated each photograph to record whether I appear in each photograph, the number of main people present (excluding passers-by), and the social context of the image (e.g. family, friends, or academic settings).
          </p>
          <p style={S.body}>
            This process also reflects challenges such as incomplete metadata and the need to balance automated methods with manual annotation.
          </p>
          <h3 style={S.h3}>2.2  Feature Extraction and Multimodal Analysis</h3>
          <p style={S.body}>
            To enable large-scale analysis, I generated high-dimensional image embeddings for each photograph using <a href="https://github.com/mlfoundations/open_clip/" target="_blank" rel="noreferrer" style={S.link}>OpenCLIP</a> and <a href="https://dinov2.metademolab.com/" target="_blank" rel="noreferrer" style={S.link}>DINOv2</a> (Cherti et al. 2023; Oquab et al. 2023). These models encode images as vectors, allowing for similarity comparison, clustering, and the discovery of latent thematic patterns. Unlike earlier approaches that rely on supervised models such as ResNet-50 (Arnold and Tilton 2023), the use of self-supervised and multimodal models allows for a more flexible and semantically rich representation of visual content.
          </p>
          <p style={S.body}>
            In addition to visual embeddings, I extracted dominant colour values from each image to support chromatic analysis. Following Arnold and Tilton’s analysis of how colour in movie posters relates to genre (Arnold and Tilton 2023), I extracted the dominant colour of each photograph to support chromatic visualisations and examine whether colour patterns reflect broader trends.
          </p>
          <p style={S.body}>
            To capture semantic and contextual information, I used a combination of computer vision and vision–language models. I applied YOLO to detect objects in each image, including estimating the number of people present. As noted earlier, object detection only provides rough counts and does not capture social relationships. 
          </p>
          <p style={S.body}>
            This combination of automated detection and manual annotation captures both visual content and socially relevant information. It also reflects a broader principle in Digital Humanities: computational methods support, but do not replace, human interpretation when working with complex cultural data.
          </p>
          <p style={S.body}>
            Furthermore, textual descriptions of the images were generated using vision–language models. Initially, I used BLIP to generate captions and keywords, but the results were not accurate enough, so I switched to the Gemma 4 31B-it model via Together AI, which produced more reliable semantic descriptions. To improve consistency and reduce hallucinated or interpretative outputs, the model was prompted to generate short, literal descriptions restricted to observable visual content, and to return results in a structured JSON format (including a single-sentence caption and a fixed set of keywords). The integration of visual features (embeddings), detected objects, and generated text reflects a “multimodal turn” in Digital Humanities, in which computational analysis operates across multiple representational layers rather than relying on a single data modality.
          </p>
          <p style={S.body}>
            All extracted features and annotations were stored in a structured JSON format, linking each image to its associated metadata, embeddings, captions, and categorical labels, as shown below. 
          </p>
        </section>

        <VisBlock>
          <JsonScrollExplainer />
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The structured metadata results from collaboration between computational tools and humanistic inquiry, embodying the pre-visualisation phase where the archive is prepared to speak as a cohesive model (Wrisley, 2018).
          </p>
        </section>

        {/* 3 – Findings */}
        <section id="findings" style={SEC}>
          <h2 style={S.h2}>3  Findings</h2>
          <h3 style={S.h3}>3.1  Overview</h3>
          <p style={S.body}>
            Several patterns emerged from the analysis. Photographs from my early years consist predominantly of family group portraits, reflecting the centrality of family life during childhood. This pattern declines noticeably after my move to university, when photographs increasingly focus on academic settings and time spent with friends.
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
            The bar chart below shows the distribution of photographs across time. A bar chart is appropriate here because it highlights variations in photographic activity, making periods of high and low activity easy to identify. The distribution is uneven, with noticeable peaks corresponding to periods of travel. This suggests that travel strongly influences when photographs are taken.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing temporal ribbon" minHeight="min(60vh,28rem)">
            <TemporalRibbon bins={assignment2Data.temporalBins} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            A seasonal pattern can also be observed. When aggregating photographs by month across all years, the summer months contain substantially more images than the rest of the year. October, December, and February also show moderate increases, which likely correspond to recurring events such as the Chinese National Day holiday and the Chinese New Year. These patterns indicate that photographic activity is shaped by both personal circumstances and recurring cultural events.
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
                style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                <div
                  ref={el => { seasonalCardRefs.current[i] = el }}
                  className={`explanation-card${seasonalStep === i ? ' active-card' : ''}`}
                  style={{ padding: '1.5rem 1.6rem' }}
                >
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
            Changes over time can also be examined through semantic features derived from Gemma-generated keywords. The line graph below visualises the frequency of selected terms across different periods. The terms “boy” and “child” appear frequently in earlier years but decline sharply in later periods, reflecting a transition in how subjects are represented within the archive. This shift corresponds to my own ageing, as the collection moves from documenting childhood to adult life.
          </p>
          <p style={S.body}>
            Other terms highlight changes in activities and interests. “Calligraphy” and “Chinese calligraphy” increase significantly between 2022 and 2024, a period when I actively practised calligraphy and visited exhibitions featuring both contemporary and historical calligraphy. The term “classroom” appears much more frequently after 2023, aligning with my transition into a more structured academic environment.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing semantic timeline" minHeight="min(66vh,36rem)">
            <SemanticTimeline years={assignment2Data.semanticTimeline} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The graph below shows the frequency of selected keywords and objects over time, calculated by dividing occurrences in each month by the total number of photographs taken in that month. This adjusts for months with more or fewer photos. For example, the term “boy” appears less frequently over time, suggesting a shift in life stage. A more precise analysis could distinguish whether the term refers to myself or to others, but the overall trend still indicates personal development.
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
            To analyse the semantic content of the photographs, I draw on several computational descriptions, including object detection (YOLO), vision–language tagging (CLIP), and caption generation (Gemma). Each captures a different dimension of image meaning: YOLO identifies discrete objects, CLIP assigns descriptive labels, and Gemma produces full-sentence captions.
          </p>
          <p style={S.body}>
            This approach aligns with the logic of large-scale image analysis described in Distant Viewing (Arnold and Tilton 2023), where visual collections are transformed into structured data that can be queried, aggregated, and compared. Instead of relying entirely on manual interpretation, semantic features make it possible to trace recurring elements, such as “classroom”, “calligraphy”, or “family”, across thousands of images.
          </p>
        </section>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The search function below allows viewers to search using words or phrases, which are matched against the Gemma-generated captions of all photos. This provides an additional way to access the dataset, enabling targeted exploration alongside broader visual patterns. While charts and maps highlight aggregate trends, search allows for the retrieval of specific instances, linking abstract patterns back to concrete images. The interface supports both distant and close reading: users can identify large-scale semantic patterns (e.g. the rise of “calligraphy” or “classroom”) and then directly examine the individual photographs that constitute these trends.
          </p>
        </section>

        <VisBlock>
          <GemmaSearch />
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The full collection can be explored in the “Photo Archive” tab, which provides direct access to all images alongside their metadata.
          </p>
        </section>

        {/* 3.4 – Geographical Patterns */}
        <section id="geography" style={SEC_CONT}>
          <h3 style={S.h3}>3.4  Geographical Patterns</h3>
          <p style={S.body}>
            To examine how place shapes visual content, I analyse the spatial distribution of objects and activities across locations.
          </p>
          <p style={S.body}>
            The map below shows the geographical distribution of my photographs. This visualisation situates photographic activity in space, making patterns of movement and spatial variation easier to interpret.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing geographic field" minHeight="34rem">
            <PhotoMap semanticMap={assignment2Data.semanticMap} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            By linking YOLO-detected objects and Gemma-generated keywords to geographic coordinates, place-specific visual patterns can be identified. In this visualisation, object and keyword frequencies are aggregated by location, allowing comparisons across different regions. Variations in these distributions reflect both environmental conditions and the social contexts in which photographs were taken. The heatmap below shows the correlation between locations and keywords, making patterns across locations easier to compare at a glance.
          </p>
          <p style={S.body}>
            In Tibet and Xinjiang, terms such as “cow”, “sheep”, “landscape”, and “mountain” occur more frequently, corresponding to pastoral environments and an emphasis on scenic documentation. By contrast, “suitcase” is especially common in Hong Kong, reflecting a period when my parents accompanied me there at the beginning of my university studies.
          </p>
          <p style={S.body}>
            In Dunhuang, the high frequency of “bottle” and “people” corresponds to a group school trip in a hot desert environment, where both climate and group activity influenced photographic behaviour. Meanwhile, “car” appears relatively infrequently in both Dunhuang and Venice, reflecting the desert setting of the former and the car-free infrastructure of the latter.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing place subject atlas" minHeight="min(72vh,42rem)">
            <PlaceSubjectAtlas atlas={assignment2Data.placeSubjectAtlas} />
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
            I used YOLO to estimate the number of people in each photograph and manually annotated how many main subjects were present (excluding passers-by), as well as the social context of each image (family, friends, professional/academic, or other). These features reveal changes in my social relationships over time, including shifts between family life, friendships, and academic environments.
          </p>
          <p style={S.body}>
            Using the annotations of whether I appear in each photograph and the number of main people present, the line graph below shows how these values change over time. Both my presence and the number of people tend to decline in later years. This likely reflects a shift in my daily life: after leaving my family, I spend more time alone and more often photograph scenes rather than appearing in the images myself. There is a small peak in 2021, when I was at home with my parents and appeared more often in photos.
          </p>
        </section>

        <VisBlock>
          <SocialDonutPanel />
        </VisBlock>

        {/* 3.6 – Visual Similarity and Clustering */}
        <section id="clustering" style={SEC_CONT}>
          <h3 style={S.h3}>3.6  Visual Similarity and Clustering</h3>
          <p style={S.body}>
            With the CLIP and DINOv2 embeddings, I can find similar images and identify clusters. Similarity is computed using high-dimensional embeddings, and visualised through nearest-neighbour retrieval, which allows related images to be grouped. This supports the exploration of visual patterns within the archive. The two groups of images below are curated using image similarity, highlighting recurring scenes such as eating at tables and conference room settings.
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
            The network below shows the clustering of all photographs in the dataset. Each node represents an individual image, positioned according to its similarity to others in the high-dimensional embedding space and projected into two dimensions using UMAP, a dimensionality reduction technique. Colours show the cluster to which each image is assigned. Dense regions in the network correspond to recurring visual themes in the archive, while more sparsely connected nodes suggest outliers or less frequently captured scenes.
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
          <p style={S.body}>
            What surprised me most was how easy it became to find similar moments across the archive. Using image similarity and keyword search, I could connect photos that I would never have linked manually. Images that seemed unrelated on their own started to form clear patterns. This changed how I looked at the archive, shifting my focus from individual memories to recurring themes.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing centrality network" minHeight="min(80vh,50rem)">
            <CentralityNetwork />
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
                Here the corpus is read as a field of moving circles rather than a fixed grid. Each point can drift, cluster, or align along an axis, making broader patterns easier to perceive.
              </p>
              <p style={S.body}>
                Hover any circle to inspect the photograph and click to pin a detail strip. Radius encodes style energy; colour is the dominant hue.
              </p>
            </div>
            {SWARM_STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                <div
                  ref={el => { swarmCardRefs.current[i] = el }}
                  className={`explanation-card${swarmStep === i ? ' active-card' : ''}`}
                  style={{ padding: '1.5rem 1.6rem' }}
                >
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
            To communicate these findings, the website adopts a narrative visualisation framework, following the “Martini Glass” structure (Segel and Heer 2010), which combines an initial linear, guided narrative with a subsequent open, interactive exploration. The interface first leads the viewer through major temporal and geographical patterns in the archive, before allowing independent exploration of the dataset. This structure supports both guided interpretation and user-driven discovery, allowing viewers to move between patterns and individual images, for example by filtering terms such as “calligraphy” or “Paris” to examine the visual instances underlying broader trends.
          </p>
          <p style={S.body}>
            This project demonstrates how computational analysis can be applied to a personal photographic archive to reveal patterns in social relationships, activities, and environments over time. By combining machine-driven feature extraction with human interpretation, the project creates a structured representation of lived experience that can be explored at multiple levels of abstraction. In this sense, the archive becomes not only a collection of images, but a structured system through which personal history can be examined and reinterpreted.
          </p>
          <p style={S.body}>
            At the same time, computational analysis reduces complex experiences into measurable features. While this enables large-scale pattern recognition, it also raises questions about what remains unrecorded or cannot be captured within the dataset, highlighting the limits of representing life through data.
          </p>
        </section>

        {/* 5 – Reflection on design */}
        <section id="reflection" style={SEC}>
          <h2 style={S.h2}>5  Reflection on design</h2>
          <p style={S.body}>
            The design of the web interface forms part of how the dataset is interpreted and communicated. When designing the website, I initially considered a strict two-column, scroll-based storytelling layout, similar to <a href="https://k-means-explorable.vercel.app/" target="_blank" rel="noreferrer" style={S.link}>K-Means Clustering: An Explorable Explainer</a> (Ang n.d.). However, this approach made the interface overly crowded and restrictive. Not all sections required visualisations, and the fixed two-column layout risked introducing them unnecessarily. As a result, I shifted to a primarily single-column essay format.
          </p>
          <p style={S.body}>
            In the website, I initially included a data sonification section and a beeswarm plot, but later removed them: the former relied on abstract image features that did not support meaningful interpretation, while the latter duplicated existing visualisations without adding new insight.
          </p>
          <p style={S.body}>
            This decision reflects key information visualisation principles, particularly clarity and simplicity. A single-column layout reduces visual clutter and improves readability.
          </p>
          <p style={S.body}>
            At the same time, a two-column layout is selectively reintroduced where appropriate. In these cases, aligning visualisations with the relevant text strengthens the connection between analysis and representation and makes more efficient use of space.
          </p>
          <p style={S.body}>
            Overall, the design balances clarity with flexibility, prioritising consistency and the integration of text and visualisation. This ensures that visual elements directly support the narrative argument rather than interrupt or overwhelm it.
          </p>
        </section>

        {/* References */}
        <section id="references" style={SEC}>
          <h2 style={S.h2}>References</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              <>Ang, Yi Zhe. n.d. <em>K-Means Clustering: An Explorable Explainer</em>. Accessed April 24, 2026. https://k-means-explorable.vercel.app/.</>,
              <>Arnold, Taylor, and Lauren Tilton. 2023. <em>Distant Viewing: Computational Exploration of Digital Images</em>. Cambridge, MA: MIT Press.</>,
              <>Arnold, Taylor, Nathaniel Ayers, Justin Madron, Robert Nelson, and Lauren Tilton. 2020. “Visualizing a Large Spatiotemporal Collection of Historic Photography with a Generous Interface.” In <em>Proceedings of the IEEE 5th Workshop on Visualization for the Digital Humanities</em>, 30–35. IEEE.</>,
              <>Cherti, Mehdi, Romain Beaumont, Ross Wightman, Mitchell Wortsman, Gabriel Ilharco, Cade Gordon, Christoph Schuhmann, Ludwig Schmidt, and Jenia Jitsev. 2023. “Reproducible Scaling Laws for Contrastive Language-Image Learning.” In <em>Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition</em>, 2818–2829.</>,
              <>Drucker, Johanna. 2011. “Humanities Approaches to Graphical Display.” <em>Digital Humanities Quarterly</em> 5 (1).</>,
              <>Manovich, Lev. 2020. <em>Cultural Analytics</em>. Cambridge, MA: MIT Press.</>,
              <>Oquab, Maxime, Timothée Darcet, Théo Moutakanni, Huy Vo, Marc Szafraniec, Vasil Khalidov, Pierre Fernandez, et al. 2023. “DINOv2: Learning Robust Visual Features without Supervision.” <em>arXiv</em>:2304.07193.</>,
              <>Segel, Edward, and Jeffrey Heer. 2010. “Narrative Visualization: Telling Stories with Data.” <em>IEEE Transactions on Visualization and Computer Graphics</em> 16 (6): 1139–1148.</>,
              <>Wrisley, David Joseph. 2018. “Pre-visualization.” In <em>Proceedings of the IEEE 3rd Workshop on Visualization for the Digital Humanities</em>.</>,
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
