import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ScrollCompass({ onScrollTop }) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollPercent, setScrollPercent] = useState(0)
  const circleRef = useRef(null)
  const containerRef = useRef(null)
  const wrapRef = useRef(null)
  // Ref tracks current visibility inside the scroll callback to avoid stale closures
  const isVisibleRef = useRef(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const st = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress
        const offset = 283 * (1 - progress)

        if (circleRef.current) {
          gsap.set([circleRef.current, '.progress-glow'], { strokeDashoffset: offset })
        }

        setScrollPercent(Math.round(progress * 100))

        const shouldBeVisible = self.scroll() > 400
        if (shouldBeVisible !== isVisibleRef.current) {
          isVisibleRef.current = shouldBeVisible
          setIsVisible(shouldBeVisible)
        }
      },
    })

    // Refresh ScrollTrigger whenever the page height changes — handles lazy-loaded
    // content expanding the page after mount, and tab switches changing content height.
    // Debounced to avoid rapid successive calls during layout transitions.
    let refreshTimer = null
    const observer = new ResizeObserver(() => {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 80)
    })
    observer.observe(document.documentElement)

    return () => {
      st.kill()
      observer.disconnect()
      clearTimeout(refreshTimer)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (!wrapRef.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = wrapRef.current.getBoundingClientRect()
    
    // Magnetic calculation
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    
    gsap.to(containerRef.current, {
      x: x * 0.18,
      y: y * 0.18,
      duration: 0.4,
      ease: 'power2.out'
    })
  }

  const handleMouseLeave = () => {
    gsap.to(containerRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(0.5, 0.4)'
    })
  }

  return (
    <div 
      ref={wrapRef}
      className={`fixed bottom-8 right-8 z-50 h-32 w-32 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={containerRef}
        onClick={onScrollTop}
        className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent group transition-colors duration-300"
        aria-label="Back to top"
      >
        {/* Progress SVG */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(13, 148, 136, 0.18)"
            strokeWidth="8"
          />
          {/* Outer Glow Circle */}
          <circle
            className="progress-glow blur-[2px] transition-[stroke] duration-500 group-hover:stroke-teal-500"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0d9488"
            strokeWidth="12"
            strokeDasharray="283"
            strokeDashoffset="283"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Main Progress Circle */}
          <circle
            ref={circleRef}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0d9488"
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset="283"
            strokeLinecap="round"
            className="transition-[stroke] duration-500 group-hover:stroke-teal-500"
          />
        </svg>

        {/* Up Arrow + Percentage stacked */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
          <svg
            width="16"
            height="13"
            viewBox="-2 -2 28 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="12,0 24,19 0,19"
              fill="#0d9488"
              stroke="#0d9488"
              strokeWidth="3"
              strokeLinejoin="round"
              className="transition-colors duration-300 group-hover:fill-teal-400 group-hover:stroke-teal-400"
            />
          </svg>
          <span className="font-mono text-[11px] font-bold leading-none text-teal-600 transition-colors duration-300 group-hover:text-teal-400 tabular-nums pointer-events-none">
            {scrollPercent}%
          </span>
        </div>

        {/* Hover Label */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-50 opacity-0 font-major text-[10px] uppercase tracking-widest text-teal-600 font-semibold transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">
          Back to Top
        </span>
      </button>
    </div>
  )
}
