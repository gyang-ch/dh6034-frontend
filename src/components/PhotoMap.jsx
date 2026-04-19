import { useEffect, useRef, useState } from 'react'
import { photographUrl } from '../lib/photographs'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const imageUrl = photographUrl

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function thumbsHtml(filenames) {
  return filenames.map((f) =>
    `<div class="pm-thumb"><img src="${imageUrl(f)}" alt="${escHtml(f)}" loading="lazy"/></div>`
  ).join('')
}

function pointPopupHtml(props, placeIndex) {
  const meta = placeIndex.get(props.place)
  const thumbs = (meta?.filenames ?? [props.filename]).slice(0, 4)
  const dateLabel = meta?.firstDate && meta?.lastDate && meta.firstDate !== meta.lastDate
    ? `${meta.firstDate} — ${meta.lastDate}`
    : (props.date ?? '')
  const archiveLabel = meta && meta.total > 1
    ? `${meta.total} photographs from ${props.place}`
    : 'Single photograph at this place'
  const peopleLabel = props.person_count > 0
    ? `${props.person_count} person${props.person_count !== 1 ? 's' : ''}`
    : 'No people recorded'

  return `<article class="pm-card">
    <div class="pm-thumbs pm-thumbs-${thumbs.length}">${thumbsHtml(thumbs)}</div>
    <div class="pm-body">
      <p class="pm-place">${escHtml(props.place)}</p>
      <p class="pm-date">${escHtml(dateLabel)}</p>
      <p class="pm-meta">${escHtml(archiveLabel)}</p>
      <p class="pm-meta">${escHtml(peopleLabel)}</p>
      <p class="pm-file">${escHtml(props.filename)}</p>
    </div>
  </article>`
}

function clusterPopupHtml(count, places, dateRange, filenames) {
  return `<article class="pm-card">
    ${filenames.length ? `<div class="pm-thumbs pm-thumbs-${filenames.length}">${thumbsHtml(filenames)}</div>` : ''}
    <div class="pm-body">
      <p class="pm-place">Cluster preview</p>
      <p class="pm-date">${count} photographs</p>
      ${dateRange ? `<p class="pm-meta">${escHtml(dateRange)}</p>` : ''}
      ${places.length ? `<p class="pm-file">${escHtml(places.join(' · '))}</p>` : ''}
    </div>
  </article>`
}

const POPUP_CSS = `
.maplibregl-popup-content { padding:0; border-radius:1rem; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.18); max-width:17rem; }
.maplibregl-popup-close-button { color:#3b4450; background:rgba(255,255,255,0.85); border-radius:999px; width:1.4rem; height:1.4rem; display:flex; align-items:center; justify-content:center; font-size:1rem; line-height:1; top:0.4rem; right:0.4rem; }
.pm-card { font-family: system-ui, sans-serif; }
.pm-thumbs { display:grid; max-height:9rem; overflow:hidden; background:#e8e4db; }
.pm-thumbs-1 { grid-template-columns:1fr; }
.pm-thumbs-2,.pm-thumbs-3,.pm-thumbs-4 { grid-template-columns:1fr 1fr; }
.pm-thumb img { width:100%; height:100%; object-fit:cover; display:block; aspect-ratio:4/3; }
.pm-body { padding:0.7rem 0.85rem; }
.pm-place { margin:0 0 0.1rem; font-weight:600; font-size:0.88rem; color:#1d2329; }
.pm-date { margin:0 0 0.15rem; font-size:0.78rem; color:#3b4450; }
.pm-meta { margin:0 0 0.1rem; font-size:0.73rem; color:#7a8898; }
.pm-file { margin:0; font-size:0.66rem; color:#9caab5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
`

const MODES = [
  { key: 'count', label: 'Archive Density' },
  { key: 'subject', label: 'Subject Families' },
  { key: 'scene', label: 'Scene Balance' },
]

export default function PhotoMap({ semanticMap }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const defaultViewRef = useRef(null)
  const [mode, setMode] = useState('count')
  const modeRef = useRef('count')
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let map = null
    let popup = null
    let pinnedKey = null
    let hoverReqId = 0

    async function init() {
      const ml = (await import('maplibre-gl'))
      if (cancelled) return
      // inject popup CSS once
      if (!document.getElementById('pm-popup-css')) {
        const style = document.createElement('style')
        style.id = 'pm-popup-css'
        style.textContent = POPUP_CSS
        document.head.appendChild(style)
      }

      // fetch and augment geojson
      const res = await fetch(`${import.meta.env.BASE_URL}photos.geojson`)
      const geojson = await res.json()
      if (cancelled) return

      const placeIndex = new Map()
      for (const feat of geojson.features ?? []) {
        const p = feat.properties
        if (!p?.place || !p.filename) continue
        const sem = semanticMap.pointLookup[p.filename]
        p.semantic_family = sem?.family ?? 'other'
        p.scene_key = sem?.scene ?? 'outdoors'

        const ex = placeIndex.get(p.place) ?? { filenames: [], total: 0, firstDate: null, lastDate: null }
        ex.total += 1
        if (ex.filenames.length < 4) ex.filenames.push(p.filename)
        if (p.date) {
          ex.firstDate = ex.firstDate == null || p.date < ex.firstDate ? p.date : ex.firstDate
          ex.lastDate = ex.lastDate == null || p.date > ex.lastDate ? p.date : ex.lastDate
        }
        placeIndex.set(p.place, ex)
      }

      const dates = geojson.features.map((f) => f.properties?.date).filter(Boolean).sort()
      if (!cancelled) setMetrics({
        photoCount: geojson.features.length,
        placeCount: placeIndex.size,
        firstDate: dates[0] ?? null,
        lastDate: dates.at(-1) ?? null,
      })

      // build color expressions
      function pointColor(m) {
        if (m === 'subject') return ['match', ['get', 'semantic_family'],
          ...semanticMap.families.flatMap((f) => [f.key, f.color]), '#8f8a80']
        if (m === 'scene') return ['match', ['get', 'scene_key'],
          ...semanticMap.scenes.flatMap((s) => [s.key, s.color]), '#8f8a80']
        return '#f7f4ed'
      }
      function haloColor(m) {
        if (m === 'count') return 'rgba(110,154,180,0.36)'
        return pointColor(m)
      }
      function clusterColor(m) {
        if (m === 'count') return ['step', ['get', 'point_count'],
          '#9eb8c8', 20, '#6a9ab4', 100, '#3e5b71', 500, '#1d2329']
        if (m === 'scene') return ['case',
          ['>', ['coalesce', ['get', 'indoors_count'], 0], ['coalesce', ['get', 'outdoors_count'], 0]],
          semanticMap.scenes.find((s) => s.key === 'indoors')?.color ?? '#7b5b4a',
          semanticMap.scenes.find((s) => s.key === 'outdoors')?.color ?? '#3e6c77']
        // subject dominant-family
        let expr = ['case']
        for (const fam of semanticMap.families) {
          const comparisons = semanticMap.families
            .filter((o) => o.key !== fam.key)
            .map((o) => ['>=', ['coalesce', ['get', `${fam.key}_count`], 0], ['coalesce', ['get', `${o.key}_count`], 0]])
          expr = [...expr, ['all', ...comparisons], fam.color]
        }
        expr.push('#8f8a80')
        return expr
      }

      // cluster source properties
      const clusterProperties = {
        indoors_count: ['+', ['case', ['==', ['get', 'scene_key'], 'indoors'], 1, 0]],
        outdoors_count: ['+', ['case', ['==', ['get', 'scene_key'], 'outdoors'], 1, 0]],
        ...Object.fromEntries(semanticMap.families.map((f) => [
          `${f.key}_count`, ['+', ['case', ['==', ['get', 'semantic_family'], f.key], 1, 0]]
        ]))
      }

      map = new ml.Map({
        container,
        style: MAP_STYLE,
        center: [100, 35],
        zoom: 2.8,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-left')

      map.on('load', () => {
        if (cancelled || !map) return

        map.addSource('photos', {
          type: 'geojson', data: geojson, cluster: true,
          clusterMaxZoom: 12, clusterRadius: 48, clusterProperties,
        })

        map.addLayer({ id: 'clusters', type: 'circle', source: 'photos', filter: ['has', 'point_count'],
          paint: {
            'circle-color': clusterColor(modeRef.current),
            'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 100, 30, 500, 40],
            'circle-stroke-color': 'rgba(255,255,255,0.85)', 'circle-stroke-width': 1.5,
          }
        })
        map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'photos', filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['Noto Sans Regular'], 'text-size': 12 },
          paint: { 'text-color': '#ffffff' }
        })
        map.addLayer({ id: 'unclustered-halo', type: 'circle', source: 'photos', filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': haloColor(modeRef.current),
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 10, 5, 16, 8, 22],
            'circle-blur': 0.85, 'circle-opacity': 0.9,
          }
        })
        map.addLayer({ id: 'unclustered-aura', type: 'circle', source: 'photos', filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': haloColor(modeRef.current),
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 5, 7, 8, 10],
            'circle-blur': 0.35, 'circle-opacity': 0.95,
          }
        })
        map.addLayer({ id: 'unclustered-core', type: 'circle', source: 'photos', filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': pointColor(modeRef.current),
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 1.8, 5, 2.5, 8, 3.3],
            'circle-stroke-color': 'rgba(255,255,255,0.9)', 'circle-stroke-width': 0.9,
          }
        })

        // fit bounds to data
        if (geojson.features.length > 0) {
          const lngs = geojson.features.map((f) => f.geometry.coordinates[0])
          const lats = geojson.features.map((f) => f.geometry.coordinates[1])
          const pad = 40
          const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]
          defaultViewRef.current = { bounds, options: { padding: pad, duration: 0, maxZoom: 6 } }
          map.fitBounds(bounds, defaultViewRef.current.options)
        }

        // expose mode updater so the React state change can reach the map
        map._applyMode = (m) => {
          map.setPaintProperty('clusters', 'circle-color', clusterColor(m))
          map.setPaintProperty('unclustered-halo', 'circle-color', haloColor(m))
          map.setPaintProperty('unclustered-aura', 'circle-color', haloColor(m))
          map.setPaintProperty('unclustered-core', 'circle-color', pointColor(m))
        }

        // cluster click → zoom in
        map.on('click', 'clusters', async (e) => {
          pinnedKey = null; popup?.remove(); popup = null
          const [feat] = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          const clusterId = feat.properties?.cluster_id
          const src = map.getSource('photos')
          const zoom = await src.getClusterExpansionZoom(clusterId)
          map.easeTo({ center: feat.geometry.coordinates, zoom: zoom ?? 6 })
        })

        // cluster hover
        map.on('mouseenter', 'clusters', async (e) => {
          if (!e.features?.[0]) return
          const reqId = ++hoverReqId
          const feat = e.features[0]
          const src = map.getSource('photos')
          const leaves = await src.getClusterLeaves(feat.properties.cluster_id, 4, 0)
          if (reqId !== hoverReqId || pinnedKey) return
          const props = leaves.map((l) => l.properties).filter(Boolean)
          const places = [...new Set(props.map((p) => p.place).filter(Boolean))]
          const dates = props.map((p) => p.date).filter(Boolean).sort()
          const dateRange = dates.length > 1 ? `${dates[0]} — ${dates.at(-1)}` : (dates[0] ?? null)
          const filenames = props.map((p) => p.filename).filter(Boolean).slice(0, 4)
          popup?.remove()
          popup = new ml.Popup({ offset: 18, className: 'photo-popup is-hover', closeButton: false, closeOnClick: false, focusAfterOpen: false, maxWidth: '18rem' })
            .setLngLat(feat.geometry.coordinates).setHTML(clusterPopupHtml(feat.properties.point_count, places, dateRange, filenames)).addTo(map)
        })
        map.on('mouseleave', 'clusters', () => { if (!pinnedKey) { popup?.remove(); popup = null } })
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })

        // point hover
        map.on('mouseenter', 'unclustered-core', (e) => {
          if (!e.features?.[0]) return
          map.getCanvas().style.cursor = 'pointer'
          const p = e.features[0].properties
          const coords = e.features[0].geometry.coordinates
          if (pinnedKey === `${p.filename}::${p.place}`) return
          popup?.remove()
          popup = new ml.Popup({ offset: 18, className: 'photo-popup is-hover', closeButton: false, closeOnClick: false, focusAfterOpen: false, maxWidth: '18rem' })
            .setLngLat(coords).setHTML(pointPopupHtml(p, placeIndex)).addTo(map)
        })
        map.on('mouseleave', 'unclustered-core', () => {
          map.getCanvas().style.cursor = ''
          if (!pinnedKey) { popup?.remove(); popup = null }
        })

        // point click → pin card
        map.on('click', 'unclustered-core', (e) => {
          if (!e.features?.[0]) return
          const p = e.features[0].properties
          const coords = e.features[0].geometry.coordinates
          pinnedKey = `${p.filename}::${p.place}`
          popup?.remove()
          popup = new ml.Popup({ offset: 16, className: 'photo-popup is-pinned', closeButton: true, closeOnClick: false, focusAfterOpen: false, maxWidth: '18rem' })
            .setLngLat(coords).setHTML(pointPopupHtml(p, placeIndex)).addTo(map)
          popup.on('close', () => { pinnedKey = null; popup = null })
        })
      })
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      popup?.remove()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // propagate mode changes to the live map
  useEffect(() => {
    modeRef.current = mode
    mapRef.current?._applyMode?.(mode)
  }, [mode])

  const handleZoomIn = () => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ zoom: map.getZoom() + 0.8, duration: 260 })
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ zoom: Math.max(map.getZoom() - 0.8, 0), duration: 260 })
  }

  const handleResetView = () => {
    const map = mapRef.current
    const defaultView = defaultViewRef.current
    if (!map || !defaultView) return
    map.fitBounds(defaultView.bounds, { ...defaultView.options, duration: 500 })
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem', padding: '1.2rem', border: '1px solid var(--archive-color-rule)', borderRadius: '1.75rem', background: 'linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,237,0.9))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-end', gap: '0.75rem' }}>
        <div>
          <p style={{ margin: '0 0 0.3rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Geographic Distribution</p>
          <h3 style={{ margin: 0, font: '500 1.45rem/1.12 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
            {mode === 'count' ? 'Archive density across the map' : mode === 'subject' ? 'Dominant semantic families by place' : 'Indoor vs outdoor balance by place'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '3px', padding: '3px', background: 'rgba(29,35,41,0.07)', borderRadius: '999px' }}>
          {MODES.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              style={{ padding: '0.35rem 0.9rem', border: 'none', borderRadius: '999px', font: '500 0.82rem/1 var(--archive-font-ui)', cursor: 'pointer', transition: 'background 150ms, color 150ms',
                background: mode === key ? 'rgba(255,255,255,0.92)' : 'transparent',
                color: mode === key ? 'var(--archive-color-ink)' : 'var(--archive-color-muted)',
                boxShadow: mode === key ? '0 1px 4px rgba(29,35,41,0.13)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      {mode !== 'count' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
          {(mode === 'subject' ? semanticMap.families : semanticMap.scenes).map((item) => (
            <span key={item.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', font: '0.78rem/1.2 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
              <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '999px', background: item.color, display: 'inline-block', flexShrink: 0 }} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div className="assignment2-map-toolbar" aria-label="Map zoom controls">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="assignment2-map-toolbtn"
            aria-label="Zoom in"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="assignment2-map-toolbtn"
            aria-label="Zoom out"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title="Return to 100%"
            className="assignment2-map-toolbtn"
            aria-label="Return map to 100%"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </span>
          </button>
        </div>

        <div ref={containerRef} style={{ width: '100%', height: '580px', borderRadius: '1.1rem', overflow: 'hidden', background: '#d4d0c8' }} />
      </div>

      {metrics && (
        <p style={{ margin: 0, font: '0.78rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>
          {metrics.photoCount.toLocaleString()} photographs · {metrics.placeCount} places · {metrics.firstDate} — {metrics.lastDate} · click cluster to zoom · click point to pin
        </p>
      )}
    </div>
  )
}
