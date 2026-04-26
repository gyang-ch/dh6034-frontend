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

function fmtNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return 'Unknown'
  return Number(value).toFixed(digits)
}

function fmtRgbTriplet(value) {
  if (!Array.isArray(value) || value.length !== 3) return null
  return value.map((channel) => Math.round(channel)).join(', ')
}

function fmtList(items, emptyLabel = 'None') {
  if (!items?.length) return emptyLabel
  return items.join(', ')
}

function fmtObjectEntries(record, emptyLabel = 'None') {
  const entries = Object.entries(record ?? {})
  if (!entries.length) return emptyLabel
  return entries.map(([key, value]) => `${key}: ${value}`).join(', ')
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
          background: isSelected ? 'var(--parchment)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--archive-color-accent)' : '3px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.2s',
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
    <div style={{ display: 'grid', gap: '0.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(29,35,41,0.05)' }}>
      <span style={{ font: '600 0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        {label}
      </span>
      <span style={{ font: 'italic 400 1rem/1.2 var(--archive-font-body)', color: 'var(--archive-color-ink)' }}>
        {value}
      </span>
    </div>
  )
}

function MetadataCard({ title, children }) {
  return (
    <div style={{ padding: '1.25rem 0 0.5rem', borderTop: '1px solid var(--archive-color-rule)' }}>
      <p style={{ margin: '0 0 0.75rem', font: '600 0.7rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-ink)' }}>
        {title}
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {children}
      </div>
    </div>
  )
}

function MetadataLine({ label, value }) {
  return (
    <p style={{ margin: 0, font: '0.8rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
      <span style={{ color: 'var(--archive-color-ink)', fontWeight: 600 }}>{label}:</span>{' '}
      {value}
    </p>
  )
}

export default function PhotoArchiveWindowed() {
  const [rootRef, rootSize] = useElementSize()
  const [photoSupplementMap, setPhotoSupplementMap] = useState({})
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
  const [explorerScrollTop, setExplorerScrollTop] = useState(0)
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
  const selectedPhotoSupplement = selectedPhoto ? photoSupplementMap[selectedPhoto.filename] ?? null : null

  useEffect(() => {
    let cancelled = false

    import('../data/photoMetadataSupplement').then((module) => {
      if (!cancelled) setPhotoSupplementMap(module.photoMetadataSupplement ?? {})
    })

    return () => {
      cancelled = true
    }
  }, [])

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

  const rowOffsets = useMemo(() => {
    const offsets = []
    let top = 0
    for (const row of rows) {
      offsets.push(top)
      top += row.type === 'year' ? YEAR_ROW_HEIGHT : PHOTO_ROW_HEIGHT
    }
    return offsets
  }, [rows])

  const stickyInfo = useMemo(() => {
    let stickyRow = null
    let stickyRowIndex = -1
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].type === 'year' && rowOffsets[i] < explorerScrollTop) {
        stickyRow = rows[i]
        stickyRowIndex = i
      }
    }
    if (!stickyRow) return null

    let nextYearOffset = null
    for (let i = stickyRowIndex + 1; i < rows.length; i++) {
      if (rows[i].type === 'year') {
        nextYearOffset = rowOffsets[i]
        break
      }
    }

    let translateY = 0
    if (nextYearOffset != null) {
      const gap = nextYearOffset - explorerScrollTop
      if (gap < YEAR_ROW_HEIGHT) translateY = gap - YEAR_ROW_HEIGHT
    }

    return { row: stickyRow, translateY }
  }, [explorerScrollTop, rows, rowOffsets])

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
  const dominantColours = selectedPhoto?.dominant ?? []
  const clipTagDetails = selectedPhotoSupplement?.clipTagsDetailed ?? []
  const yoloObjects = selectedPhotoSupplement?.yoloObjects ?? {}
  const pcaFeatures = selectedPhotoSupplement?.pcaFeatures ?? {}

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
          style={{ minHeight: 0, overflow: 'hidden', position: 'relative' }}
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
              onScroll={(e) => setExplorerScrollTop(e.currentTarget.scrollTop)}
            />
          ) : null}
          {stickyInfo && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: YEAR_ROW_HEIGHT,
                transform: `translateY(${stickyInfo.translateY}px)`,
                zIndex: 5,
                pointerEvents: stickyInfo.translateY < 0 ? 'none' : 'auto',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggleYear(stickyInfo.row.year)}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.8rem',
                  border: 'none',
                  borderBottom: '1px solid var(--archive-color-rule)',
                  background: 'rgba(247,244,237,0.98)',
                  padding: '0 1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 2px 8px -2px rgba(29,35,41,0.15)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      transform: stickyInfo.row.isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 180ms ease',
                    }}
                  >
                    ▶
                  </span>
                  <span style={{ font: '600 0.8rem/1 var(--archive-font-ui)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--archive-color-ink)' }}>
                    {stickyInfo.row.year}
                  </span>
                </span>
                <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
                  {stickyInfo.row.count}
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main style={{ display: 'grid', gridTemplateRows: 'minmax(0,1fr) auto', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ minHeight: 0, overflow: 'hidden', padding: '1.5rem', background: '#e8e4da' }}>
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
            <div
              style={{
                height: '100%',
                minHeight: 0,
                background: 'var(--parchment)',
                display: 'grid',
                placeItems: 'center',
                padding: '2rem',
              }}
            >
              <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', font: 'italic 400 1.5rem/1.3 var(--archive-font-display)', color: 'var(--archive-color-muted)' }}>
                  The Viewer is Empty
                </h3>
                <p style={{ margin: 0, font: '400 0.9rem/1.6 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                  Please select a photograph from the ledger on the left to examine its latent features, annotations, and metadata.
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedPhoto ? (
          <section
            data-lenis-prevent
            data-lenis-prevent-wheel
            style={{ display: 'grid', gap: '0.9rem', maxHeight: isNarrow ? '34vh' : '32vh', overflowY: 'auto', padding: '1rem 1.15rem 1.15rem', borderTop: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(2, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', gap: '0.75rem' }}>
              <MetaPill label="File" value={selectedPhoto.filename} />
              <MetaPill label="Date" value={selectedPhoto.date ?? 'Unknown'} />
              <MetaPill label="Place" value={selectedPhoto.place ?? 'Unknown'} />
              <MetaPill label="K-Means" value={selectedPhoto.clusterId != null ? `#${selectedPhoto.clusterId}` : 'Unknown'} />
              <MetaPill label="HDBSCAN" value={selectedPhoto.hdbscanClusterId != null ? `#${selectedPhoto.hdbscanClusterId}` : 'Unknown'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
              <MetadataCard title="Captions">
                <MetadataLine label="BLIP" value={selectedPhoto.blipCaption ? `"${selectedPhoto.blipCaption}"` : 'No BLIP caption available.'} />
                <MetadataLine label="Gemma" value={selectedPhoto.gemmaCaption ?? 'No Gemma caption available.'} />
              </MetadataCard>

              <MetadataCard title="Technical Details">
                <MetadataLine label="Dimensions" value={`${selectedPhoto.width} × ${selectedPhoto.height}px`} />
                <MetadataLine label="Brightness" value={fmtNumber(selectedPhoto.brightness, 1)} />
                <MetadataLine label="Entropy" value={fmtNumber(selectedPhoto.entropy, 3)} />
                <MetadataLine label="Style Energy" value={fmtNumber(selectedPhoto.styleEnergy, 3)} />
                <MetadataLine label="Coordinates" value={coords ?? 'Unknown'} />
                <MetadataLine label="UMAP Position" value={`${fmtNumber(selectedPhoto.x, 4)}, ${fmtNumber(selectedPhoto.y, 4)}`} />
                <MetadataLine label="Mean RGB" value={fmtRgbTriplet(selectedPhotoSupplement?.meanRgb) ?? 'Unknown'} />
                <MetadataLine label="Std RGB" value={fmtRgbTriplet(selectedPhotoSupplement?.stdRgb) ?? 'Unknown'} />
              </MetadataCard>

              <MetadataCard title="People And Annotation">
                <MetadataLine label="Visible People" value={selectedPhoto.personCount ?? 'Unknown'} />
                <MetadataLine label="Main Subjects" value={selectedPhotoSupplement?.mainPeople ?? 'Unknown'} />
                <MetadataLine label="Contains Me" value={selectedPhotoSupplement?.myself == null ? 'Unknown' : selectedPhotoSupplement.myself ? 'Yes' : 'No'} />
                <MetadataLine label="Social Category" value={selectedPhotoSupplement?.category ?? 'Unknown'} />
                <MetadataLine label="Detected Objects" value={fmtObjectEntries(yoloObjects)} />
              </MetadataCard>

              <MetadataCard title="Clusters And Features">
                <MetadataLine label="K-Means Label" value={selectedPhotoSupplement?.kmeansClusterLabel ?? 'Unknown'} />
                <MetadataLine label="K-Means Name" value={selectedPhotoSupplement?.kmeansClusterName ?? 'Unknown'} />
                <MetadataLine label="HDBSCAN Name" value={selectedPhotoSupplement?.hdbscanClusterName ?? 'Unknown'} />
                <MetadataLine label="PCA Structure" value={pcaFeatures.structure ?? 'Unknown'} />
                <MetadataLine label="PCA Palette" value={pcaFeatures.palette ?? 'Unknown'} />
                <MetadataLine label="PCA Texture" value={pcaFeatures.texture ?? 'Unknown'} />
              </MetadataCard>

              <MetadataCard title="Keywords And Tags">
                <MetadataLine label="Archive Tags" value={fmtList(selectedPhoto.tags)} />
                <MetadataLine label="BLIP Keywords" value={fmtList(selectedPhoto.blipKeywords)} />
                <MetadataLine label="Gemma Keywords" value={fmtList(selectedPhoto.gemmaKeywords)} />
                <MetadataLine
                  label="CLIP Tags"
                  value={clipTagDetails.length ? clipTagDetails.map(({ tag, score }) => `${tag} (${fmtNumber(score, 3)})`).join(', ') : 'None'}
                />
              </MetadataCard>

              <MetadataCard title="Dominant Colours">
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {dominantColours.length ? dominantColours.map((colour, index) => (
                    <div key={`${colour.hex}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.2rem minmax(0, 1fr)', gap: '0.55rem', alignItems: 'center' }}>
                      <span style={{ width: '1.2rem', height: '1.2rem', borderRadius: '999px', background: colour.hex, border: '1px solid rgba(29,35,41,0.14)' }} />
                      <span style={{ font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                        <span style={{ color: 'var(--archive-color-ink)', fontWeight: 600 }}>{colour.hex}</span>
                        {` · saturation ${fmtNumber(colour.hslSaturation, 3)}`}
                      </span>
                    </div>
                  )) : (
                    <p style={{ margin: 0, font: '0.8rem/1.45 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                      No dominant colour metadata available.
                    </p>
                  )}
                </div>
              </MetadataCard>
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
              <p
                style={{
                  margin: '0 0 0.8rem',
                  padding: '0.7rem 0.85rem',
                  border: '1px solid rgba(62,91,113,0.16)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.76), rgba(247,244,237,0.96))',
                  font: '600 0.82rem/1 var(--archive-font-ui)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--archive-color-ink)',
                }}
              >
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
