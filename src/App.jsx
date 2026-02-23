import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import EssaySection from './components/EssaySection'
import HeroDepthCanvas from './components/HeroDepthCanvas'
import ImageCarousel from './components/ImageCarousel'
import ProjectStatsCharts from './components/ProjectStatsCharts'
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion'
import { useGlassEffect } from './hooks/useGlassEffect'

export default function App() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const glassRef = useRef(null)

  useGlassEffect(glassRef, { prefersReducedMotion })

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }
    
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.1,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const sections = gsap.utils.toArray('.essay-section')
    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 72 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 86%',
            end: 'top 48%',
            scrub: 0.6,
          },
        },
      )
    })

    const mediaBlocks = gsap.utils.toArray('.media-card')
    mediaBlocks.forEach((block) => {
      gsap.fromTo(
        block,
        { opacity: 0, y: 56, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 90%',
            end: 'top 55%',
            scrub: 0.7,
          },
        },
      )
    })

    const noteCards = gsap.utils.toArray('.note-card')
    noteCards.forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            end: 'top 64%',
            scrub: 0.5,
          },
        },
      )
    })

    gsap.fromTo(
      '.hero-canvas',
      { yPercent: -6, scale: 1.04 },
      {
        yPercent: 8,
        scale: 1.09,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-shell',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.9,
        },
      },
    )

    gsap.fromTo(
      '.hero-overlay',
      { yPercent: 0 },
      {
        yPercent: -16,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-shell',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      },
    )

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [prefersReducedMotion])

  const fieldPhotos = [
    {
      src: '/media/1-Feb_1.jpeg',
      caption: 'Initial onboarding workflow in Monsoon Voyages.',
      stage: 'ONBOARDING',
      detail:
        'Account setup, tutorial familiarization, and first-pass reading of tabular weather notation before committing any values.',
    },
    {
      src: '/media/8-Feb_2.jpeg',
      caption: 'Close reading and classification session.',
      stage: 'CLASSIFYING',
      detail:
        'Line-by-line interpretation of handwriting and symbols, with cross-checking across adjacent rows to reduce transcription drift.',
    },
    {
      src: '/media/13-Feb_1.jpeg',
      caption: 'Later-stage confidence and consistency checks.',
      stage: 'VERIFYING',
      detail:
        'Verification pass focused on ambiguous numerals, contextual plausibility, and alignment with expected meteorological ranges.',
    },
    {
      src: '/media/Screenshot_1.jpeg',
      caption: 'Interface state from my contribution process.',
      stage: 'SYNTHESIS',
      detail:
        'Final interaction snapshot showing workflow status, completion momentum, and the interface logic guiding contribution quality.',
    },
  ]

  return (
    <>
      <main
        className={`essay min-h-screen bg-[radial-gradient(circle_at_18%_16%,#f8f4de_0%,transparent_42%),radial-gradient(circle_at_84%_14%,#d7ebe8_0%,transparent_44%),linear-gradient(155deg,#f7f6f1_0%,#f0f7fb_100%)] text-slate-800 ${prefersReducedMotion ? 'reduced-motion' : ''}`}
      >
        <header
          ref={heroRef}
          className="hero-shell relative grid min-h-screen place-items-center overflow-clip border-b border-slate-300/70"
        >
          <HeroDepthCanvas containerRef={heroRef} reducedMotion={prefersReducedMotion} />
          <div className="absolute inset-0 z-[1] bg-slate-900/40" aria-hidden="true" />
          <div ref={glassRef} className="hero-overlay glass-card glass-card-interactive relative z-10 mx-auto w-[min(88ch,calc(100vw-2.5rem))] px-5 py-14 md:px-10 md:py-20">
            <h1 className="font-title max-w-[18ch] text-[clamp(2rem,6vw,4.6rem)] font-semibold leading-[1.05] tracking-tight text-slate-50">
              Monsoon Voyages: Seeing Data, History, and Care
            </h1>
            <p className="subtitle font-subtitle mt-5 max-w-[64ch] text-[clamp(1rem,1.7vw,1.3rem)] leading-8 text-slate-100/95">
              A reflective multimedia essay about contribution, ethics, and underrepresented archives.
            </p>
            <p
              className="scroll-cue font-major lux-kicker mt-10 text-xs text-slate-100/85 animate-bob"
              aria-hidden="true"
            >
              Scroll to enter the essay
            </p>
            <p className="font-major mt-8 border-t border-white/45 pt-4 text-[0.72rem] leading-5 text-slate-100/90">
              Cover image: Two ships being repaired at Victoria Dock, Singapore in the 1890s. (Source:{' '}
              <a
                href="https://www.nlb.gov.sg/main/image-detail?cmsuuid=881ed7a7-0224-4c9f-85c4-1e06a2f6a2bd"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-100/80 underline-offset-2 hover:text-white"
              >
                NLB Singapore
              </a>
              . All rights reserved).
            </p>
          </div>
        </header>

        <section className="mx-auto w-[min(84ch,calc(100vw-1.25rem))] px-2 pb-24 pt-8 md:w-[min(84ch,calc(100vw-2.5rem))] md:pt-14">
          <article className="essay-flow w-full">
          <EssaySection title="The Process" id="process">
            <p>
              I participated in the Monsoon Voyages project on Zooniverse. At first, I compared two projects:
              Dear Monsieur Sampaio and Monsoon Voyages. I finally selected Monsoon Voyages because the workflow
              depended on reading and entering numerical weather observations, which matched my skills better than
              Portuguese-language transcription.
            </p>
            <p>
              The project asks volunteers to digitize weather records from historical ship logbooks that crossed the
              Straits of Southeast Asia. These pages are not simple scans; they require judgement, close reading,
              and repeated checking of handwriting, ditto marks, and column structure. The task is broken into targeted
              workflows so each contributor can focus on one parameter at a time.
            </p>
            <p>
              I approached the work as interpretive verification rather than fast clicking. I used zoom, compared adjacent
              rows, and entered best estimates when numbers were difficult to parse. Knowing that each page is classified
              by six people changed my behavior: my goal was not perfection in isolation, but careful contribution to a
              collective consensus process.
            </p>
            <p>
              This process clarified a core methodological point for me: crowdsourced humanities data is strongest when
              contributors understand both the interface mechanics and the historical context behind what they are typing.
            </p>
          </EssaySection>

          <ImageCarousel items={fieldPhotos} />

          <EssaySection title="Implications of My Contribution" id="implications">
            <p>
              The significance of this work extends beyond one transcription exercise. Accurate rainfall reconstruction
              matters directly to contemporary life in Southeast Asia, where both prolonged dry spells and intense rain
              events can create severe social and infrastructural stress. Climate researchers expect extremes to increase,
              but uncertainty remains high because pre-1960 rainfall records are sparse.
            </p>
            <p>
              Monsoon Voyages contributes to closing that historical data gap. The project brings together over 200 logbooks
              and 34,748 days of observations, with data intended to support major climate datasets such as ICOADS and
              downstream reanalysis systems. In this sense, volunteer input participates in long-horizon infrastructure:
              better historical baselines improve future forecasting.
            </p>
            <p>
              The project also has ethical depth. Many of these records were produced by Royal Navy vessels operating within
              colonial routes and power structures. Digitizing them does not neutralize that history. Instead, it creates
              an opportunity to critically reuse imperial records for present-day climate resilience, while remaining explicit
              about how and why those records were made.
            </p>
            <p>
              I also noticed that many crowdsourcing projects visible on major platforms are Western-centered. Choosing a
              Southeast Asian case was, for me, a deliberate act of regional attention.
            </p>
          </EssaySection>

          <ProjectStatsCharts />

          <section
            className="method-panel media-card mb-12 grid grid-cols-1 gap-4 border border-slate-300/80 bg-white/70 p-4 shadow-[0_14px_42px_rgba(15,23,42,0.08)] backdrop-blur-sm motion-safe:translate-y-12 motion-safe:opacity-0 md:grid-cols-3"
            aria-label="Method notes"
          >
            <article className="note-card border border-slate-300/80 bg-gradient-to-br from-teal-50 to-white p-4 motion-safe:translate-y-8 motion-safe:opacity-0">
              <h3 className="font-major mb-2 text-sm uppercase tracking-[0.06em] text-slate-800">
                Data Recovery Scale
              </h3>
              <p className="m-0 text-[0.97rem] leading-7 text-slate-600">
                The project aggregates over 200 UKHO logbooks and 34,748 observation-days from ships that crossed the
                Bay of Bengal, Andaman Sea, China Seas, and ports along the Malacca Strait.
              </p>
            </article>
            <article className="note-card border border-slate-300/80 bg-gradient-to-br from-amber-50 to-white p-4 motion-safe:translate-y-8 motion-safe:opacity-0">
              <h3 className="font-major mb-2 text-sm uppercase tracking-[0.06em] text-slate-800">
                Why It Matters
              </h3>
              <p className="m-0 text-[0.97rem] leading-7 text-slate-600">
                Recovering pre-1960 rainfall evidence reduces uncertainty in regional climate history and helps improve
                projections of extreme drought and rainfall events.
              </p>
            </article>
            <article className="note-card border border-slate-300/80 bg-gradient-to-br from-sky-50 to-white p-4 motion-safe:translate-y-8 motion-safe:opacity-0">
              <h3 className="font-major mb-2 text-sm uppercase tracking-[0.06em] text-slate-800">
                Research Context
              </h3>
              <p className="m-0 text-[0.97rem] leading-7 text-slate-600">
                Monsoon Voyages is part of the OUR Project and the Water Security programme funded by Singapore MOE
                AcRF Tier 2, focused on extending consistent regional rainfall records back to the 1900s.
              </p>
            </article>
          </section>

          <EssaySection title="What I Learned" id="learned">
            <p>
              I learned that historical logbooks are hybrid documents. They contain technical weather measures, but also
              traces of trade routes, labor structures, and political conditions onboard ships. That dual character makes
              them valuable for both climate science and humanities interpretation.
            </p>
            <p>
              I also developed practical micro-skills: reading variable handwriting, handling uncertain values, and applying
              internal plausibility checks against expected ranges. The platform design, especially workflow separation and
              consensus review, helped me understand how distributed contributors can generate robust datasets over time.
            </p>
            <p>
              Conceptually, this shifted my view of crowdsourcing. I now see it as structured interpretive labor rather than
              neutral data entry. Every value typed into the interface is part of a chain that connects archives, volunteers,
              domain experts, quality control, and eventually model-based climate knowledge.
            </p>
            <p>
              The most important insight for me was that data rescue is not just retrospective archival care. It is also
              prospective governance: how we reconstruct the past affects how well we can prepare for future climate risks.
            </p>
          </EssaySection>

          <section className="mb-14 grid grid-cols-1 lg:grid-cols-10">
            <blockquote className="pull-quote media-card lg:col-span-7 border-l-4 border-amber-600 bg-white/65 px-6 py-8 text-[clamp(1.5rem,3vw,2.45rem)] leading-[1.34] tracking-[0.01em] text-slate-800 shadow-[0_12px_34px_rgba(15,23,42,0.08)] motion-safe:translate-y-12 motion-safe:opacity-0">
              "I learned that interface tasks are interpretive labor, and interpretation is never context-free."
            </blockquote>
            <div className="hidden lg:block lg:col-span-3" aria-hidden="true" />
          </section>

          <EssaySection title="Application to My Own Work" id="application">
            <p>
              I can apply this model in my own humanities research by combining annotation tasks with explicit uncertainty
              protocols. Instead of treating transcription as a purely mechanical stage, I would design workflows that
              record confidence, ambiguity, and rationale as part of the dataset.
            </p>
            <p>
              I am also interested in adapting this approach to regional archives in Southeast Asia where documentation is
              fragmented across languages and institutions. A community-engaged workflow, if carefully moderated, can
              accelerate access while preserving critical awareness of context and provenance.
            </p>
            <p>
              The key lesson I will carry forward is design alignment: participant capability, workflow granularity, and
              quality-control architecture must be planned together. When those elements align, crowdsourcing can support
              both scholarship and public knowledge in a meaningful way.
            </p>
          </EssaySection>

          <EssaySection title="Conclusion" id="conclusion">
            <p>
              Monsoon Voyages demonstrates how volunteer labor, archival materials, and climate science can be linked through
              carefully designed digital workflows. My participation made clear that even small acts of transcription can
              contribute to large-scale scientific reconstruction when they are embedded in consensus and review.
            </p>
            <p>
              This essay interface treats motion and media as argument rather than decoration. The goal is to show that
              method, ethics, and representation are inseparable in digital humanities practice, especially when working
              with colonial-era records and climate futures.
            </p>
          </EssaySection>

          <EssaySection title="References" id="references">
            <ol className="m-0 list-decimal space-y-3 pl-6">
              <li>
                Lee, K.L. (2009) <em>Two ships being repaired at Victoria Dock, Singapore in the 1890s</em> [Online image]. Lee Kip Lin Collection, National Library Board, Singapore. Available at:{' '}
                <a
                  href="https://www.nlb.gov.sg/main/image-detail?cmsuuid=881ed7a7-0224-4c9f-85c4-1e06a2f6a2bd"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://www.nlb.gov.sg/main/image-detail?cmsuuid=881ed7a7-0224-4c9f-85c4-1e06a2f6a2bd
                </a>{' '}
                [Accessed 23 February 2026].
              </li>
            </ol>
          </EssaySection>
          </article>
        </section>
        <footer className="border-t border-slate-300/80 bg-white/55 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto w-[min(110rem,calc(100vw-1.25rem))] text-center md:w-[min(110rem,calc(100vw-2.5rem))] md:text-left">
            <p className="font-major m-0 text-xs tracking-[0.08em] text-slate-700 md:text-sm">
              © 2026 John Smith. All Rights Reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
