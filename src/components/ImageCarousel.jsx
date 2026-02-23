import { useMemo, useRef, useState } from 'react'

export default function ImageCarousel({ items }) {
  const slides = useMemo(() => items.slice(0, 4), [items])
  const [activeIndex, setActiveIndex] = useState(0)
  const frameRef = useRef(null)
  const imageRef = useRef(null)
  const [magnifier, setMagnifier] = useState({
    visible: false,
    x: 0,
    y: 0,
    frameWidth: 0,
    frameHeight: 0,
    drawOffsetX: 0,
    drawOffsetY: 0,
    bgPosX: 0,
    bgPosY: 0,
    bgSizeX: 0,
    bgSizeY: 0,
  })

  if (!slides.length) {
    return null
  }

  const lensSize = 160
  const zoom = 2.5

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  const activeSlide = slides[activeIndex]
  const hideMagnifier = () => {
    setMagnifier((prev) => ({ ...prev, visible: false }))
  }

  const handleMouseEnter = (event) => {
    const frame = frameRef.current
    const image = imageRef.current
    if (!frame || !image || !image.naturalWidth || !image.naturalHeight) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    const coverScale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight)
    const drawnWidth = image.naturalWidth * coverScale
    const drawnHeight = image.naturalHeight * coverScale
    const offsetX = (rect.width - drawnWidth) / 2
    const offsetY = (rect.height - drawnHeight) / 2

    setMagnifier((prev) => ({
      ...prev,
      visible: true,
      frameWidth: rect.width,
      frameHeight: rect.height,
      drawOffsetX: offsetX,
      drawOffsetY: offsetY,
      bgSizeX: drawnWidth * zoom,
      bgSizeY: drawnHeight * zoom,
    }))
  }

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height)

    setMagnifier((prev) => ({
      ...prev,
      visible: true,
      x,
      y,
      bgPosX: -(x - prev.drawOffsetX) * zoom + lensSize / 2,
      bgPosY: -(y - prev.drawOffsetY) * zoom + lensSize / 2,
    }))
  }

  return (
    <section
      className="media-card mb-12 border border-slate-300/80 bg-white/70 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur-sm motion-safe:translate-y-12 motion-safe:opacity-0 md:p-5"
      aria-label="Image gallery"
    >
      <div className="mx-auto w-full max-w-[72ch]">
        <div
          ref={frameRef}
          className="relative overflow-hidden border border-slate-300/80 bg-slate-50"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={hideMagnifier}
        >
          <img
            ref={imageRef}
            src={activeSlide.src}
            alt={activeSlide.caption}
            className="block h-[min(64vw,560px)] w-full object-cover md:h-[500px]"
            loading="lazy"
          />

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer border border-white/45 bg-slate-900/45 px-2.5 py-2 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-slate-900/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 md:left-3"
            aria-label="Previous image"
          >
            <span aria-hidden="true" className="block text-lg leading-none">‹</span>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border border-white/45 bg-slate-900/45 px-2.5 py-2 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-slate-900/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 md:right-3"
            aria-label="Next image"
          >
            <span aria-hidden="true" className="block text-lg leading-none">›</span>
          </button>

          <span
            aria-hidden="true"
            className={`pointer-events-none absolute hidden rounded-full border border-white/75 shadow-[0_10px_28px_rgba(15,23,42,0.34)] ring-1 ring-slate-900/25 md:block ${magnifier.visible ? 'opacity-100' : 'opacity-0'}`}
            style={{
              width: `${lensSize}px`,
              height: `${lensSize}px`,
              left: `${magnifier.x - lensSize / 2}px`,
              top: `${magnifier.y - lensSize / 2}px`,
              backgroundImage: `url("${activeSlide.src}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${magnifier.bgSizeX}px ${magnifier.bgSizeY}px`,
              backgroundPosition: `${magnifier.bgPosX}px ${magnifier.bgPosY}px`,
              border: '2px solid #cbd5e1',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.32)',
              backgroundColor: '#ffffff',
              transition: 'opacity 120ms ease-out',
            }}
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <p className="font-major text-xs uppercase tracking-[0.12em] text-slate-600">
            {`${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} · ${activeSlide.stage}`}
          </p>
          <p className="max-w-[52ch] text-right text-sm leading-6 text-slate-700">
            {activeSlide.caption}
          </p>
        </div>
      </div>
    </section>
  )
}
