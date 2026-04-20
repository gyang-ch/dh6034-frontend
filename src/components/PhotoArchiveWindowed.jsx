import { useEffect, useMemo, useRef, useState } from 'react'
import { List, useListRef } from 'react-window'
import Lightbox from 'yet-another-react-lightbox'
import Inline from 'yet-another-react-lightbox/plugins/inline'
import 'yet-another-react-lightbox/styles.css'
import { galleryData } from '../data/galleryData'
import { photoNearestNeighbours } from '../data/photoNearestNeighbours'
import { photographFullUrl, photographThumbnailUrl } from '../lib/photographs'

const YEAR_ROW_HEIGHT = 46
const PHOTO_ROW_HEIGHT = 72

function fmtCoord(lat, lng) {
  if (lat == null || lng == null) return null
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

function aspectLabel(ratio) {
  if (ratio > 1.05) return 'Landscape'
  if (ratio < 0.95) return 'Portrait'
  return 'Square'
}

function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return undefined

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

function ExplorerRow({ ariaAttributes, index, style, rows, selectedFilename, onToggleYear, onSelectPhoto }) {
  const row = rows[index]

  if (row.type === 'year') {
    return (
      <div style={style}>
        <button
          type="button"
          {...ariaAttributes}
          onClick={() => onToggleYear(row.year)}
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            border: 'none',
            borderBottom: '1px solid var(--archive-color-rule)',
            background: 'rgba(247,244,237,0.96)',
            padding: '0 1rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                transform: row.isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 180ms ease',
              }}
            >
              ▶
            </span>
            <span style={{ font: '600 0.8rem/1 var(--archive-font-ui)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--archive-color-ink)' }}>
              {row.year}
            </span>
          </span>
          <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
            {row.count}
          </span>
        </button>
      </div>
    )
  }

  const { photo } = row
  const isSelected = photo.filename === selectedFilename

  return (
    <div style={style}>
      <button
        type="button"
        {...ariaAttributes}
        onClick={() => onSelectPhoto(photo.filename)}
        style={{
          display: 'grid',
          gridTemplateColumns: '3rem minmax(0,1fr)',
          alignItems: 'center',
          gap: '0.8rem',
          width: '100%',
          height: '100%',
          padding: '0 0.9rem 0 1.8rem',
          border: 'none',
          borderBottom: '1px solid rgba(29,35,41,0.04)',
          background: isSelected ? 'linear-gradient(90deg, rgba(62,91,113,0.12), rgba(62,91,113,0.03))' : 'transparent',
          boxShadow: isSelected ? 'inset 3px 0 0 var(--archive-color-accent)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ width: '3rem', height: '3rem', borderRadius: '0.45rem', overflow: 'hidden', background: 'rgba(29,35,41,0.08)', border: isSelected ? '1px solid rgba(62,91,113,0.3)' : '1px solid rgba(29,35,41,0.06)' }}>
          <img
            src={photographThumbnailUrl(photo.filename)}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: '0 0 0.2rem', font: '500 0.77rem/1.35 var(--archive-font-ui)', color: isSelected ? 'var(--archive-color-accent)' : 'var(--archive-color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {photo.filename}
          </p>
          <p style={{ margin: 0, font: '0.68rem/1.25 var(--archive-font-ui)', color: 'var(--archive-color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[photo.place, photo.date].filter(Boolean).join(' · ')}
          </p>
        </div>
      </button>
    </div>
  )
}

function MetaPill({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: '0.15rem', padding: '0.75rem 0.85rem', border: '1px solid rgba(29,35,41,0.08)', background: 'rgba(255,255,255,0.7)' }}>
      <span style={{ font: '600 0.64rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        {label}
      </span>
      <span style={{ font: '0.9rem/1.35 var(--archive-font-body)', color: 'var(--archive-color-ink)' }}>
        {value}
      </span>
    </div>
  )
}

export default function PhotoArchiveWindowed() {
  const [rootRef, rootSize] = useElementSize()
  const years = useMemo(() => {
    const grouped = new Map()

    for (const photo of galleryData) {
      const year = photo.date?.slice(0, 4) ?? 'Unknown'
      if (!grouped.has(year)) grouped.set(year, [])
      grouped.get(year).push(photo)
    }

    return [...grouped.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, photos]) => ({ year, photos }))
  }, [])

  const [selectedFilename, setSelectedFilename] = useState(null)
  const [openYears, setOpenYears] = useState(() => new Set())
  const listRef = useListRef()
  const [explorerRef, explorerSize] = useElementSize()
  const isNarrow = rootSize.width > 0 && rootSize.width < 980

  const slides = useMemo(() => (
    galleryData.map((photo) => ({
      src: photographFullUrl(photo.filename),
      alt: photo.blipCaption ?? photo.filename,
      width: photo.width,
      height: photo.height,
    }))
  ), [])

  const selectedIndex = useMemo(() => (
    selectedFilename ? galleryData.findIndex((photo) => photo.filename === selectedFilename) : -1
  ), [selectedFilename])

  const selectedPhoto = selectedIndex >= 0 ? galleryData[selectedIndex] ?? null : null

  useEffect(() => {
    if (!selectedPhoto?.date) return

    const selectedYear = selectedPhoto.date.slice(0, 4)
    setOpenYears((prev) => {
      if (prev.has(selectedYear)) return prev
      const next = new Set(prev)
      next.add(selectedYear)
      return next
    })
  }, [selectedPhoto])

  const rows = useMemo(() => {
    const nextRows = []

    for (const { year, photos } of years) {
      const isOpen = openYears.has(year)
      nextRows.push({ type: 'year', year, isOpen, count: photos.length })

      if (isOpen) {
        for (const photo of photos) {
          nextRows.push({ type: 'photo', year, photo })
        }
      }
    }

    return nextRows
  }, [openYears, years])

  const rowIndexByFilename = useMemo(() => {
    const map = new Map()
    rows.forEach((row, index) => {
      if (row.type === 'photo') map.set(row.photo.filename, index)
    })
    return map
  }, [rows])

  useEffect(() => {
    if (!selectedFilename) return
    const rowIndex = rowIndexByFilename.get(selectedFilename)
    if (rowIndex == null) return

    listRef.current?.scrollToRow({
      index: rowIndex,
      align: 'smart',
      behavior: 'auto',
    })
  }, [listRef, rowIndexByFilename, selectedFilename])

  const coords = selectedPhoto ? fmtCoord(selectedPhoto.lat, selectedPhoto.lng) : null
  const nearestNeighbours = selectedPhoto ? photoNearestNeighbours[selectedPhoto.filename] ?? [] : []

  const handleToggleYear = (year) => {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  return (
    <div
      ref={rootRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : 'minmax(15rem, 18rem) minmax(0, 0.92fr) 14rem',
        gridTemplateRows: isNarrow ? 'minmax(18rem, 38vh) minmax(0, 1fr)' : '1fr',
        height: 'calc(100vh - 88px)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(247,244,237,0.88), rgba(241,246,249,0.9))',
      }}
    >
      <aside style={{ display: 'grid', gridTemplateRows: 'auto minmax(0,1fr)', borderRight: isNarrow ? 'none' : '1px solid var(--archive-color-rule)', borderBottom: isNarrow ? '1px solid var(--archive-color-rule)' : 'none', minWidth: 0, background: 'rgba(250,248,243,0.92)' }}>
        <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--archive-color-rule)', background: 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(247,244,237,0.96))' }}>
          <p style={{ margin: 0, font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Photo Archive · {galleryData.length.toLocaleString()} images
          </p>
        </div>

        <div
          ref={explorerRef}
          data-lenis-prevent
          data-lenis-prevent-wheel
          style={{ minHeight: 0, overflow: 'hidden' }}
        >
          {explorerSize.width > 0 && explorerSize.height > 0 ? (
            <List
              listRef={listRef}
              rowComponent={ExplorerRow}
              rowCount={rows.length}
              rowHeight={(index) => (rows[index]?.type === 'year' ? YEAR_ROW_HEIGHT : PHOTO_ROW_HEIGHT)}
              rowProps={{
                rows,
                selectedFilename,
                onToggleYear: handleToggleYear,
                onSelectPhoto: setSelectedFilename,
              }}
              overscanCount={8}
              style={{ width: explorerSize.width, height: explorerSize.height }}
            />
          ) : null}
        </div>
      </aside>

      <main style={{ display: 'grid', gridTemplateRows: 'minmax(0,1fr) auto', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ minHeight: 0, overflow: 'hidden', padding: '0.65rem', background: 'radial-gradient(circle at 14% 12%, rgba(62,91,113,0.08), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.58), rgba(238,244,247,0.72))' }}>
          {selectedPhoto ? (
            <div style={{ height: '100%', minHeight: 0, display: 'grid' }}>
              <div style={{ minWidth: 0, minHeight: 0, background: 'rgba(11,18,32,0.92)', boxShadow: '0 32px 70px -42px rgba(15,23,42,0.6)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                <div style={{ width: 'min(100%, 42rem)', maxHeight: '100%', aspectRatio: '4 / 3', overflow: 'hidden' }}>
                  <Lightbox
                    plugins={[Inline]}
                    index={selectedIndex}
                    slides={slides}
                    inline={{
                      style: {
                        width: '100%',
                        height: '100%',
                      },
                    }}
                    carousel={{
                      finite: true,
                      preload: 3,
                      padding: '18px',
                      spacing: '10%',
                      imageFit: 'contain',
                    }}
                    animation={{
                      fade: 180,
                      swipe: 320,
                      navigation: 260,
                    }}
                    controller={{
                      aria: true,
                      closeOnBackdropClick: false,
                    }}
                    on={{
                      view: ({ index }) => setSelectedFilename(galleryData[index]?.filename ?? null),
                    }}
                    render={{
                      buttonPrev: slides.length > 1 ? undefined : () => null,
                      buttonNext: slides.length > 1 ? undefined : () => null,
                    }}
                    toolbar={{ buttons: [] }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: 0, border: '1px solid rgba(29,35,41,0.08)', background: 'linear-gradient(180deg, rgba(11,18,32,0.94), rgba(15,23,42,0.9))', boxShadow: '0 32px 70px -42px rgba(15,23,42,0.6)', display: 'grid', placeItems: 'center', padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '0.9rem', justifyItems: 'center', textAlign: 'center', maxWidth: '22rem' }}>
                <div style={{ width: '3.4rem', height: '3.4rem', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.24)', display: 'grid', placeItems: 'center', color: 'rgba(226,232,240,0.78)' }}>
                  <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
                    <rect x="6" y="10" width="36" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="17" cy="20" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 32 L16 23 L23 30 L30 24 L42 34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ margin: 0, font: '500 1.1rem/1.35 var(--archive-font-display)', color: '#f8fafc' }}>
                  Select a photo to view it
                </p>
                <p style={{ margin: 0, font: '0.82rem/1.6 var(--archive-font-ui)', color: 'rgba(226,232,240,0.62)' }}>
                  Choose any image from the explorer on the left to open it in the viewer.
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedPhoto ? (
          <section
            data-lenis-prevent
            data-lenis-prevent-wheel
            style={{ display: 'grid', gap: '0.9rem', maxHeight: isNarrow ? '32vh' : '28vh', overflowY: 'auto', padding: '1rem 1.15rem 1.15rem', borderTop: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
              <MetaPill label="Date" value={selectedPhoto.date ?? 'Unknown'} />
              <MetaPill label="Place" value={selectedPhoto.place ?? 'Unknown'} />
              <MetaPill label="Aspect" value={aspectLabel(selectedPhoto.aspectRatio)} />
              <MetaPill label="Cluster" value={`#${selectedPhoto.clusterId}`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '1rem' }}>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid rgba(29,35,41,0.08)', background: 'rgba(255,255,255,0.62)' }}>
                <p style={{ margin: '0 0 0.45rem', font: '600 0.66rem/1 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  Caption
                </p>
                <p style={{ margin: 0, font: 'italic 0.98rem/1.7 var(--archive-font-body)', color: 'var(--archive-color-copy)' }}>
                  {selectedPhoto.blipCaption ? `"${selectedPhoto.blipCaption}"` : 'No AI caption available.'}
                </p>
              </div>

              <div style={{ padding: '0.9rem 1rem', border: '1px solid rgba(29,35,41,0.08)', background: 'rgba(255,255,255,0.62)' }}>
                <p style={{ margin: '0 0 0.45rem', font: '600 0.66rem/1 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  Details
                </p>
                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  <p style={{ margin: 0, font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                    Dimensions: {selectedPhoto.width} × {selectedPhoto.height}px
                  </p>
                  <p style={{ margin: 0, font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                    Brightness: {selectedPhoto.brightness} · Entropy: {selectedPhoto.entropy}
                  </p>
                  <p style={{ margin: 0, font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                    Style energy: {selectedPhoto.styleEnergy} · People: {selectedPhoto.personCount}
                  </p>
                  {coords ? (
                    <p style={{ margin: 0, font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                      Coordinates: {coords}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {!isNarrow ? (
        <aside
          data-lenis-prevent
          data-lenis-prevent-wheel
          style={{ minWidth: 0, minHeight: 0, overflowY: 'auto', borderLeft: '1px solid var(--archive-color-rule)', background: 'rgba(250,248,243,0.86)', padding: '0.75rem 0.5rem' }}
        >
          {selectedPhoto && nearestNeighbours.length > 0 ? (
            <>
              <p style={{ margin: '0 0 0.55rem', font: '600 0.64rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                Similar Images
              </p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {nearestNeighbours.map((neighbor) => (
                  <button
                    key={neighbor.filename}
                    type="button"
                    onClick={() => setSelectedFilename(neighbor.filename)}
                    style={{ display: 'grid', gap: '0.4rem', width: '100%', border: '1px solid rgba(29,35,41,0.08)', background: 'rgba(255,255,255,0.76)', padding: '0.28rem', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: 'rgba(29,35,41,0.08)' }}>
                      <img
                        src={photographThumbnailUrl(neighbor.filename)}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    <p style={{ margin: 0, font: '500 0.72rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {neighbor.filename}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
