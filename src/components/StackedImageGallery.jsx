import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
const kineticEase = CustomEase.create(
  'kinetic-soft',
  'M0,0 C0.14,0.72 0.22,1.08 0.36,1.08 0.53,1.08 0.66,0.99 1,1',
)

function computeVerticalLayout(total, activeIndex, containerHeight, containerWidth) {
  const gap = 10
  const collapsedHeight = 66
  const expandedHeight = Math.max(
    containerHeight - (total - 1) * (collapsedHeight + gap),
    220,
  )

  return Array.from({ length: total }, (_, i) => {
    const before = i * (collapsedHeight + gap)
    const y = i <= activeIndex ? before : before + (expandedHeight - collapsedHeight)
    const isActive = i === activeIndex

    return {
      x: 0,
      y,
      width: containerWidth,
      height: isActive ? expandedHeight : collapsedHeight,
      opacity: isActive ? 1 : 0.94,
      scale: isActive ? 1 : 0.985,
      zIndex: isActive ? total + 2 : total - i,
      isActive,
    }
  })
}

function computeHorizontalLayout(total, activeIndex, containerWidth, containerHeight) {
  const gap = 10
  const collapsedWidth = Math.max(72, Math.min(112, containerWidth * 0.11))
  const expandedWidth = Math.max(
    containerWidth - (total - 1) * (collapsedWidth + gap),
    320,
  )

  let offset = 0
  return Array.from({ length: total }, (_, i) => {
    const isActive = i === activeIndex
    const width = isActive ? expandedWidth : collapsedWidth
    const x = offset
    offset += width + gap

    return {
      x,
      y: 0,
      width,
      height: containerHeight,
      opacity: isActive ? 1 : 0.97,
      scale: 1,
      zIndex: isActive ? total + 2 : total - i,
      isActive,
    }
  })
}

export default function StackedImageGallery({ items, reducedMotion }) {
  const frameRef = useRef(null)
  const cardRefs = useRef([])
  const imageRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [size, setSize] = useState({ width: 980, height: 620 })

  const clampedItems = useMemo(() => items.slice(0, 4), [items])
  const isDesktop = size.width >= 960

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      setSize({
        width: Math.round(rect?.width ?? 980),
        height: Math.round(rect?.height ?? 620),
      })
    })

    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean)
    if (!cards.length) {
      return
    }

    const layout = isDesktop
      ? computeHorizontalLayout(cards.length, activeIndex, size.width, size.height)
      : computeVerticalLayout(cards.length, activeIndex, size.height, size.width)

    cards.forEach((card, i) => {
      const image = imageRefs.current[i]
      const duration = reducedMotion ? 0.01 : 0.62
      const ease = reducedMotion ? 'none' : kineticEase

      gsap.to(card, {
        x: layout[i].x,
        y: layout[i].y,
        width: layout[i].width,
        height: layout[i].height,
        opacity: layout[i].opacity,
        scale: layout[i].scale,
        duration,
        ease,
        overwrite: true,
      })

      gsap.set(card, { zIndex: layout[i].zIndex })

      if (image) {
        gsap.to(image, {
          scale: layout[i].isActive ? 1.1 : isDesktop ? 1.03 : 1,
          duration: reducedMotion ? 0.01 : 0.9,
          ease: reducedMotion ? 'none' : 'power2.out',
          overwrite: true,
        })
      }
    })

  }, [activeIndex, isDesktop, reducedMotion, size.height, size.width])

  return (
    <section
      className="media-card relative mb-12 h-[72vh] min-h-[520px] overflow-hidden border border-slate-300/80 bg-white/70 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur-sm motion-safe:translate-y-12 motion-safe:opacity-0 lg:-ml-[8vw] lg:w-[calc(100%+10vw)]"
      aria-label="Project image stack"
      ref={frameRef}
    >
      <div className="relative h-full w-full">
        {clampedItems.map((item, index) => {
          const isActive = index === activeIndex
          return (
          <article
            key={item.src}
            className={`image-container stacked-card absolute top-0 overflow-hidden border border-slate-300/80 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.12)] ${isActive ? 'is-active' : ''}`}
            ref={(node) => {
              cardRefs.current[index] = node
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            tabIndex={0}
            aria-label={item.caption}
          >
            <img
              ref={(node) => {
                imageRefs.current[index] = node
              }}
              src={item.src}
              alt={item.caption}
              className="h-full w-full object-cover will-change-transform [filter:none]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/68 via-slate-900/14 to-transparent transition-opacity duration-300" />

            <div
              className="glass-overlay pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden px-4 py-3"
            >
              <div className="flex items-end justify-between gap-3">
                <p className="stage-title font-mono text-[13px] uppercase tracking-[0.1em] text-white">
                  {`${String(index + 1).padStart(2, '0')} / ${item.stage}`}
                </p>
                <span className="stage-meta font-mono text-[11px] uppercase tracking-[0.14em] text-white/90">
                  {`${index + 1}/4`}
                </span>
              </div>
              <p className="description-text mt-2 max-w-[48ch] text-[12px] leading-[1.35] text-white/95">
                {item.detail}
              </p>
            </div>
          </article>
        )})}
      </div>
    </section>
  )
}
