import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollytellingGallery({ items, reducedMotion }) {
  const sectionRef = useRef(null)
  const imageRefs = useRef([])
  const textRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(0)

  const clampedItems = useMemo(() => items.slice(0, 4), [items])

  useEffect(() => {
    if (!clampedItems.length) {
      return undefined
    }

    const images = imageRefs.current.filter(Boolean)
    if (!images.length) {
      return undefined
    }

    const fadeDuration = reducedMotion ? 0.01 : 0.55
    const fadeEase = reducedMotion ? 'none' : 'power2.out'

    const switchImage = (nextIndex) => {
      setActiveIndex(nextIndex)
      gsap.to(images, {
        autoAlpha: 0,
        duration: fadeDuration,
        ease: fadeEase,
        overwrite: true,
      })
      gsap.to(images[nextIndex], {
        autoAlpha: 1,
        duration: fadeDuration,
        ease: fadeEase,
        overwrite: true,
      })
    }

    const ctx = gsap.context(() => {
      gsap.set(images, { autoAlpha: 0 })
      gsap.set(images[0], { autoAlpha: 1 })

      textRefs.current.forEach((block, index) => {
        if (!block) {
          return
        }

        ScrollTrigger.create({
          trigger: block,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => switchImage(index),
          onEnterBack: () => switchImage(index),
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [clampedItems, reducedMotion])

  return (
    <section
      ref={sectionRef}
      className="media-card mb-12 border border-slate-300/80 bg-white/65 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur-sm motion-safe:translate-y-12 motion-safe:opacity-0"
      aria-label="Scrollytelling image sequence"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="px-2 pb-10 pt-4 md:px-4 lg:px-6 lg:py-8">
          <div className="space-y-[52vh]">
            {clampedItems.map((item, index) => (
              <article
                key={`${item.src}-${item.stage}`}
                ref={(node) => {
                  textRefs.current[index] = node
                }}
                className="min-h-[44vh] border-l-4 border-slate-300 pl-4 md:min-h-[50vh] md:pl-5"
                aria-label={`Step ${item.stage}`}
              >
                <p className="font-major text-xs uppercase tracking-[0.13em] text-slate-500">
                  {`Step ${String(index + 1).padStart(2, '0')} / ${item.stage}`}
                </p>
                <h3 className="font-title mt-2 text-xl leading-tight text-slate-900 md:text-2xl">
                  {item.caption}
                </h3>
                <p className="mt-3 max-w-[56ch] text-base leading-8 text-slate-700 md:text-lg">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-0 lg:h-screen">
          <div className="relative h-[56vh] min-h-[400px] overflow-hidden border border-slate-300/80 bg-slate-50 lg:h-full">
            {clampedItems.map((item, index) => (
              <img
                key={`scrolly-${item.src}`}
                ref={(node) => {
                  imageRefs.current[index] = node
                }}
                src={item.src}
                alt={item.caption}
                className="absolute inset-0 h-full w-full object-contain"
                loading="lazy"
              />
            ))}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/54 via-slate-900/16 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-4 py-4 md:px-6 md:py-5">
              <p className="font-major text-xs uppercase tracking-[0.12em] text-white/90">
                {clampedItems[activeIndex]?.stage ?? ''}
              </p>
              <p className="font-subtitle mt-1 text-base leading-6 text-white/95 md:text-lg">
                {clampedItems[activeIndex]?.caption ?? ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
