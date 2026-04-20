import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import EssaySection from './components/EssaySection'
import ArchiveViewer from './components/ArchiveViewer'
import TranscriptionView from './components/TranscriptionView'
import ScrollCompass from './components/ScrollCompass'
import AssignmentTwoNarrative from './components/AssignmentTwoNarrative'
import PhotoArchiveWindowed from './components/PhotoArchiveWindowed'
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion'
import { assignmentOneMediaUrl } from './lib/photographs'

function getAssignmentFromPath(pathname) {
  if (
    pathname === '/archive' ||
    pathname.startsWith('/archive/') ||
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

function getAssignmentOneMediaPath(filename) {
  return assignmentOneMediaUrl(filename)
}

export default function App() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const glassRef = useRef(null)
  const lenisRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeAssignment, setActiveAssignment] = useState(() => getAssignmentFromPath(window.location.pathname))

  useEffect(() => {
    const pathname = window.location.pathname
    const isAssignmentOnePath = pathname === '/assignment1' || pathname.startsWith('/assignment1/')
    const isAssignmentTwoPath = pathname === '/assignment2' || pathname.startsWith('/assignment2/')
    const isArchiveWindowedPath =
      pathname === '/archive' ||
      pathname.startsWith('/archive/') ||
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

    const archiveElements = gsap.utils.toArray('.media-card, .essay-figure, .stats-card, .transcription-entrance')
    archiveElements.forEach((el) => {
      gsap.fromTo(
        el,
        { 
          opacity: 0, 
          y: 30,
          scale: 1.05,
          filter: 'grayscale(1) brightness(0.9)'
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'grayscale(0) brightness(1)',
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            end: 'top 70%',
            scrub: 1.2,
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
      '.hero-bg',
      { yPercent: 0 },
      {
        yPercent: 12,
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
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-shell',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      },
    )

    const figureTiltTargets = gsap.utils.toArray('.essay-figure--outset img')
    const figureTiltCleanups = figureTiltTargets.map((target) => {
      const handlePointerMove = (event) => {
        if (event.pointerType === 'touch') {
          return
        }

        const rect = target.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const xPercent = (x / rect.width - 0.5) * 2
        const yPercent = (y / rect.height - 0.5) * 2

        gsap.to(target, {
          rotateY: xPercent * 2.4,
          rotateX: -yPercent * 2.4,
          scale: 1.015,
          y: -4,
          transformPerspective: 1200,
          transformOrigin: 'center center',
          duration: 0.35,
          ease: 'power2.out',
        })
      }

      const handlePointerLeave = () => {
        gsap.to(target, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
        })
      }

      target.addEventListener('pointermove', handlePointerMove)
      target.addEventListener('pointerleave', handlePointerLeave)

      return () => {
        target.removeEventListener('pointermove', handlePointerMove)
        target.removeEventListener('pointerleave', handlePointerLeave)
        gsap.killTweensOf(target)
      }
    })

    return () => {
      figureTiltCleanups.forEach((cleanup) => cleanup())
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [prefersReducedMotion, activeAssignment])

  const projectImages = [
    "1-Feb_1.jpeg", "2-Feb_1.jpeg", "2-Feb_2.jpeg", 
    "5-Feb_1.jpeg", "6-Feb_1.jpeg", "6-Feb_2.jpeg", "6-Feb_3.jpeg", 
    "6-Feb_4.jpeg", "8-Feb_1.jpeg", "8-Feb_2.jpeg", "10-Feb_1.jpeg", 
    "13-Feb_1.jpeg", "19-Feb_1.jpeg"
  ].map((img) => ({
    src: getAssignmentOneMediaPath(`project_images/${img}`),
    caption: `Archival ship logbook entry: ${img}`,
    stage: 'ARCHIVAL RECORD',
    detail: `High-resolution digitized page from the Monsoon Voyages collection, specifically showing record ${img}. These documents require precise transcription of meteorological observations.`
  }))

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
      ? '/archive-windowed'
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

        {activeAssignment === 'assignment1' ? (
          <>
        <header
          ref={heroRef}
          className="hero-shell relative grid min-h-screen place-items-center overflow-clip border-b border-slate-300/70 bg-slate-900"
        >
          <div
            className="hero-bg absolute inset-0 z-0"
            style={{ backgroundImage: `url("${getAssignmentOneMediaPath('hero.jpg')}")` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 z-[1] bg-slate-950/40" aria-hidden="true" />
          <div ref={glassRef} className="hero-overlay glass-card relative z-10 mx-auto w-[min(92ch,calc(100vw-3rem))] px-8 pt-8 pb-10 md:px-16 md:pt-12 md:pb-14">
            <h1 className="font-title max-w-[18ch] text-[clamp(2rem,6vw,4.6rem)] font-semibold leading-[1.15] tracking-tight text-slate-50">
              Reflections on Monsoon Voyages: Crowdsourcing the Climate of the Past
            </h1>

            <p
              className="scroll-cue font-major lux-kicker mt-10 text-xs text-slate-100/85 animate-bob"
              aria-hidden="true"
            >
              Scroll to enter the essay
            </p>
            <p className="font-major mt-8 border-t border-teal-400/50 pt-4 text-[0.72rem] leading-5 text-slate-100/90">
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

        <section className="mx-auto w-[min(96ch,calc(100vw-1.25rem))] px-2 pb-24 pt-8 md:w-[min(96ch,calc(100vw-2.5rem))] md:pt-14">
          <article className="essay-flow w-full">
          <EssaySection title="The Process" id="process">
            <p>
              I participated in the Monsoon Voyages project.
              Initially, I was considering these two projects:
            </p>
            <ol className="project-choice-list list-decimal pl-6">
              <li>
                <a
                  href="https://www.zooniverse.org/projects/mhnc-dot-up/dear-monsieur-sampaio-dot-dot-dot"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  Dear Monsieur Sampaio
                </a>
              </li>
              <li>
                <a
                  href="https://www.zooniverse.org/projects/p-teleti/monsoon-voyages"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  Monsoon Voyages
                </a>
              </li>
            </ol>
            <p>
              I was also initially interested in the first project, which involves transcribing the personal correspondence 
              of the Portuguese botanist Gonçalo Sampaio from the late 1880s to 1936, since my MA research also involves 
              botany. However, I later realised that, because I do not know Portuguese, I would not be able to transcribe the 
              documents faithfully. Therefore, I decided to join the Monsoon Voyages project instead.
            </p>
            <p>
              The Monsoon Voyages project focuses on transcribing weather records written in English from voyages in 19th- 
              and 20th-century Singapore. I am interested in it because I have travelled to Malaysia and am familiar with 
              the legendary Malacca Strait near Malaysia and Singapore. 
            </p>
            <p>
              When I joined the project, there was mainly one type of task: transcribing wind direction data from the documents. 
              I read the instructions in the tutorial section and then began transcribing. My input should align with the 
              instructions; for example, wind direction data could take the forms such as “NbyE”, “SW”, or “Calm”.
            </p>
            <figure className="essay-figure essay-figure--outset">
              <img
                src={getAssignmentOneMediaPath('Figure1.jpeg')}
                alt="Zooniverse transcription workflow"
              />
              <figcaption><strong>Figure 1</strong>: Zooniverse transcription workflow.</figcaption>
            </figure>

            <p>
              To improve my transcription accuracy, I experimented with transcription tools such as{' '}
              <a
                href="https://www.transkribus.org/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                Transcribus
              </a>
              . However, 
              I found that its transcribing results for this type of handwritten document were not reliable at all, so I 
              abandoned this approach <span className="in-text-cite">(READ-COOP, n.d.)</span>.
            </p>
            <figure className="essay-figure essay-figure--outset">
              <img
                src={getAssignmentOneMediaPath('Figure2.jpeg')}
                alt="Experiment with Transcribus"
              />
              <figcaption><strong>Figure 2</strong>: Experiment with Transcribus.</figcaption>
            </figure>
            <p>
              I encountered several challenges during the process. For instance, some handwritten text was very unclear or 
              used highly unique personal abbreviations that were difficult to recognise, such as abbreviations 
              for “by” in wind direction notation. Also, sometimes the writer used an abbreviation symbol consisting of 
              two short strokes to indicate that the value in an entry was the same as the entry above. I was unsure whether 
              to transcribe the marks literally or to transcribe the implied content (i.e. same as the previous entry). 
              Therefore, I posted such questions in the Talk section of the project and attached images of the relevant documents.
            </p>
            <figure className="essay-figure essay-figure--outset">
              <img
                src={getAssignmentOneMediaPath('Figure3.jpeg')}
                alt="My post in the Talk section"
              />
              <figcaption><strong>Figure 3</strong>: My post in the Talk section.</figcaption>
            </figure>

          </EssaySection>

          <ArchiveViewer items={projectImages} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

          <EssaySection title="Implications of My Contribution" id="implications">
            <p>
              I contributed to the project in two main ways: first, I transcribed with care and patience which ensured my 
              transcribing accuracy. Second, I contributed to the Talk section with questions and necessary notes on some 
              document images, for example, in cases where parts of a document were obscured or partially covered. 
            </p>
            <p>
              Beyond my individual transcription tasks, my contribution supports the interdisciplinary project that links 
              climate history with contemporary climate science. On the{' '}
              <a
                href="https://urban.smu.edu.sg/projects/monsoon-voyages"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                Monsoon Voyages’ website
              </a>
              , it states the project’s 
              objective: to use historical weather data to establish climate baselines, which supports climate modelling 
              and further helps societies prepare for climate change <span className="in-text-cite">(Singapore Management University, n.d.)</span>.
            </p>
            <p>
              Although I did not have access to the full dataset available to the researchers, I developed a digital reconstruction and data 
              visualisation based on a single logbook image, as illustrated below.
            </p>
            <TranscriptionView />
            <p>
              Additionally, many projects on Zooniverse are initiated by Western institutions and focus on European or 
              North American archives. My work on the Monsoon Voyages project, which is managed by Singapore Management 
              University and centred on Southeast Asia, contributes to a more geographically balanced climate history. 
            </p>
            <p>
              Furthermore, my contributions support the project’s broader objective of advancing research on Singapore’s 
              administration under the British colonial system. 
            </p>
            <p>
              Regarding the <span style={{ color: '#0570ff', fontWeight: 500 }}>ethical dimensions</span> of crowdsourced work, I would like to argue from two angles. First, 
              transcription accuracy is not guaranteed. The expertise of participants varies. This may affect the 
              reliability of the results. Second, although volunteers on Zooniverse contribute their labour to the 
              project, the final research outputs are typically attributed to the host institutions. This raises an 
              ethical question: should volunteers be credited in academic contexts?
            </p>
            <p>
              Computer science and digital humanities projects often require large amounts of annotation work, and 
              researchers often recruit undergraduate students at their universities to perform the tasks. In some cases, 
              the students are insufficiently compensated, and this raises questions about underpaid labour.
            </p>
            <p>
              As a contributor, I am also aware of the responsibility I take when conducting the transcription task. 
              I also noticed that although my contributions were recorded by Zooniverse, I still have no share on 
              the academic authorship <span className="in-text-cite">(Zooniverse, n.d.)</span>.
            </p>
          </EssaySection>

          <EssaySection title="What I Learnt" id="learned">
            <p>
              On a practical level, my transcription skills and ability to recognise handwritten cursive English scripts 
              have improved. My overall engagement with crowdsourcing projects has increased as well. I also practised 
              my data analysis and visualisation skills by extracting data from logbook images, reconstructing the tables digitally, and using{' '}
              <a
                href="https://d3js.org/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                d3.js
              </a>{' '}
              to 
              visualise them on my website. I will explore this direction further in Assignment 2. 
            </p>
            <p>
              My experience in the project has deepened my knowledge and vision in the history of scientific knowledge 
              and practices. I realised the link between the humanities and climate science, since the project uses historical 
              climate data to support climate modelling.
            </p>
            <p>
              Furthermore, I gained deep insights into the historical colonial practices of classifying and standardising 
              nature. I realised that these weather logbooks were not just neutral observations; they were instruments of <span style={{ color: '#0570ff', fontWeight: 500 }}>Meteorological Imperialism</span>,  
              which the British colonial system used to classify and control maritime space around the Malacca Strait <span className="in-text-cite">(Williamson, 2015)</span>.
            </p>
            <p>
              This experience has further amplified my experience with crowdsourcing, although I had participated in similar 
              projects before.
            </p>
            <p>
              I also learnt about the limitations of current AI transcription tools such as Transcribus. They struggle with 
              such handwritten maritime logbooks. As I plan to use similar tools, such as{' '}
              <a
                href="https://escriptorium.rich.ru.nl/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                eScriptorium
              </a>{' '}
              and{' '}
              <a
                href="https://github.com/mittagessen/kraken"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                Kraken
              </a>
              , in my 
              MA research, I will need to carefully examine their effectiveness. Therefore, in such projects, domain-specific 
              expertise and human intuition are necessary <span className="in-text-cite">(Kiessling, n.d.)</span>. 
            </p>
            <p>
              I also learnt about the geographical and cultural imbalance in Zooniverse and possibly similar platforms. 
              I am aware that this may be caused by multiple factors. One possible reason is simply that different countries 
              tend to use different popular platforms. Nevertheless, this shows that the Global South remains underrepresented 
              on platforms such as Zooniverse. Furthermore, to promote a more global digital humanities community, it would 
              be beneficial to develop a more interoperable platform or mechanisms for interoperability among platforms so 
              that DH scholarship can become more globally connected.
            </p>
            <p>
              I was surprised that all image data on Zooniverse can be directly downloaded 
              from the work window. This raises concerns about data security and potential unauthorised data 
              scraping. Although some datasets may be in public domain, it may be better if Zooniverse 
              could implement more rigorous access controls, where only registered or “trusted” volunteers 
              can download full-resolution images, to mitigate these risks and ensure data safety.
            </p>
          </EssaySection>

          <EssaySection title="Application to My Own Work" id="application">
            <p>
              This project has many aspects that can be applied to my own research. It is highly relevant 
              to my MA project as they both use digital methods to examine the epistemology 
              of science within colonial contexts.
            </p>
            <p>
              My MA project, A Computational Approach to the Global Historical Botanical Visual Epistemology, uses 
              computational methods to analyse digitised botanical books across heterogeneous global archives. It utilises 
              the computer vision AI model YOLO to detect botanical illustrations, and uses open source transcription tool 
              Kraken to perform OCR/HTR tasks. My participation in the Monsoon Voyages project, particularly my use of 
              Transcribus, demonstrated that OCR/HTR outputs must be critically evaluated before they can be adopted, 
              especially when dealing with irregular typography. Informed by this insight, I plan to 
              employ iterative human-in-the-loop fine-tuning in my MA project to optimise model performance. Since I will use Kraken, on which eScriptorium is built, 
              I will need to place greater emphasis on model training (or fine-tuning) and manual validation in my own 
              research workflow to ensure robustness.
            </p>
            <p>
              Regarding newly digitised materials, I am particularly passionate about digitised images of historical 
              artefacts that can be accessed through International Image Interoperability Framework (IIIF). The 
              standardisation provided by IIIF is invaluable to my research. I am familiar with image processing 
              and have worked with digitised materials before. I am currently exploring the effectiveness of IIIF-based 
              image sharing. I also appreciate that IIIF can be used to craft narratives from a series of annotated 
              images, and this approach becomes very effective when integrated into a <span style={{ color: '#0570ff', fontWeight: 500 }}>scroll-based storytelling website</span>. 
              In addition, I am impressed by how rigorously IIIF’s JSON manifests organize image metadata.
            </p>
            <p>
              Regarding crowdsourcing, I could potentially recruit volunteers for my MA research project to annotate 
              historical book images on platforms such as Zooniverse. Through my participation in the Monsoon Voyages 
              project as well as my previous experiences, I have become aware that crowdsourcing can efficiently process 
              large quantities of annotation work, far exceeding what I could accomplish alone.
            </p>
            <p className="essay-subheading">
              Comparison with other platforms
            </p>
            <p>
              <a
                href="https://www.shidianguji.com/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
              >
                Shidianguji
              </a>{' '}
              is a digital humanities crowdsourcing platform launched in 2022 by Peking University and 
              the technology company ByteDance for crowdsourced verification of OCR results from historical Chinese 
              books. The platform uses its own backend OCR engine to transcribe historical Chinese texts, and volunteers 
              contribute by reviewing and correcting the OCR output <span className="in-text-cite">(Peking University and ByteDance, 2022)</span>. 
            </p>
            <figure className="essay-figure essay-figure--outset">
              <img
                src={getAssignmentOneMediaPath('Figure4.jpeg')}
                alt="Reviewing OCR results on Shidianguji platform"
              />
              <figcaption><strong>Figure 4</strong>: Reviewing OCR results on the Shidianguji platform.</figcaption>
            </figure>
            <p>
              Compared with newer platforms, Zooniverse’s functionality remains relatively basic, and its user interface 
              could benefit from modernization. So, I suggest that Zooniverse consider integrating open source transcription 
              tool Kraken into the platform, given that many projects involve transcription. This would shift the role of 
              volunteers from primary transcribers to co-transcribers or even reviewers. By combining AI’s capability (based 
              on large amount of training) with human intuition, the correctness and reliability of the results can be improved.
            </p>
            <p>
              In addition, both the Monsoon Voyages project and my MA research focus on the history of scientific knowledge. 
              In both cases, the imperial power used classificatory regimes to order the colonised world <span className="in-text-cite">(Williamson, 2021)</span>. 
              Likewise, maritime weather logs and botanical books are colonial powers’ attempts to classify or standardise the natural 
              world. My participation in Monsoon Voyages revealed how measurements and recording practices are shaped by the British 
              colonial system. This is transferable to my study of historical botanical epistemology, which investigates taxonomic 
              systems and imperial plant knowledge, because both projects address colonial epistemic authority and institutional 
              standardisation, through which classificatory regimes were shaped <span className="in-text-cite">(Williamson, 2015)</span>.
            </p>
          </EssaySection>

          <EssaySection title="References" id="references">
            <ol className="m-0 list-decimal space-y-3 pl-6 text-[0.92rem] leading-6">
              <li>
                Kiessling, B., (n.d.). Kraken: a Universal Text Recognizer for the Humanities. [online] Available at:{' '}
                <a
                  href="https://github.com/mittagessen/kraken"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://github.com/mittagessen/kraken
                </a>{' '}
                [Accessed 27 Feb. 2026].
              </li>
              <li>
                Peking University and ByteDance, (2022). Shidianguji. [online] Available at:{' '}
                <a
                  href="https://www.shidianguji.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://www.shidianguji.com/
                </a>{' '}
                [Accessed 27 Feb. 2026].
              </li>
              <li>
                READ-COOP, (n.d.). Transkribus. [online] Available at:{' '}
                <a
                  href="https://www.transkribus.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://www.transkribus.org/
                </a>{' '}
                [Accessed 27 Feb. 2026].
              </li>
              <li>
                Singapore Management University, (n.d.). Monsoon Voyages. [online] Available at:{' '}
                <a
                  href="https://urban.smu.edu.sg/projects/monsoon-voyages"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://urban.smu.edu.sg/projects/monsoon-voyages
                </a>{' '}
                [Accessed 27 Feb. 2026].
              </li>
              <li>
                Williamson, F., 2015. Weathering the empire: meteorological research in the early British straits settlements. The British Journal for the History of Science, 48(3), pp.475-492.
              </li>
              <li>
                Williamson, F., 2021. Framing Asian atmospheres: imperial weather science and the problem of the local c. 1880-1950. The British Journal for the History of Science, 54(3), pp.301-304.
              </li>
              <li>
                Zooniverse, (n.d.). Zooniverse: People-powered research. [online] Available at:{' '}
                <a
                  href="https://www.zooniverse.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                >
                  https://www.zooniverse.org/
                </a>{' '}
                [Accessed 27 Feb. 2026].
              </li>
            </ol>
          </EssaySection>
          </article>
        </section>
          </>
        ) : activeAssignment === 'assignment2' ? (
          <AssignmentTwoNarrative />
        ) : (
          <PhotoArchiveWindowed />
        )}
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
