import { useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'
import { assignment2Data } from '../data/assignment2Data'
import { photographUrl } from '../lib/photographs'

const SORT_MODES = [
  { key: 'cluster', label: 'Cluster' },
  { key: 'hue', label: 'Hue' },
  { key: 'brightness', label: 'Brightness' },
  { key: 'energy', label: 'Energy' },
  { key: 'constellation', label: 'Constellation' },
]

const PENTATONIC = [220.0, 246.94, 277.18, 329.63, 369.99, 440.0, 493.88, 554.37, 659.25]

const imageUrl = photographUrl
const TOOLTIP_WIDTH = 288
const TOOLTIP_HEIGHT = 220
const TOOLTIP_GAP = 18
const TOOLTIP_MARGIN = 12

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

function tooltipPointFromEvent(event, container) {
  const rect = event.currentTarget.getBoundingClientRect()
  const cursorX = event.clientX ?? rect.left + rect.width / 2
  const cursorY = event.clientY ?? rect.top + rect.height / 2
  const containerRect = container?.getBoundingClientRect()
  const bounds = containerRect ?? {
    left: 0,
    top: 0,
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
  const localX = cursorX - bounds.left
  const localY = cursorY - bounds.top

  const opensLeft = localX + TOOLTIP_GAP + TOOLTIP_WIDTH > bounds.width - TOOLTIP_MARGIN
  const opensDown = localY - TOOLTIP_HEIGHT - TOOLTIP_GAP < TOOLTIP_MARGIN
  const left = opensLeft ? localX - TOOLTIP_WIDTH - TOOLTIP_GAP : localX + TOOLTIP_GAP
  const top = opensDown ? localY + TOOLTIP_GAP : localY - TOOLTIP_HEIGHT - TOOLTIP_GAP

  return {
    x: clamp(left, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, bounds.width - TOOLTIP_WIDTH - TOOLTIP_MARGIN)),
    y: clamp(top, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, bounds.height - TOOLTIP_HEIGHT - TOOLTIP_MARGIN)),
  }
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const mx = Math.max(rn, gn, bn)
  const mn = Math.min(rn, gn, bn)
  const l = (mx + mn) / 2

  if (mx === mn) {
    return [0, 0, l]
  }

  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  let h

  switch (mx) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0)
      break
    case gn:
      h = (bn - rn) / d + 2
      break
    default:
      h = (rn - gn) / d + 4
      break
  }

  return [h / 6, s, l]
}

function clipText(text, length) {
  if (!text) {
    return ''
  }

  return text.length > length ? `${text.slice(0, length)}...` : text
}

function stripeHeight(item) {
  return Math.max(12, Math.round(22 + item.styleEnergy * 96))
}

function audioValues(item) {
  const brightness = Number.isFinite(item.brightness) ? item.brightness : Math.round(item.lightness * 255)
  const energy = Number.isFinite(item.styleEnergy) ? item.styleEnergy : 0.35
  const saturation = Number.isFinite(item.saturation) ? item.saturation : 0.35
  const hue = Number.isFinite(item.hue) ? item.hue : 0

  return { brightness, energy, saturation, hue }
}

function useAudioEngine() {
  const synthRef = useRef(null)
  const filterRef = useRef(null)
  const gainRef = useRef(null)
  const startedRef = useRef(false)

  const ensureEngine = () => {
    if (typeof window === 'undefined') {
      return null
    }

    if (!synthRef.current) {
      gainRef.current = new Tone.Gain(0.22).toDestination()
      filterRef.current = new Tone.Filter({
        frequency: 1800,
        type: 'lowpass',
        rolloff: -12,
        Q: 1.2,
      }).connect(gainRef.current)
      synthRef.current = new Tone.PolySynth(Tone.FMSynth, {
        maxPolyphony: 5,
        options: {
          harmonicity: 1.4,
          modulationIndex: 8,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.008,
            decay: 0.18,
            sustain: 0.03,
            release: 0.12,
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.12,
            sustain: 0,
            release: 0.08,
          },
        },
      }).connect(filterRef.current)
    }

    return synthRef.current
  }

  const primeAudio = async () => {
    ensureEngine()
    if (Tone.getContext().state !== 'running') {
      try {
        await Tone.start()
      } catch {
        return false
      }
    }
    startedRef.current = true
    return true
  }

  const playStripe = async (item) => {
    const synth = ensureEngine()
    if (!synth || !filterRef.current) {
      return
    }

    if (!startedRef.current || Tone.getContext().state !== 'running') {
      const started = await primeAudio()
      if (!started) {
        return
      }
    }

    const { brightness, energy, saturation, hue } = audioValues(item)
    const note = PENTATONIC[Math.min(PENTATONIC.length - 1, Math.round(hue * (PENTATONIC.length - 1)))]
    const now = Tone.now()
    const velocity = clamp(0.16 + saturation * 0.48, 0.16, 0.58)
    const duration = 0.08 + energy * 0.18

    filterRef.current.frequency.rampTo(700 + brightness * 12, 0.015)
    synth.set({
      modulationIndex: 5 + energy * 28,
      harmonicity: 1 + (item.clusterId % 5) * 0.22,
      oscillator: { type: saturation > 0.45 ? 'triangle' : 'sine' },
    })
    synth.triggerAttackRelease(note, duration, now, velocity)
  }

  useEffect(() => () => {
    synthRef.current?.dispose()
    filterRef.current?.dispose()
    gainRef.current?.dispose()
    synthRef.current = null
    filterRef.current = null
    gainRef.current = null
  }, [])

  return { playStripe, primeAudio }
}

export default function AssignmentTwoSonification() {
  const [sortMode, setSortMode] = useState('cluster')
  const [hoveredItem, setHoveredItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const hoverTimerRef = useRef(null)
  const gridWrapRef = useRef(null)
  const { playStripe, primeAudio } = useAudioEngine()

  const items = useMemo(() => {
    const flattened = assignment2Data.clusterGroups.flatMap((group) =>
      group.images.map((image) => ({
        ...image,
        clusterId: group.clusterId,
        primaryColor: image.dominant[0] ?? { hex: '#94a3b8' },
      })),
    )

    return flattened.map((item) => {
      const [hue, saturation, lightness] = hexToHsl(item.primaryColor.hex)
      return { ...item, hue, saturation, lightness }
    })
  }, [])

  const sortedItems = useMemo(() => {
    const next = [...items]

    switch (sortMode) {
      case 'cluster':
        next.sort((a, b) => a.clusterId - b.clusterId || a.hue - b.hue)
        break
      case 'hue':
        next.sort((a, b) => a.hue - b.hue || a.lightness - b.lightness)
        break
      case 'brightness':
        next.sort((a, b) => a.brightness - b.brightness)
        break
      case 'energy':
        next.sort((a, b) => b.styleEnergy - a.styleEnergy)
        break
      case 'constellation': {
        const grouped = new Map()
        next.forEach((item) => {
          if (!grouped.has(item.clusterId)) {
            grouped.set(item.clusterId, [])
          }
          grouped.get(item.clusterId).push(item)
        })
        grouped.forEach((group) => group.sort((a, b) => a.styleEnergy - b.styleEnergy))
        const columns = Array.from(grouped.values())
        const maxLength = Math.max(...columns.map((group) => group.length))
        const woven = []
        for (let index = 0; index < maxLength; index += 1) {
          columns.forEach((group) => {
            if (group[index]) {
              woven.push(group[index])
            }
          })
        }
        return woven
      }
      default:
        break
    }

    return next
  }, [items, sortMode])

  useEffect(() => () => clearTimeout(hoverTimerRef.current), [])

  const handleEnter = (item, event) => {
    setHoveredItem(item)
    setTooltipPosition(tooltipPointFromEvent(event, gridWrapRef.current))
    clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      playStripe(item)
    }, 35)
  }

  const handleMove = (event) => {
    setTooltipPosition(tooltipPointFromEvent(event, gridWrapRef.current))
  }

  const handleLeave = () => {
    setHoveredItem(null)
  }

  return (
    <section
      className="assignment2-panel overflow-hidden rounded-[1.6rem] border border-slate-300/70 bg-white/72 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm"
      onPointerDown={primeAudio}
      onKeyDown={primeAudio}
    >
      <div className="assignment2-fugue-controls border-b border-slate-300/60 px-5 py-4 md:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-data text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">Data Vis + Sonification</p>
            <h3 className="font-title text-[clamp(1.45rem,2vw,2rem)] leading-tight text-slate-950">
              Chromatic fugue for the photograph corpus
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each stripe is one photograph. Colour comes from the dominant palette, height from style energy, and hovering triggers a short tone shaped by hue, brightness, and cluster.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="font-data text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">Sort</span>
          {SORT_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setSortMode(mode.key)}
              className={`assignment2-sort-btn ${sortMode === mode.key ? 'is-active' : ''}`}
            >
              {mode.label}
            </button>
          ))}
          <span className="ml-auto text-[0.72rem] text-slate-500">
            width = saturation, height = style energy, color = dominant palette
          </span>
        </div>
      </div>

      <div className="assignment2-fugue-layout grid gap-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div ref={gridWrapRef} className="assignment2-fugue-grid-wrap relative p-4 md:p-6">
          <div className="assignment2-fugue-grid">
            {sortedItems.map((item) => (
              <button
                key={item.filename}
                type="button"
                className={`assignment2-stripe ${selectedItem?.filename === item.filename ? 'is-selected' : ''}`}
                style={{
                  height: `${stripeHeight(item)}px`,
                  width: `${Math.max(5, Math.round(7 + item.saturation * 15))}px`,
                }}
                onMouseEnter={(event) => handleEnter(item, event)}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                onPointerDown={primeAudio}
                onFocus={(event) => handleEnter(item, event)}
                onBlur={handleLeave}
                onClick={() => {
                  primeAudio()
                  setSelectedItem(item)
                  playStripe(item)
                }}
                aria-label={`Open detail for ${item.filename}`}
              >
                <span
                  className="assignment2-stripe-bar"
                  style={{ backgroundColor: item.primaryColor.hex }}
                />
              </button>
            ))}
          </div>

          {hoveredItem && (
            <div
              className="assignment2-fugue-tooltip"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
              }}
            >
              <img src={imageUrl(hoveredItem.filename)} alt={hoveredItem.filename} className="h-28 w-full object-cover" />
              <div className="space-y-2 p-3">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: hoveredItem.primaryColor.hex }} />
                <p className="font-title text-base leading-tight text-slate-950">{clipText(hoveredItem.filename, 30)}</p>
                <p className="text-xs text-slate-600">Cluster {hoveredItem.clusterId} · Energy {hoveredItem.styleEnergy} · Brightness {audioValues(hoveredItem).brightness}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="assignment2-fugue-panel border-t border-slate-300/60 bg-[rgba(247,246,241,0.62)] p-5 xl:border-l xl:border-t-0">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-data text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">Selected Photograph</p>
                  <h4 className="mt-1 font-title text-[1.5rem] leading-tight text-slate-950">{selectedItem.filename}</h4>
                </div>
                <div className="rounded-full border border-slate-300/80 bg-white/80 px-2.5 py-1 text-xs text-slate-600">
                  Cluster {selectedItem.clusterId}
                </div>
              </div>

              <img src={imageUrl(selectedItem.filename)} alt={selectedItem.filename} className="aspect-[4/3] w-full rounded-[1rem] object-cover" />

              <div className="flex flex-wrap gap-2">
                {selectedItem.dominant.map((colour) => (
                  <span
                    key={`${selectedItem.filename}-${colour.hex}`}
                    className="h-7 w-7 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: colour.hex }}
                    title={colour.hex}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-300/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                  <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">Dimensions</p>
                  <p className="mt-1">{selectedItem.width} × {selectedItem.height}</p>
                </div>
                <div>
                  <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">Aspect Ratio</p>
                  <p className="mt-1">{selectedItem.aspectRatio}</p>
                </div>
                <div>
                  <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">Style Energy</p>
                  <p className="mt-1">{selectedItem.styleEnergy}</p>
                </div>
                <div>
                  <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">Brightness</p>
                  <p className="mt-1">{selectedItem.brightness}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-data text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">Detail Panel</p>
              <h4 className="font-title text-[1.4rem] leading-tight text-slate-950">Listen through the stripes</h4>
              <p className="text-sm leading-6 text-slate-600">
                Hover to hear a short tone and click any stripe to pin a photograph here. This section adapts the chromatic-fugue idea to your own corpus rather than the artwork dataset from the reference project.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
