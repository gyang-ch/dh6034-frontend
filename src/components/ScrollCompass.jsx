import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ScrollCompass({ onScrollTop }) {
  const [isVisible, setIsVisible] = useState(false)
  const circleRef = useRef(null)
  const needleRef = useRef(null)
  const containerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Progress animation linked to scroll
    const st = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress
        const offset = 283 * (1 - progress)
        
        // Update progress ring and its glow
        if (circleRef.current) {
          gsap.set([circleRef.current, '.progress-glow'], { strokeDashoffset: offset })
        }
        
        // Rotate compass needle based on scroll (2 full rotations over the page)
        if (needleRef.current) {
          gsap.set(needleRef.current, { rotation: progress * 720 })
        }
        
        // Visibility toggle
        if (self.scroll() > 400) {
          if (!isVisible) setIsVisible(true)
        } else {
          if (isVisible) setIsVisible(false)
        }
      },
    })

    return () => st.kill()
  }, [isVisible])

  const handleMouseMove = (e) => {
    if (!wrapRef.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = wrapRef.current.getBoundingClientRect()
    
    // Magnetic calculation
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    
    gsap.to(containerRef.current, {
      x: x * 0.4,
      y: y * 0.4,
      duration: 0.4,
      ease: 'power2.out'
    })
  }

  const handleMouseLeave = () => {
    gsap.to(containerRef.current, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.3)'
    })
  }

  return (
    <div 
      ref={wrapRef}
      className={`fixed bottom-8 right-8 z-50 h-20 w-20 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={containerRef}
        onClick={onScrollTop}
        className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent group transition-all duration-300"
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
            strokeWidth="5"
          />
          {/* Outer Glow Circle */}
          <circle
            className="progress-glow blur-[2px] transition-[stroke] duration-500 group-hover:stroke-teal-500"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0d9488"
            strokeWidth="8"
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
            strokeWidth="5"
            strokeDasharray="283"
            strokeDashoffset="283"
            strokeLinecap="round"
            className="transition-[stroke] duration-500 group-hover:stroke-teal-500"
          />
        </svg>

        {/* Compass Needle Icon */}
        <div ref={needleRef} className="relative z-10 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-slate-100 drop-shadow-[0_6px_8px_rgba(0,0,0,0.65)]"
          >
            {/* North Point (Dark Teal) */}
            <path
              d="M12 3L15 12L12 11L9 12L12 3Z"
              fill="#0d9488"
              className="group-hover:fill-teal-500 transition-colors"
            />
            {/* South Point (White) */}
            <path
              d="M12 21L9 12L12 13L15 12L12 21Z"
              fill="white"
              fillOpacity="0.9"
            />
            {/* Center Pivot */}
            <circle cx="12" cy="12" r="1.5" fill="#0f172a" />
          </svg>
        </div>

        {/* Hover Label */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-50 opacity-0 font-major text-[10px] uppercase tracking-widest text-teal-600 font-semibold transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">
          Return North
        </span>
      </button>
    </div>
  )
}
