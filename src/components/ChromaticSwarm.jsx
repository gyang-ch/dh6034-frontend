/**
 * ChromaticSwarm
 *
 * Same data as the Chromatic Fugue stripes rendered as circles:
 *   radius  = style energy  (mirrors stripeHeight mapping)
 *   fill    = dominant hex colour (same as stripe colour)
 *
 * Scroll capture: ScrollTrigger pins this section for
 * (STEPS.length × 100vh) of scroll. Each "screen" of scroll
 * advances one arrangement step; after the last step the pin
 * releases and normal page scrolling resumes.
 *
 * Steps
 *   0  Scatter     — loose cluster gravity, circles breathe freely
 *   1  Timeline    — beeswarm along the date axis
 *   2  Families    — eight cluster columns pulled apart
 *   3  Energy      — rank-sorted gradient from quiet to intense
 */

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { forceSimulation, forceX, forceY, forceCollide } from 'd3'
import { assignment2Data } from '../data/assignment2Data'
import { photographUrl } from '../lib/photographs'

gsap.registerPlugin(ScrollTrigger)

// ── constants ────────────────────────────────────────────────────────────────

const CLUSTER_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

const STEPS = [
  {
    key: 'scatter',
    title: 'The full corpus, set free',
    desc: 'Each circle is one photograph. Radius encodes style energy; colour is the dominant hue. Circles drift loosely near their visual cluster.',
  },
  {
    key: 'timeline',
    title: 'Arranged along time',
    desc: 'Circles slide into chronological order. The beeswarm spread on the vertical axis prevents overlap while preserving temporal position on the x-axis.',
  },
  {
    key: 'families',
    title: 'Gathered by visual family',
    desc: 'Eight CLIP clusters pull their members into distinct vertical columns — each band is a recurring visual theme in the archive.',
  },
  {
    key: 'energy',
    title: 'Sorted by style energy',
    desc: 'Low-contrast, quiet photographs settle to the left; high-energy images rise to the right — a proxy for visual intensity across the archive.',
  },
]

const LERP      = 0.082
const SIM_TICKS = 180

const imageUrl = photographUrl

// ── helpers ───────────────────────────────────────────────────────────────────

function circleR(styleEnergy) {
  return Math.max(2.8, 4 + styleEnergy * 8.5)
}

function computeAllTargets(items, W, H) {
  const pad  = 56
  const midY = H / 2

  // ── step 0: scatter by cluster ────────────────────────────────────────────
  const cxT = [0.12, 0.34, 0.57, 0.80, 0.21, 0.46, 0.68, 0.87].map((t) => t * W)
  const cyT = [0.28, 0.22, 0.26, 0.30, 0.72, 0.76, 0.70, 0.66].map((t) => t * H)

  const t0nodes = items.map((it) => ({
    x: cxT[it.clusterId] + (Math.random() - 0.5) * 50,
    y: cyT[it.clusterId] + (Math.random() - 0.5) * 50,
    __r: it.r,
  }))
  forceSimulation(t0nodes)
    .force('x', forceX((d, i) => cxT[items[i].clusterId]).strength(0.28))
    .force('y', forceY((d, i) => cyT[items[i].clusterId]).strength(0.28))
    .force('collide', forceCollide((d) => d.__r + 1.4).strength(0.88).iterations(3))
    .stop().tick(SIM_TICKS)
  const t0 = t0nodes.map(({ x, y }) => ({ x, y }))

  // ── step 1: timeline beeswarm ─────────────────────────────────────────────
  const dated = items.filter((it) => it.date)
  const times = dated.map((it) => new Date(it.date).getTime())
  const tMin  = Math.min(...times)
  const tMax  = Math.max(...times)
  const xForDate = (it) =>
    it.date
      ? pad + ((new Date(it.date).getTime() - tMin) / (tMax - tMin)) * (W - 2 * pad)
      : W - pad * 0.6

  const t1nodes = items.map((it) => ({
    x: xForDate(it), y: midY + (Math.random() - 0.5) * 20, __r: it.r,
  }))
  forceSimulation(t1nodes)
    .force('x', forceX((d, i) => xForDate(items[i])).strength(0.82))
    .force('y', forceY(midY).strength(0.06))
    .force('collide', forceCollide((d) => d.__r + 1.4).strength(0.9).iterations(4))
    .stop().tick(SIM_TICKS)
  const t1 = t1nodes.map(({ x, y }) => ({ x, y }))

  // ── step 2: cluster columns ───────────────────────────────────────────────
  const colW  = (W - 2 * pad) / 8
  const t2nodes = items.map((it) => ({
    x: pad + (it.clusterId + 0.5) * colW + (Math.random() - 0.5) * 12,
    y: midY + (Math.random() - 0.5) * 40,
    __r: it.r,
  }))
  forceSimulation(t2nodes)
    .force('x', forceX((d, i) => pad + (items[i].clusterId + 0.5) * colW).strength(0.32))
    .force('y', forceY(midY).strength(0.08))
    .force('collide', forceCollide((d) => d.__r + 1.4).strength(0.88).iterations(3))
    .stop().tick(SIM_TICKS)
  const t2 = t2nodes.map(({ x, y }) => ({ x, y }))

  // ── step 3: energy rank ───────────────────────────────────────────────────
  const ranked   = items.map((it, i) => ({ i, e: it.styleEnergy })).sort((a, b) => a.e - b.e)
  const xByIdx   = new Float32Array(items.length)
  ranked.forEach(({ i }, rank) => {
    xByIdx[i] = pad + (rank / (items.length - 1)) * (W - 2 * pad)
  })
  const t3nodes = items.map((it, i) => ({
    x: xByIdx[i], y: midY + (Math.random() - 0.5) * 20, __r: it.r,
  }))
  forceSimulation(t3nodes)
    .force('x', forceX((d, i) => xByIdx[i]).strength(0.78))
    .force('y', forceY(midY).strength(0.05))
    .force('collide', forceCollide((d) => d.__r + 1.4).strength(0.9).iterations(4))
    .stop().tick(SIM_TICKS)
  const t3 = t3nodes.map(({ x, y }) => ({ x, y }))

  return [t0, t1, t2, t3]
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ChromaticSwarm() {
  const panelRef  = useRef(null)
  const canvasRef = useRef(null)
  const engRef    = useRef(null)
  const rafRef    = useRef(null)

  const [step, setStep]                   = useState(0)
  const [hoveredItem, setHoveredItem]     = useState(null)
  const [mousePos, setMousePos]           = useState({ x: 0, y: 0 })
  const [selectedItem, setSelectedItem]   = useState(null)

  const items = useMemo(() =>
    assignment2Data.clusterGroups.flatMap((group) =>
      group.images.map((img) => ({
        ...img,
        clusterId:    group.clusterId,
        primaryColor: img.dominant[0]?.hex ?? '#94a3b8',
        r:            circleR(img.styleEnergy),
      }))
    ),
  [])

  // ── canvas init + render loop ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = canvas?.parentElement
    if (!canvas || !wrap) return

    const dpr = window.devicePixelRatio || 1
    const W   = wrap.clientWidth  || window.innerWidth
    const H   = wrap.clientHeight || Math.round(window.innerHeight * 0.72)

    canvas.width       = W * dpr
    canvas.height      = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const targets = computeAllTargets(items, W, H)
    const cur     = targets[0].map(({ x, y }) => ({ x, y }))

    engRef.current = { items, targets, cur, step: 0, W, H, ctx }

    const draw = () => {
      const eng = engRef.current
      if (!eng) return

      const { items, targets, cur, step: s, W, H, ctx } = eng
      const tgt = targets[s]

      for (let i = 0; i < cur.length; i++) {
        cur[i].x += (tgt[i].x - cur[i].x) * LERP
        cur[i].y += (tgt[i].y - cur[i].y) * LERP
      }

      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < items.length; i++) {
        const { x, y } = cur[i]
        ctx.beginPath()
        ctx.arc(x, y, items[i].r, 0, Math.PI * 2)
        ctx.fillStyle   = items[i].primaryColor
        ctx.globalAlpha = 0.78
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Cluster column labels (step 2)
      if (s === 2) {
        const pad  = 56
        const colW = (W - 2 * pad) / 8
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.font = '600 10px system-ui,sans-serif'
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle   = CLUSTER_COLOURS[c]
          ctx.globalAlpha = 0.72
          ctx.fillText(`C${c}`, pad + (c + 0.5) * colW, 14)
        }
        ctx.globalAlpha = 1
      }

      // Year axis (step 1)
      if (s === 1) {
        const pad  = 56
        const tMin = new Date('2004-04-25').getTime()
        const tMax = new Date('2024-12-31').getTime()
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.font      = '10px system-ui,sans-serif'
        for (const yr of ['2004','2008','2012','2016','2020','2024']) {
          const x = pad + ((new Date(`${yr}-01-01`).getTime() - tMin) / (tMax - tMin)) * (W - 2 * pad)
          ctx.fillStyle   = 'rgba(29,35,41,0.22)'
          ctx.globalAlpha = 0.7
          ctx.fillRect(x, H * 0.12, 1, H * 0.76)
          ctx.fillStyle = 'rgba(29,35,41,0.38)'
          ctx.fillText(yr, x, H * 0.88 + 4)
        }
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      engRef.current = null
    }
  }, [items])

  // ── ScrollTrigger pin ─────────────────────────────────────────────────────
  useGSAP(() => {
    const panel = panelRef.current
    if (!panel) return

    const st = ScrollTrigger.create({
      trigger:    panel,
      start:      'top top',
      end:        () => `+=${STEPS.length * window.innerHeight}`,
      pin:        true,
      pinSpacing: true,
      onUpdate:   (self) => {
        const newStep = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
        if (engRef.current && engRef.current.step !== newStep) {
          engRef.current.step = newStep
          setStep(newStep)
        }
      },
    })

    return () => st.kill()
  }, { dependencies: [], revertOnUpdate: true })

  // ── hover detection ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    const eng    = engRef.current
    if (!canvas || !eng) return

    const rect = canvas.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top
    const { items, cur } = eng

    let found = null
    for (let i = items.length - 1; i >= 0; i--) {
      const dx = mx - cur[i].x, dy = my - cur[i].y
      if (dx * dx + dy * dy <= (items[i].r + 1) * (items[i].r + 1) * 1.5) {
        found = items[i]; break
      }
    }
    setHoveredItem(found)
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <section
      ref={panelRef}
      className="assignment2-panel overflow-hidden rounded-[1.6rem] border border-slate-300/70 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)]"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--archive-color-bg, #f7f4ed)' }}
    >
      {/* Header */}
      <div className="border-b border-slate-300/60 px-5 py-4 md:px-7" style={{ flexShrink: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-data text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">Scroll-Driven Beeswarm</p>
            <h3 className="font-title text-[clamp(1.45rem,2vw,2rem)] leading-tight text-slate-950">
              The corpus as circles
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each circle is one photograph — radius encodes style energy, colour the dominant hue. Scroll through four arrangements to read the archive differently.
          </p>
        </div>
      </div>

      {/* Step label */}
      <div
        style={{
          padding: '0.9rem 2rem 0.75rem',
          borderBottom: '1px solid rgba(29,35,41,0.07)',
          flexShrink: 0,
          background: 'rgba(247,246,241,0.72)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.3rem' }}>
          <p style={{ margin: 0, font: '600 0.67rem/1 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Step {step + 1} / {STEPS.length}
          </p>
          <span style={{ display: 'flex', gap: '0.3rem' }}>
            {STEPS.map((s, i) => (
              <span key={s.key} style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: i === step ? 'var(--archive-color-ink)' : 'rgba(29,35,41,0.2)',
                transition: 'background 0.35s',
              }} />
            ))}
          </span>
          {step < STEPS.length - 1 && (
            <span style={{ marginLeft: 'auto', font: '0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(29,35,41,0.32)' }}>
              Scroll to advance ↓
            </span>
          )}
          {step === STEPS.length - 1 && (
            <span style={{ marginLeft: 'auto', font: '0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(29,35,41,0.32)' }}>
              Scroll to continue ↓
            </span>
          )}
        </div>
        <h4 style={{ margin: '0 0 0.22rem', font: '500 1.22rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)', transition: 'opacity 0.3s' }}>
          {STEPS[step].title}
        </h4>
        <p style={{ margin: 0, font: '0.85rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)', maxWidth: '58ch' }}>
          {STEPS[step].desc}
        </p>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', cursor: hoveredItem ? 'pointer' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => hoveredItem && setSelectedItem((prev) =>
            prev?.filename === hoveredItem.filename ? null : hoveredItem
          )}
        />
      </div>

      {/* Hover tooltip — fixed so it escapes overflow:hidden */}
      {hoveredItem && (
        <div style={{
          position: 'fixed',
          left: Math.min(mousePos.x + 14, window.innerWidth - 222),
          top:  Math.max(10, mousePos.y - 185),
          width: 200, borderRadius: '0.85rem',
          border: '1px solid rgba(203,213,225,0.9)',
          background: 'rgba(255,252,246,0.97)',
          boxShadow: '0 20px 50px -14px rgba(15,23,42,0.48)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden', pointerEvents: 'none', zIndex: 9999,
        }}>
          <img src={imageUrl(hoveredItem.filename)} alt="" onError={(e) => { e.target.style.display = 'none' }}
            style={{ display: 'block', width: '100%', height: 108, objectFit: 'cover' }} />
          <div style={{ padding: '0.6rem 0.85rem 0.72rem' }}>
            <div style={{ height: 3, borderRadius: 999, background: hoveredItem.primaryColor, marginBottom: '0.42rem' }} />
            <p style={{ margin: '0 0 0.18rem', font: '500 0.77rem/1.3 var(--archive-font-ui)', color: '#1d2329', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hoveredItem.filename}
            </p>
            <p style={{ margin: 0, font: '0.7rem/1.3 var(--archive-font-ui)', color: '#7a8898' }}>
              Cluster {hoveredItem.clusterId} · Energy {hoveredItem.styleEnergy}
              {hoveredItem.date ? ` · ${hoveredItem.date.slice(0, 7)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Selected item strip */}
      {selectedItem && (
        <div style={{
          borderTop: '1px solid rgba(29,35,41,0.08)', padding: '0.85rem 1.5rem',
          display: 'flex', gap: '1rem', alignItems: 'center',
          background: 'rgba(247,246,241,0.72)', backdropFilter: 'blur(4px)',
          flexShrink: 0,
        }}>
          <img src={imageUrl(selectedItem.filename)} alt="" onError={(e) => { e.target.style.display = 'none' }}
            style={{ width: 72, height: 58, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 0.18rem', font: '500 0.85rem/1.3 var(--archive-font-ui)', color: '#1d2329', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedItem.filename}
            </p>
            <p style={{ margin: '0 0 0.4rem', font: '0.73rem/1.4 var(--archive-font-ui)', color: '#7a8898' }}>
              Cluster {selectedItem.clusterId}
              {selectedItem.date ? ` · ${selectedItem.date}` : ''}
              {selectedItem.place ? ` · ${selectedItem.place}` : ''}
              {` · Energy ${selectedItem.styleEnergy}`}
            </p>
            <div style={{ display: 'flex', gap: '0.32rem' }}>
              {selectedItem.dominant?.map((c) => (
                <span key={c.hex} style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, border: '1.5px solid rgba(255,255,255,0.8)', flexShrink: 0 }} />
              ))}
            </div>
          </div>
          <button onClick={() => setSelectedItem(null)}
            style={{ flexShrink: 0, background: 'none', border: '1px solid rgba(29,35,41,0.15)', borderRadius: '0.42rem', padding: '0.35rem 0.7rem', font: '0.72rem/1 var(--archive-font-ui)', color: '#7a8898', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}
    </section>
  )
}
