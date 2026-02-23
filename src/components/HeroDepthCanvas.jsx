import { useEffect, useRef } from 'react'
import hoverEffect from 'hover-effect'

export default function HeroDepthCanvas({ containerRef, reducedMotion }) {
  const mountRef = useRef(null)
  const hoverRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const container = containerRef?.current

    if (reducedMotion || !mount || !container) {
      return undefined
    }

    hoverRef.current = new hoverEffect({
      parent: mount,
      intensity: 0.14,
      speedIn: 0.6,
      speedOut: 0.6,
      easing: 'power2.out',
      hover: false,
      image1: '/media/cover.jpg',
      image2: '/media/cover.jpg',
      displacementImage: '/media/liquid-displacement.svg',
    })

    // Keep distortion state stable; only move the mask with cursor.
    hoverRef.current?.next?.()

    const setCursorState = (x, y) => {
      container.style.setProperty('--liquid-x', `${(x * 100).toFixed(2)}%`)
      container.style.setProperty('--liquid-y', `${(y * 100).toFixed(2)}%`)
    }

    const onMove = (event) => {
      const rect = container.getBoundingClientRect()
      const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
      const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1)

      setCursorState(x, y)
    }

    const onLeave = () => {
      setCursorState(0.5, 0.5)
    }

    container.addEventListener('pointermove', onMove, { passive: true })
    container.addEventListener('pointerenter', onMove, { passive: true })
    container.addEventListener('pointerleave', onLeave)

    return () => {
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerenter', onMove)
      container.removeEventListener('pointerleave', onLeave)
      mount.innerHTML = ''
      hoverRef.current = null
    }
  }, [containerRef, reducedMotion])

  if (reducedMotion) {
    return <div className="hero-static hero-cover-fallback" aria-hidden="true" />
  }

  return (
    <>
      <div className="hero-static hero-cover-fallback" aria-hidden="true" />
      <div className="hero-canvas hero-liquid" ref={mountRef} aria-hidden="true" />
    </>
  )
}
