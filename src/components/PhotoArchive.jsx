import { useMemo, useState } from 'react'
import { galleryData } from '../data/galleryData'
import { photographFullUrl, photographThumbnailUrl } from '../lib/photographs'

const detailImageUrl = photographFullUrl
const explorerThumbnailUrl = photographThumbnailUrl

function fmtCoord(lat, lng) {
  if (lat == null || lng == null) return null
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns},  ${Math.abs(lng).toFixed(4)}° ${ew}`
}

function aspectLabel(ratio) {
  if (ratio > 1.05) return 'Landscape'
  if (ratio < 0.95) return 'Portrait'
  return 'Square'
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <dt style={{ font: '500 0.72rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)', whiteSpace: 'nowrap', minWidth: '90px' }}>{label}</dt>
      <dd style={{ font: '0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-ink)', margin: 0, wordBreak: 'break-word' }}>{value}</dd>
    </div>
  )
}

function MetaSection({ title, children }) {
  return (
    <section style={{ padding: '14px 18px 12px' }}>
      <h3 style={{ margin: '0 0 10px', font: '600 0.7rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>{title}</h3>
      {children}
    </section>
  )
}

function GalleryDetail({ photo }) {
  if (!photo) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--archive-color-muted)' }}>
        <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
          <rect x="6" y="10" width="36" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="17" cy="20" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 32 L16 23 L23 30 L30 24 L42 34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <p style={{ margin: 0, font: '0.85rem/1.4 var(--archive-font-ui)' }}>Select a photo to view details</p>
      </div>
    )
  }

  const coords = fmtCoord(photo.lat, photo.lng)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Image */}
      <div style={{ flex: '0 0 56%', position: 'relative', overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img key={photo.filename} src={detailImageUrl(photo.filename)} alt={photo.blipCaption ?? photo.filename} loading="lazy"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 14px', background: 'linear-gradient(transparent,rgba(0,0,0,0.55))', pointerEvents: 'none' }}>
          <span style={{ font: '0.7rem/1.4 var(--archive-font-ui)', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.02em' }}>{photo.filename}</span>
        </div>
      </div>

      {/* Scrollable metadata */}
      <div
        data-lenis-prevent
        data-lenis-prevent-wheel
        style={{ flex: 1, overflowY: 'auto' }}
      >
        <div style={{ paddingBottom: '24px' }}>
          <MetaSection title="Basic Info">
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {photo.date && <MetaRow label="Date" value={photo.date} />}
              {photo.place && <MetaRow label="Place" value={photo.place} />}
              {coords && <MetaRow label="Coordinates" value={coords} />}
              <MetaRow label="People" value={String(photo.personCount)} />
            </dl>
          </MetaSection>
          <hr style={{ height: '1px', background: 'var(--archive-color-rule)', border: 'none', margin: '0 18px' }} />

          <MetaSection title="AI Analysis">
            {photo.blipCaption ? (
              <div style={{ background: 'rgba(62,91,113,0.07)', borderLeft: '3px solid var(--archive-color-accent)', borderRadius: '0 6px 6px 0', padding: '8px 12px', marginBottom: '10px' }}>
                <p style={{ margin: 0, font: 'italic 0.85rem/1.65 var(--archive-font-body)', color: 'var(--archive-color-copy)' }}>"{photo.blipCaption}"</p>
              </div>
            ) : (
              <p style={{ margin: 0, font: '0.78rem/1.5 var(--archive-font-ui)', color: 'var(--archive-color-muted)', fontStyle: 'italic' }}>No caption yet — run blip_annotate.py</p>
            )}
            {photo.blipKeywords?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                {photo.blipKeywords.map((kw, i) => (
                  <span key={i} style={{ font: '0.7rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-accent)', background: 'rgba(62,91,113,0.1)', border: '1px solid rgba(62,91,113,0.2)', borderRadius: '4px', padding: '2px 8px' }}>{kw}</span>
                ))}
              </div>
            )}
            {(photo.blipScene || photo.blipSubject) && (
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {photo.blipScene && <MetaRow label="Scene" value={photo.blipScene} />}
                {photo.blipSubject && <MetaRow label="Subject" value={photo.blipSubject} />}
              </dl>
            )}
          </MetaSection>
          <hr style={{ height: '1px', background: 'var(--archive-color-rule)', border: 'none', margin: '0 18px' }} />

          <MetaSection title="Visual Features">
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MetaRow label="Brightness" value={`${Math.round((photo.brightness / 255) * 100)}%  (${photo.brightness})`} />
              <MetaRow label="Entropy" value={String(photo.entropy)} />
              <MetaRow label="Style energy" value={String(photo.styleEnergy)} />
              <MetaRow label="Cluster" value={`#${photo.clusterId}`} />
            </dl>
          </MetaSection>
          <hr style={{ height: '1px', background: 'var(--archive-color-rule)', border: 'none', margin: '0 18px' }} />

          <MetaSection title="Image Properties">
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MetaRow label="Dimensions" value={`${photo.width} × ${photo.height} px`} />
              <MetaRow label="Aspect ratio" value={`${photo.aspectRatio}  (${aspectLabel(photo.aspectRatio)})`} />
            </dl>
          </MetaSection>

          {photo.dominant?.length > 0 && (
            <>
              <hr style={{ height: '1px', background: 'var(--archive-color-rule)', border: 'none', margin: '0 18px' }} />
              <MetaSection title="Dominant Colours">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {photo.dominant.map((swatch, i) => (
                    <span key={i} title={swatch.hex} style={{ display: 'block', width: '28px', height: '28px', borderRadius: '50%', background: swatch.hex, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  ))}
                </div>
              </MetaSection>
            </>
          )}

          {photo.tags?.length > 0 && (
            <>
              <hr style={{ height: '1px', background: 'var(--archive-color-rule)', border: 'none', margin: '0 18px' }} />
              <MetaSection title="CLIP Tags">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {photo.tags.map((tag) => (
                    <span key={tag} style={{ font: '0.7rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-copy)', background: 'rgba(29,35,41,0.07)', border: '1px solid rgba(29,35,41,0.1)', borderRadius: '4px', padding: '2px 8px' }}>{tag}</span>
                  ))}
                </div>
              </MetaSection>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function GalleryExplorer({ photos, selectedFilename, onSelect }) {
  const byYear = useMemo(() => {
    const map = new Map()
    for (const p of photos) {
      const year = p.date?.slice(0, 4) ?? 'Unknown'
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(p)
    }
    return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])))
  }, [photos])

  const [openYears, setOpenYears] = useState(() => {
    return new Set()
  })

  function toggleYear(year) {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  return (
    <div
      data-lenis-prevent
      data-lenis-prevent-wheel
      style={{ height: '100%', overflowY: 'auto', borderRight: '1px solid var(--archive-color-rule)' }}
    >
      {[...byYear.entries()].map(([year, yearPhotos]) => {
        const isOpen = openYears.has(year)
        return (
          <div key={year}>
            <button type="button" onClick={() => toggleYear(year)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--archive-color-rule)', cursor: 'pointer', font: '600 0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-ink)', textAlign: 'left' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', display: 'inline-block' }}>▶</span>
                {year}
              </span>
              <span style={{ font: '0.72rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{yearPhotos.length}</span>
            </button>
            {isOpen && (
              <div>
                {yearPhotos.map((photo) => {
                  const isSelected = photo.filename === selectedFilename
                  return (
                    <button key={photo.filename} type="button" onClick={() => onSelect(photo.filename)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px 8px 28px', background: isSelected ? 'rgba(62,91,113,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(29,35,41,0.04)', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms ease' }}>
                      <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(29,35,41,0.08)' }}>
                        <img src={explorerThumbnailUrl(photo.filename)} alt="" loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, font: '500 0.75rem/1.3 var(--archive-font-ui)', color: isSelected ? 'var(--archive-color-accent)' : 'var(--archive-color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.filename}</p>
                        {photo.place && <p style={{ margin: 0, font: '0.68rem/1.2 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{photo.place}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PhotoArchive() {
  const [selectedFilename, setSelectedFilename] = useState(null)
  const selectedPhoto = selectedFilename ? galleryData.find((p) => p.filename === selectedFilename) ?? null : null

  return (
    <div
      data-lenis-prevent
      data-lenis-prevent-wheel
      style={{ display: 'grid', gridTemplateColumns: '480px 1fr', height: 'calc(100vh - 88px)', minHeight: 0, overflow: 'hidden' }}
    >
      <aside style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--archive-color-rule)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--archive-color-rule)', background: 'rgba(247,244,237,0.95)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
          <p style={{ margin: 0, font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
            Photo Archive · {galleryData.length.toLocaleString()} images
          </p>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <GalleryExplorer photos={galleryData} selectedFilename={selectedFilename} onSelect={setSelectedFilename} />
        </div>
      </aside>
      <main style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GalleryDetail photo={selectedPhoto} />
      </main>
    </div>
  )
}
