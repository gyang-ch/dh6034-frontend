import { useEffect, useRef } from 'react'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/scale.css'

export default function GlobeView() {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const tooltipInstanceRef = useRef(null)
  const lastPointerRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    tooltipInstanceRef.current = tippy(container, {
      trigger: 'manual',
      allowHTML: true,
      animation: 'scale',
      arrow: true,
      theme: 'seadragon',
      placement: 'top',
      maxWidth: 260,
      offset: [0, 16],
      appendTo: () => document.body,
      getReferenceClientRect: () => {
        const rect = container.getBoundingClientRect()
        const { x, y } = lastPointerRef.current
        return new DOMRect(rect.left + x, rect.top + y, 0, 0)
      },
    })

    const handlePointerMove = (event) => {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      lastPointerRef.current = { x, y }
      if (tooltipInstanceRef.current?.state.isVisible) {
        tooltipInstanceRef.current.popperInstance?.update()
      }
    }

    container.addEventListener('pointermove', handlePointerMove)

    async function init() {
      const res = await fetch(`${import.meta.env.BASE_URL}photos.geojson`)
      const geojson = await res.json()
      if (cancelled) return

      const locationMap = new Map()
      for (const feature of geojson.features) {
        const [lng, lat] = feature.geometry.coordinates
        const place = feature.properties.place ?? ''
        const key = `${lng.toFixed(4)},${lat.toFixed(4)}`
        if (locationMap.has(key)) {
          locationMap.get(key).count++
        } else {
          locationMap.set(key, { lat, lng, count: 1, place })
        }
      }
      const points = Array.from(locationMap.values())
      const maxCount = Math.max(...points.map((p) => p.count))

      const GlobeGL = (await import('globe.gl')).default
      if (cancelled) return

      const globe = new GlobeGL(container)
      globeRef.current = globe

      globe
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-day.jpg')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(points)
        .pointLat((d) => d.lat)
        .pointLng((d) => d.lng)
        .pointAltitude((d) => 0.01 + (d.count / maxCount) * 0.35)
        .pointRadius((d) => 0.25 + (d.count / maxCount) * 1.8)
        .pointColor(() => '#3e5b71')
        .pointResolution(6)
        .pointLabel(() => null)
        .onPointHover((point) => {
          const tooltip = tooltipInstanceRef.current
          if (!tooltip) return

          if (!point) {
            tooltip.hide()
            return
          }

          tooltip.setContent(
            `<div style="display:grid;gap:0.18rem;padding:0.7rem 0.85rem;">
              <strong style="font-weight:600;">${point.place}</strong>
              <span style="color:rgba(226,232,240,0.86);">${point.count.toLocaleString()} photo${point.count !== 1 ? 's' : ''}</span>
            </div>`
          )
          tooltip.popperInstance?.update()
          tooltip.show()
        })
        .pointOfView({ lat: 30, lng: 105, altitude: 1.8 }, 0)
        .width(container.clientWidth)
        .height(container.clientHeight)

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.35

      resizeObserverRef.current = new ResizeObserver(() => {
        if (globeRef.current && container) {
          globeRef.current.width(container.clientWidth).height(container.clientHeight)
        }
      })
      resizeObserverRef.current.observe(container)
    }

    init()

    return () => {
      cancelled = true
      container.removeEventListener('pointermove', handlePointerMove)
      tooltipInstanceRef.current?.destroy()
      tooltipInstanceRef.current = null
      resizeObserverRef.current?.disconnect()
      globeRef.current = null
    }
  }, [])

  return (
    <div style={{ display: 'grid', gap: '0.6rem', width: 'min(100%, 56rem)', margin: '0 auto' }}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '1.25rem', overflow: 'hidden', background: '#0a0e14' }} />
      <p style={{ margin: 0, font: '0.82rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-muted)', paddingLeft: '0.25rem' }}>
        Drag to rotate · scroll to zoom · hover a spike for details
      </p>
    </div>
  )
}
