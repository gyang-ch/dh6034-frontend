import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function MagneticLink({ onClick, children }) {
  const areaRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const area = areaRef.current
    const text = textRef.current
    if (!area || !text) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const handleMouseMove = (e) => {
      const { left, top, width, height } = area.getBoundingClientRect()
      const moveX = (e.clientX - (left + width / 2)) * 0.3
      const moveY = (e.clientY - (top + height / 2)) * 0.3
      gsap.to(text, { x: moveX, y: moveY, duration: 0.6, ease: 'power3.out' })
    }

    const handleMouseLeave = () => {
      gsap.to(text, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' })
    }

    area.addEventListener('mousemove', handleMouseMove)
    area.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      area.removeEventListener('mousemove', handleMouseMove)
      area.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <a
      href="/photoarchive"
      ref={areaRef}
      className="magnetic-hit-area"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <span ref={textRef} className="link-highlighter">
        {children}
      </span>
    </a>
  )
}
