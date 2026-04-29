import { useEffect, useId, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { photographUrl } from '../lib/photographs'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

const imageUrl = photographUrl

const DISPLAY_MODES = [
  { id: 'count', label: 'Absolute Count (n)', showFreq: false },
  { id: 'frequency', label: 'Frequency (%)', showFreq: true },
]

function prettyLabel(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Color scale: cream → amber → teal → deep navy ─────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function cellColor(count, maxCount) {
  // More elegant, almost-invisible empty state
  if (count === 0) return { bg: 'rgba(29,35,41,0.02)', text: 'rgba(29,35,41,0.2)' }
  const t = Math.pow(count / maxCount, 0.55)

  let r, g, b
  if (t < 0.33) {
    const s = t / 0.33
    r = lerp(248, 241, s); g = lerp(238, 168, s); b = lerp(210, 82, s)
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    r = lerp(241, 48, s); g = lerp(168, 148, s); b = lerp(82, 164, s)
  } else {
    const s = (t - 0.66) / 0.34
    r = lerp(48, 16, s); g = lerp(148, 52, s); b = lerp(164, 98, s)
  }

  // WCAG relative luminance for adaptive text
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    bg:   `rgb(${r},${g},${b})`,
    text: lum > 0.48 ? 'rgba(29,35,41,0.9)' : '#fff',
  }
}

function freqLabel(share) {
  if (share <= 0)  return ''
  if (share < 1)   return '<1%'
  if (share < 10)  return `${share.toFixed(1)}%`
  return `${Math.round(share)}%`
}

function legendValueLabel(value, showFreq) {
  if (value <= 0) return '0'
  if (showFreq) return freqLabel(value)
  return Math.max(1, Math.round(value)).toLocaleString()
}

export default function PlaceSubjectAtlas({ atlas }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [activeKey, setActiveKey] = useState(null)
  const [showFreq, setShowFreq]   = useState(false)
  const rootRef = useRef(null)
  const matrixRef = useRef(null)
  const legendRef = useRef(null)
  const displayTabRefs = useRef([])
  const displayTabsId = useId()
  const hasModeAnimatedRef = useRef(false)

  const visibleSubjects = atlas.subjects
  const filteredCells   = atlas.cells

  const maxVal = useMemo(
    () => showFreq
      ? Math.max(...filteredCells.map((c) => c.share), 1)
      : Math.max(...filteredCells.map((c) => c.count), 1),
    [filteredCells, showFreq],
  )

  const activeCell = atlas.cells.find((c) => `${c.place}::${c.subject}::${c.source}` === activeKey) ?? null
  const colCount = visibleSubjects.length
  const activeDisplayIndex = showFreq ? 1 : 0
  const legendStops = useMemo(() => {
    const high = maxVal
    const mid = maxVal * 0.5
    const low = showFreq ? Math.max(maxVal * 0.15, 0.1) : 1

    return [
      { id: 'empty', label: 'None', color: cellColor(0, maxVal).bg },
      { id: 'low', label: `Low ${legendValueLabel(low, showFreq)}`, color: cellColor(low, maxVal).bg },
      { id: 'mid', label: `Mid ${legendValueLabel(mid, showFreq)}`, color: cellColor(mid, maxVal).bg },
      { id: 'high', label: `High ${legendValueLabel(high, showFreq)}`, color: cellColor(high, maxVal).bg },
    ]
  }, [maxVal, showFreq])

  function selectDisplayMode(index, shouldFocus = false) {
    const nextMode = DISPLAY_MODES[index]
    if (!nextMode) return

    setShowFreq(nextMode.showFreq)
    if (shouldFocus) {
      window.requestAnimationFrame(() => displayTabRefs.current[index]?.focus())
    }
  }

  function handleDisplayKeyDown(event, index) {
    const lastIndex = DISPLAY_MODES.length - 1
    let nextIndex = index

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index === lastIndex ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index === 0 ? lastIndex : index - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = lastIndex
    else return

    event.preventDefault()
    selectDisplayMode(nextIndex, true)
  }

  useEffect(() => {
    const root = rootRef.current
    const matrix = matrixRef.current
    if (!root || !matrix) return undefined

    const cells = matrix.querySelectorAll('[data-atlas-cell]')
    const legend = legendRef.current

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      gsap.set([legend, cells], { clearProps: 'all' })
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (legend) {
        timeline.fromTo(
          legend,
          { autoAlpha: 0, y: -4 },
          { autoAlpha: 1, y: 0, duration: 0.18 },
          0
        )
      }
      timeline.fromTo(
        cells,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.16,
          stagger: { each: 0.0015, from: 'start' },
          overwrite: 'auto',
        },
        legend ? 0.04 : 0
      )
      observer.disconnect()
    }, { threshold: 0.18 })

    observer.observe(root)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  useEffect(() => {
    const matrix = matrixRef.current
    if (!matrix) return

    if (!hasModeAnimatedRef.current) {
      hasModeAnimatedRef.current = true
      return
    }

    if (prefersReducedMotion) return

    const populatedCells = matrix.querySelectorAll('[data-atlas-cell="populated"]')
    gsap.fromTo(
      populatedCells,
      { autoAlpha: 0.86 },
      {
        autoAlpha: 1,
        duration: 0.16,
        ease: 'power2.out',
        stagger: { each: 0.001, from: 'center' },
        overwrite: 'auto',
      }
    )
  }, [prefersReducedMotion, showFreq])

  return (
    <article ref={rootRef} style={{
      display: 'grid', gap: '2rem', padding: '2.5rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: 'var(--radius-soft, 8px)',
      background: 'var(--archive-color-bg)', // Relying on the clean parchment bg
      boxShadow: '0 4px 30px -15px rgba(0,0,0,0.06)', // Very modest grounding shadow
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid var(--archive-color-rule)', paddingBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: '0 0 0.75rem', font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--archive-color-accent)' }}>
            Figure 1. Place × Subject Matrix
          </p>
          <h3 style={{ margin: 0, font: '500 1.85rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)', maxWidth: '40rem' }}>
            Heat signatures revealing which locations are visually remembered through specific subjects.
          </h3>
        </div>
        
        {/* Modest Top-Right Detail Readout */}
        {activeCell && (
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <p style={{ margin: '0 0 0.2rem', font: '600 1.1rem/1 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-ink)' }}>
              {prettyLabel(activeCell.subject)}
            </p>
            <p style={{ margin: 0, font: '400 0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
              n = {activeCell.count} <br/> {activeCell.place}
            </p>
          </div>
        )}
      </header>

      {/* ── Controls ───────────────────────────────────── */}
      <div className="atlas-display-tabs" data-orientation="horizontal">
        <span id={`${displayTabsId}-label`} className="atlas-display-tabs__caption">
          Display
        </span>
        <div className="atlas-display-tabs__list-container">
          <div
            aria-labelledby={`${displayTabsId}-label`}
            className="atlas-display-tabs__list"
            data-orientation="horizontal"
            role="tablist"
            style={{ '--atlas-active-tab-index': activeDisplayIndex }}
          >
            <span aria-hidden="true" className="atlas-display-tabs__indicator" />
            {DISPLAY_MODES.map((mode, index) => {
              const active = showFreq === mode.showFreq

              return (
                <button
                  aria-controls={`${displayTabsId}-panel`}
                  aria-selected={active}
                  className="atlas-display-tabs__tab"
                  data-selected={active}
                  id={`${displayTabsId}-${mode.id}-tab`}
                  key={mode.id}
                  onClick={() => selectDisplayMode(index)}
                  onKeyDown={(event) => handleDisplayKeyDown(event, index)}
                  ref={(node) => { displayTabRefs.current[index] = node }}
                  role="tab"
                  tabIndex={active ? 0 : -1}
                  type="button"
                >
                  {index > 0 && <span aria-hidden="true" className="atlas-display-tabs__separator" />}
                  <span className="atlas-display-tabs__label">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grid + Detail Panel ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(16rem,20rem)', gap: '2.5rem', alignItems: 'start' }}>

        {/* Scrollable grid */}
        <div
          aria-labelledby={`${displayTabsId}-${DISPLAY_MODES[activeDisplayIndex].id}-tab`}
          id={`${displayTabsId}-panel`}
          role="tabpanel"
          style={{ display: 'grid', gap: '0.75rem', minWidth: 0 }}
        >
          <div
            aria-label={`Heatmap colour legend for ${showFreq ? 'frequency percentage' : 'absolute count'}`}
            ref={legendRef}
            style={{
              justifySelf: 'end',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              maxWidth: '100%',
              padding: '0.35rem 0.55rem',
              border: '1px solid var(--archive-color-rule)',
              background: 'rgba(255,255,255,0.42)',
              font: '500 0.68rem/1 var(--archive-font-ui)',
              color: 'var(--archive-color-muted)',
              overflowX: 'auto',
            }}
          >
            <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Colour
            </span>
            {legendStops.map((stop) => (
              <span
                key={stop.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '0.8rem',
                    height: '0.8rem',
                    border: '1px solid rgba(29,35,41,0.12)',
                    background: stop.color,
                  }}
                />
                {stop.label}
              </span>
            ))}
          </div>

          <div
            className="custom-scrollbar"
            style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}
          >
          <div ref={matrixRef} style={{
            display: 'grid',
            gap: '1px', // Crisp matrix lines
            alignItems: 'stretch',
            minWidth: `${12 + colCount * 2.8}rem`,
            gridTemplateColumns: `12rem repeat(${colCount}, minmax(2.8rem, 1fr))`,
            background: 'var(--archive-color-rule)', // Acts as the border color between cells
            border: '1px solid var(--archive-color-rule)',
          }}>

            {/* Column headers (rotated) */}
            <div style={{ background: 'var(--archive-color-bg)', display: 'flex', alignItems: 'flex-end', padding: '0.5rem 0.75rem', font: '600 0.7rem/1.2 var(--archive-font-ui)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
              Location Origin
            </div>
            {visibleSubjects.map((s) => (
              <div
                key={`${s.source}:${s.subject}`}
                title={`${prettyLabel(s.subject)} (${s.source})`}
                style={{
                  background: 'var(--archive-color-bg)',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  height: '8.5rem',
                  padding: '0.5rem 0',
                  textAlign: 'left',
                  overflow: 'hidden',
                  font: '400 0.75rem/1.2 var(--archive-font-ui)',
                  letterSpacing: '0.02em',
                  color: s.source === 'yolo' ? 'var(--archive-color-accent)' : 'var(--archive-color-copy)',
                }}
              >
                {prettyLabel(s.subject)}
              </div>
            ))}

            {/* Rows */}
            {atlas.places.map((place) => (
              <div key={place.place} style={{ display: 'contents' }}>

                {/* Place label + total */}
                <div style={{
                  background: 'var(--archive-color-bg)',
                  display: 'flex', justifyContent: 'space-between', gap: '1rem',
                  alignItems: 'center', padding: '0 0.75rem',
                  whiteSpace: 'nowrap',
                  font: '400 0.85rem/1.2 "Aptos", "Segoe UI", sans-serif',
                  color: 'var(--archive-color-ink)',
                }}>
                  <span>{place.place}</span>
                  <span style={{ font: '400 0.7rem var(--archive-font-data)', color: 'var(--archive-color-muted)' }}>{place.total}</span>
                </div>

                {/* Cells */}
                {visibleSubjects.map((subject) => {
                  const cell = atlas.cells.find(
                    (c) => c.place === place.place && c.subject === subject.subject && c.source === subject.source
                  )
                  const count = cell?.count ?? 0
                  const share = cell?.share ?? 0
                  const val   = showFreq ? share : count
                  const { bg, text } = cellColor(val, maxVal)
                  const cellKey = cell ? `${cell.place}::${cell.subject}::${cell.source}` : null
                  const label   = showFreq ? freqLabel(share) : (count > 0 ? count : '')
                  
                  const isActive = activeKey === cellKey && cellKey !== null;

                  return (
                    <button
                      key={`${subject.source}:${subject.subject}`}
                      type="button"
                      data-atlas-cell={count > 0 ? 'populated' : 'empty'}
                      style={{
                        position: 'relative',
                        display: 'grid',
                        placeItems: 'center',
                        minHeight: '2.8rem',
                        border: 0,
                        background: bg,
                        color: text,
                        font: `400 0.75rem/1 var(--archive-font-data)`, // Use monospace for numbers
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'box-shadow 150ms ease, opacity 150ms ease',
                        boxShadow: isActive ? 'inset 0 0 0 2px var(--archive-color-ink)' : 'none',
                        opacity: (activeKey && !isActive && count > 0) ? 0.6 : 1, // Dim others when one is selected
                      }}
                      aria-label={`${place.place}, ${prettyLabel(subject.subject)}, ${count} photographs (${share}%)`}
                      onClick={() => { if (cellKey) setActiveKey((prev) => prev === cellKey ? null : cellKey) }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Marginalia Detail Panel */}
        <aside style={{
          display: 'grid', gap: '1.25rem', padding: '0',
          alignContent: 'start',
        }}>
          {activeCell ? (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1rem',
              paddingTop: '1rem',
              borderTop: '3px solid var(--archive-color-accent)', // Strong academic framing
            }}>
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                <p style={{ margin: 0, font: '600 0.65rem/1.2 var(--archive-font-ui)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  Selected Node Data
                </p>
                <p style={{ margin: 0, font: '400 1rem/1.4 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-copy)' }}>
                  The subject <strong>{prettyLabel(activeCell.subject)}</strong> ({activeCell.source === 'yolo' ? 'YOLO' : 'Gemma'}) appears in <strong>{activeCell.count}</strong> photograph{activeCell.count !== 1 ? 's' : ''} from <em>{activeCell.place}</em>.
                  {activeCell.share > 0 && ` This accounts for ${activeCell.share}% of the location's total documentation.`}
                </p>
              </div>

              {activeCell.exampleFilenames?.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: activeCell.exampleFilenames.length === 1 ? '1fr' : '1fr 1fr',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {activeCell.exampleFilenames.map((filename) => (
                    <figure key={filename} style={{ margin: 0, aspectRatio: '4/3', background: 'rgba(29,35,41,0.04)', border: '1px solid var(--archive-color-rule)', padding: '0.25rem' }}>
                      <img
                        src={imageUrl(filename)}
                        alt={filename}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(20%) contrast(1.05)' }}
                      />
                    </figure>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--archive-color-rule)',
            }}>
              <p style={{ margin: 0, font: '400 0.9rem/1.5 "Aptos", "Segoe UI", sans-serif', color: 'var(--archive-color-muted)' }}>
                Select a populated cell in the matrix to view specific archival examples and distribution metrics.
              </p>
            </div>
          )}
        </aside>

      </div>
    </article>
  )
}
