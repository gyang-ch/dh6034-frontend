import { useEffect, useRef, useState } from 'react'

export default function StagedVisual({ label = 'Preparing visual field', minHeight = '30rem', delay = 420, eager = false, children }) {
  const hostRef = useRef(null)
  const [mounted, setMounted] = useState(eager)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const actualDelay = reducedMotion ? 0 : delay

    if (eager) {
      const timer = setTimeout(() => setRevealed(true), actualDelay)
      return () => clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setMounted(true)
          const timer = setTimeout(() => setRevealed(true), actualDelay)
          observer.disconnect()
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.2, rootMargin: '160px 0px' }
    )

    if (hostRef.current) observer.observe(hostRef.current)
    return () => observer.disconnect()
  }, [eager, delay])

  return (
    <div ref={hostRef} className="archive-stage-shell" style={{ minHeight, position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          minHeight,
          borderRadius: '1.5rem',
          background: 'linear-gradient(180deg,rgba(244,240,231,0.78),rgba(238,233,223,0.9))',
        }}
      >
        {mounted && (
          <div style={{ minHeight, opacity: revealed ? 1 : 0, transition: 'opacity 420ms ease' }}>
            {children}
          </div>
        )}
        {!revealed && (
          <div
            className="archive-stage-veil"
            aria-hidden={revealed}
            style={{
              position: 'absolute', inset: 0,
              display: 'grid', placeContent: 'center', gap: '0.9rem',
              padding: '1.5rem',
              background: 'linear-gradient(180deg,rgba(242,237,227,0.88),rgba(234,228,217,0.94)),radial-gradient(circle at 18% 22%,rgba(62,91,113,0.06),transparent 34%)',
              borderRadius: 'inherit',
              transition: 'opacity 420ms ease',
              opacity: revealed ? 0 : 1,
              pointerEvents: 'none',
            }}
          >
            <div className="archive-stage-loader" style={{
              width: '2.8rem', height: '2.8rem',
              border: '1px solid rgba(62,91,113,0.14)',
              borderTopColor: 'rgba(62,91,113,0.55)',
              borderRadius: '999px',
              animation: 'archive-stage-spin 1s linear infinite',
              justifySelf: 'center',
            }} />
            <p style={{ margin: 0, font: '600 0.76rem/1.2 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
              {label}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
