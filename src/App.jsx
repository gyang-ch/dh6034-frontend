import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import ScrollCompass from './components/ScrollCompass'
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion'

const AssignmentOneNarrative = lazy(() => import('./components/AssignmentOneNarrative'))
const AssignmentTwoNarrative = lazy(() => import('./components/AssignmentTwoNarrative'))
const PhotoArchiveWindowed = lazy(() => import('./components/PhotoArchiveWindowed'))

function getAssignmentFromPath(pathname) {
  if (
    pathname === '/archive' ||
    pathname.startsWith('/archive/') ||
    pathname === '/photoarchive' ||
    pathname.startsWith('/photoarchive/') ||
    pathname === '/archive-windowed' ||
    pathname.startsWith('/archive-windowed/')
  ) {
    return 'archive-windowed'
  }
  if (pathname === '/assignment2' || pathname.startsWith('/assignment2/')) {
    return 'assignment2'
  }

  return 'assignment1'
}

export default function App() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const lenisRef = useRef(null)
  const [activeAssignment, setActiveAssignment] = useState(() => getAssignmentFromPath(window.location.pathname))

  useEffect(() => {
    const pathname = window.location.pathname
    const isAssignmentOnePath = pathname === '/assignment1' || pathname.startsWith('/assignment1/')
    const isAssignmentTwoPath = pathname === '/assignment2' || pathname.startsWith('/assignment2/')
    const isArchiveWindowedPath =
      pathname === '/archive' ||
      pathname.startsWith('/archive/') ||
      pathname === '/photoarchive' ||
      pathname.startsWith('/photoarchive/') ||
      pathname === '/archive-windowed' ||
      pathname.startsWith('/archive-windowed/')

    if (
      pathname === '/' ||
      (!isAssignmentOnePath && !isAssignmentTwoPath && !isArchiveWindowedPath)
    ) {
      window.history.replaceState({}, '', '/assignment1')
    }

    const handlePopState = () => {
      setActiveAssignment(getAssignmentFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }
    
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.1,
      prevent: (node) => node?.closest?.('[data-lenis-prevent]') != null,
    })

    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [prefersReducedMotion])

  const handleScrollTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.8 })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAssignmentChange = (assignment) => {
    setActiveAssignment(assignment)
    const nextPath = assignment === 'assignment2'
      ? '/assignment2'
      : assignment === 'archive-windowed'
      ? '/photoarchive'
      : '/assignment1'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    handleScrollTop()
  }

  return (
    <>
      <main
        className={`essay min-h-screen bg-[radial-gradient(circle_at_18%_16%,#f8f4de_0%,transparent_42%),radial-gradient(circle_at_84%_14%,#d7ebe8_0%,transparent_44%),linear-gradient(155deg,#f7f6f1_0%,#f0f7fb_100%)] text-slate-800 ${prefersReducedMotion ? 'reduced-motion' : ''}`}
      >
        <nav className="assignment-tabs z-40">
          <div className="assignment-tabs-inner mx-auto flex w-[min(112rem,calc(100vw-1.5rem))] items-center gap-4 px-3 md:w-[min(112rem,calc(100vw-3rem))] md:px-6">
            <a className="assignment-nav-brand" href="/assignment1" onClick={(event) => {
              event.preventDefault()
              handleAssignmentChange('assignment1')
            }}>
              <div className="assignment-nav-logo">DH</div>
              <span className="assignment-nav-title">DH6034 – John Smith</span>
            </a>
            <div className="assignment-tablist">
              <button
                type="button"
                onClick={() => handleAssignmentChange('assignment1')}
                className={`assignment-tab ${activeAssignment === 'assignment1' ? 'is-active' : ''}`}
                aria-pressed={activeAssignment === 'assignment1'}
              >
                Assignment 1
              </button>
              <button
                type="button"
                onClick={() => handleAssignmentChange('assignment2')}
                className={`assignment-tab ${activeAssignment === 'assignment2' ? 'is-active' : ''}`}
                aria-pressed={activeAssignment === 'assignment2'}
              >
                Assignment 2
              </button>
              <button
                type="button"
                onClick={() => handleAssignmentChange('archive-windowed')}
                className={`assignment-tab ${activeAssignment === 'archive-windowed' ? 'is-active' : ''}`}
                aria-pressed={activeAssignment === 'archive-windowed'}
              >
                Photo Archive
              </button>
            </div>
          </div>
        </nav>

        <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
          {activeAssignment === 'assignment1' ? (
            <AssignmentOneNarrative prefersReducedMotion={prefersReducedMotion} />
          ) : activeAssignment === 'assignment2' ? (
            <AssignmentTwoNarrative />
          ) : (
            <PhotoArchiveWindowed />
          )}
        </Suspense>
        {activeAssignment !== 'archive-windowed' ? (
          <footer className="border-t border-slate-300/80 bg-white/55 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto w-[min(96ch,calc(100vw-1.25rem))] md:w-[min(96ch,calc(100vw-2.5rem))] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 group cursor-default">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-700 font-bold font-serif group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                  DH
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 tracking-tight text-sm">
                    {activeAssignment === 'assignment1'
                      ? 'DH6034 Assignment 1 – John Smith'
                      : activeAssignment === 'assignment2'
                      ? 'DH6034 Assignment 2 – John Smith'
                      : activeAssignment === 'archive-windowed'
                      ? 'DH6034 Photo Archive V2 – John Smith'
                      : 'DH6034 Photo Archive – John Smith'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-major mt-0.5">Humanities & New Technologies</span>
                </div>
              </div>
              <p className="font-major m-0 text-xs tracking-[0.08em] text-slate-500">
                © 2026 John Smith. All Rights Reserved.
              </p>
            </div>
          </footer>
        ) : null}
        <ScrollCompass onScrollTop={handleScrollTop} />
      </main>
    </>
  )
}
