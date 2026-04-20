import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { assignment2Data } from '../data/assignment2Data'
import AssignmentTwoGraph from './AssignmentTwoGraph'
import AssignmentTwoSonification from './AssignmentTwoSonification'
import ChromaticSwarm, { STEPS as SWARM_STEPS } from './ChromaticSwarm'
import PeoplePanel from './PeoplePanel'
import SemanticTimeline from './SemanticTimeline'
import PlaceSubjectAtlas from './PlaceSubjectAtlas'
import TemporalRibbon from './TemporalRibbon'
import GlobeView from './GlobeView'
import PhotoMap from './PhotoMap'
import StagedVisual from './StagedVisual'
import JsonScrollExplainer from './JsonScrollExplainer'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import { photographUrl } from '../lib/photographs'

gsap.registerPlugin(useGSAP)

const CLUSTER_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

const imageUrl = photographUrl

const HERO_PREVIEW_IMAGES = [
  '2019-01-08_Hanoi_00006.JPG',
  '2013-08-09_Lausanne_035.JPG',
  '2021-03-27_Linxia_001.jpg',
  '2010-06-25_Shanghai_021.JPG',
  '2024-02-14_Qinan_002.JPG',
  '2019-12-22_Hongkong_029.jpg',
  '2004-08-19_Suzhou_008.JPG',
  '2013-08-05_Italy_250.jpg',
  '2004-08-18_Suzhou_015.JPG',
  '2004-08-21_Shanghai_012.JPG',
  '2007-07-18_Tibet_093.JPG',
  '2024-01-23_Hangzhou_006.JPG',
  '2006-04-16_Lanzhou_009.JPG',
  '2013-08-06_Venice_070.JPG',
  '2006-07-10_Guizhou_034.JPG',
  '2013-07-03_Xinjiang_040.JPG',
  '2007-07-18_Tibet_081.JPG',
  '2007-07-20_Tibet_049.JPG',
  '2006-07-10_Guizhou_028.JPG',
  '2013-08-05_Italy_052.JPG',
  '2004-08-18_Suzhou_003.JPG',
  '2006-07-10_Guizhou_016.JPG',
  '2012-08-20_Xian_019.JPG',
  '2010-06-30_Kaifeng_007.JPG',
  '2006-04-16_Lanzhou_035.JPG',
  '2013-08-05_Italy_222.jpg',
  '2004-08-18_Suzhou_014.JPG',
  '2004-08-18_Suzhou_005.JPG',
  '2013-08-06_Venice_170.JPG',
  '2013-08-08_Lausanne_195.jpg',
  '2016-11-11_Shenzhen_001.jpg',
  '2013-08-06_Venice_189.JPG',
  '2013-08-08_Lausanne_046.JPG',
  '2013-08-04_Italy_019.JPG',
  '2007-07-23_Tibet_003.JPG',
  '2021-03-27_Linxia_005.jpg',
]

const HERO_RAIL_COUNT = 6
const HERO_RAILS = Array.from({ length: HERO_RAIL_COUNT }, (_, railIndex) =>
  HERO_PREVIEW_IMAGES.filter((_, imageIndex) => imageIndex % HERO_RAIL_COUNT === railIndex)
)

// ── Shared prose styles ───────────────────────────────────────────────────────

const S = {
  kicker: {
    margin: '0 0 0.6rem',
    font: '600 0.72rem/1.2 var(--archive-font-ui)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--archive-color-muted)',
  },
  h1: {
    margin: '0 0 0.55rem',
    font: '500 clamp(2.8rem,3.5vw + 1rem,5rem)/0.96 var(--archive-font-display)',
    letterSpacing: '-0.03em',
    color: 'var(--archive-color-ink)',
  },
  h2: {
    margin: '0 0 1.1rem',
    font: '500 clamp(1.6rem,2.1vw + 0.8rem,2.55rem)/1.12 var(--archive-font-display)',
    color: 'var(--archive-color-ink)',
  },
  subtitle: {
    margin: '0 0 1.4rem',
    font: '400 1rem/1.5 var(--archive-font-ui)',
    color: 'var(--archive-color-muted)',
    letterSpacing: '0.01em',
  },
  dek: {
    maxWidth: '31rem',
    margin: '0 0 1.2rem',
    font: '500 clamp(1.15rem,0.6vw + 1rem,1.45rem)/1.55 var(--archive-font-body)',
    color: 'var(--archive-color-ink)',
  },
  body: {
    margin: '0 0 1.15rem',
    font: '1rem/1.8 var(--archive-font-ui)',
    color: 'var(--archive-color-copy)',
    maxWidth: 'none',
  },
}

function ScrollSection({ id, kicker, title, children, style }) {
  return (
    <section id={id} style={{ width: 'min(100%, 88ch)', margin: '0 auto', padding: '4.5rem 0 2rem', ...style }}>
      {kicker && <p style={S.kicker}>{kicker}</p>}
      {title && <h2 style={S.h2}>{title}</h2>}
      {children}
    </section>
  )
}

function VisBlock({ children }) {
  return (
    <div style={{ margin: '2rem 0 3.5rem' }}>
      {children}
    </div>
  )
}

// ── Panel components ──────────────────────────────────────────────────────────

function HistogramPanel() {
  const maxCount = Math.max(...assignment2Data.brightnessHistogram.map((b) => b.count))
  return (
    <div style={{ borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)', padding: '1.4rem 1.6rem', boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)' }}>
      <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Brightness Distribution</p>
      <h3 style={{ margin: '0 0 1.1rem', font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>Most images sit in a restrained middle register</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {assignment2Data.brightnessHistogram.map((bin, i) => (
          <div key={bin.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.28rem', font: '0.78rem/1 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
              <span>{bin.label}</span><span>{bin.count}</span>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(29,35,41,0.08)' }}>
              <div style={{ height: '100%', borderRadius: '999px', width: `${(bin.count / maxCount) * 100}%`, background: `linear-gradient(90deg,rgba(39,76,119,0.85),${CLUSTER_COLOURS[i % CLUSTER_COLOURS.length]})` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TagPanelInline() {
  const maxCount = assignment2Data.topTags[0]?.count ?? 1
  return (
    <div style={{ borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)', background: 'rgba(255,255,255,0.72)', padding: '1.4rem 1.6rem', boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)' }}>
      <p style={{ margin: '0 0 0.35rem', font: '600 0.72rem/1 var(--archive-font-ui)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>Recurring CLIP Descriptors</p>
      <h3 style={{ margin: '0 0 1.1rem', font: '500 1.35rem/1.2 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>The tags lean toward daylight, outdoor scenes, and low-contrast atmospheres</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
        {assignment2Data.topTags.map((tag) => (
          <div key={tag.tag} style={{ borderRadius: '999px', border: '1px solid rgba(29,35,41,0.12)', background: 'rgba(255,255,255,0.82)', padding: '0.4rem 0.9rem', font: '0.82rem/1 var(--archive-font-ui)', color: 'var(--archive-color-copy)', transform: `scale(${0.88 + (tag.count / maxCount) * 0.22})` }}>
            <span style={{ fontWeight: 500 }}>{tag.tag}</span>
            <span style={{ marginLeft: '0.5rem', font: '0.7rem/1 var(--archive-font-ui)', color: 'var(--archive-color-muted)' }}>{tag.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main narrative ────────────────────────────────────────────────────────────

export default function AssignmentTwoNarrative() {
  const { totals } = assignment2Data
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const overlayRef = useRef(null)
  const railTracksRef = useRef([])
  const tilesRef = useRef([])
  const tileFramesRef = useRef([])

  // Beeswarm scroll-driven step
  const [swarmStep, setSwarmStep] = useState(0)
  const swarmStepRefs = useRef([])
  const heroStats = [
    { label: 'Corpus', value: `${totals.images.toLocaleString()} images`, note: 'Photographs drawn from the personal image archive.' },
    { label: 'Clusters', value: `${totals.clusters} groups`, note: 'Visual families inferred from CLIP and DINO embeddings.' },
    { label: 'Aspect', value: `${totals.landscape} landscape`, note: `${totals.portrait} portrait · ${totals.squareish} near-square` },
    { label: 'Average', value: `${totals.avgBrightness}`, note: `Mean brightness · style energy avg ${totals.avgStyleEnergy}` },
  ]

  useGSAP(() => {
    const railTracks = railTracksRef.current.filter(Boolean)
    const tiles = tilesRef.current.filter(Boolean)
    const frames = tileFramesRef.current.filter(Boolean)

    if (!tiles.length) return

    gsap.set(railTracks, { yPercent: 0 })
    gsap.set(tiles, {
      transformOrigin: '50% 50%',
      transformPerspective: 1200,
    })
    gsap.set(frames, {
      transformOrigin: '50% 50%',
      transformPerspective: 1200,
      rotationX: 0,
      rotationY: 0,
      rotateZ: 0,
      z: 0,
    })

    const entranceTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    entranceTimeline.fromTo(
      tiles,
      { opacity: 0, y: 36, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion ? 0.01 : 1.45,
        stagger: prefersReducedMotion ? 0 : 0.025,
      }
    )

    if (overlayRef.current) {
      entranceTimeline.fromTo(
        overlayRef.current,
        { opacity: 0, y: 28, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: prefersReducedMotion ? 0.01 : 1.05 },
        prefersReducedMotion ? 0 : 0.18
      )
    }

    if (!prefersReducedMotion) {
      railTracks.forEach((track, rail) => {
        const direction = rail % 2 === 0 ? 1 : -1
        gsap.fromTo(track,
          { yPercent: direction > 0 ? -50 : 0 },
          {
            yPercent: direction > 0 ? 0 : -50,
            duration: 24 + rail * 1.4,
            repeat: -1,
            ease: 'none',
          }
        )
      })
    }

  }, { scope: heroRef, dependencies: [prefersReducedMotion] })

  // IntersectionObserver: advance beeswarm step as right-panel cards scroll into view
  useEffect(() => {
    const observers = swarmStepRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSwarmStep(i) },
        { rootMargin: '-20% 0px -70% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  let tileIndex = 0

  function nextTileIndex() {
    const current = tileIndex
    tileIndex += 1
    return current
  }

  function handleMouseMove(event) {
    if (prefersReducedMotion || !heroRef.current) return

    const { left, top, width, height } = heroRef.current.getBoundingClientRect()
    const x = ((event.clientX - left) / width - 0.5) * 2
    const y = ((event.clientY - top) / height - 0.5) * 2

    tileFramesRef.current.forEach((frame, index) => {
      if (!frame) return

      const depth = (index % 5) + 1
      gsap.to(frame, {
        rotationY: x * (9.2 + depth * 0.95),
        rotationX: -y * (8.6 + depth * 0.82),
        rotateZ: x * 1.05,
        z: 40 + depth * 11,
        duration: 0.38,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    })
  }

  function handleMouseLeave() {
    if (prefersReducedMotion) return

    tileFramesRef.current.forEach((frame) => {
      if (!frame) return

      gsap.to(frame, {
        rotationX: 0,
        rotationY: 0,
        rotateZ: 0,
        z: 0,
        duration: 0.95,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    })
  }

  return (
    <div style={{ background: 'var(--archive-color-bg)', minHeight: '100vh', color: 'var(--archive-color-ink)' }}>

      {/* ── Hero ── */}
      <header
        ref={heroRef}
        className="assignment2-hero-shell hero-shell"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="assignment2-hero-bg" aria-hidden="true">
          <div className="assignment2-hero-aurora" />
          <div className="assignment2-hero-grid" />
          <div className="assignment2-hero-orb assignment2-hero-orb-a" />
          <div className="assignment2-hero-orb assignment2-hero-orb-b" />
          <div className="assignment2-hero-mosaic">
            {HERO_RAILS.map((railImages, railIndex) => (
              <div key={`rail-${railIndex}`} className="assignment2-hero-rail">
                <div
                  ref={(element) => {
                    railTracksRef.current[railIndex] = element
                  }}
                  className="assignment2-hero-rail-track"
                >
                  {[0, 1].map((copyIndex) => (
                    <div key={`rail-set-${railIndex}-${copyIndex}`} className="assignment2-hero-rail-set">
                      {railImages.map((filename) => {
                        const currentTileIndex = nextTileIndex()
                        return (
                          <figure
                            key={`${filename}-${copyIndex}`}
                            ref={(element) => {
                              tilesRef.current[currentTileIndex] = element
                            }}
                            className={`assignment2-hero-tile assignment2-hero-tile-${(currentTileIndex % 5) + 1}`}
                          >
                            <div
                              ref={(element) => {
                                tileFramesRef.current[currentTileIndex] = element
                              }}
                              className="assignment2-hero-tile-frame"
                            >
                              <img
                                src={imageUrl(filename)}
                                alt=""
                                loading={currentTileIndex < 12 ? 'eager' : 'lazy'}
                                decoding="async"
                              />
                            </div>
                          </figure>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="assignment2-hero-wash" />
        </div>

        <div ref={overlayRef} className="hero-overlay glass-card assignment2-hero-overlay">
          <div className="assignment2-hero-signal">
            <span className="assignment2-hero-signal-pill">Computational Photo Essay</span>
            <span className="assignment2-hero-signal-meta">Embeddings · Time · Place</span>
          </div>
          <p style={S.kicker}>DH6034 Assignment 2</p>
          <h1 style={{ ...S.h1, marginBottom: '0.8rem', color: '#f8fafc' }}>Excavating My<br />Image Archive</h1>
          <p style={{ ...S.subtitle, marginBottom: '1.05rem', color: 'rgba(226,232,240,0.88)' }}>
            A Data-Driven Analysis of Personal Life Through Photographs
          </p>
          <p style={{ ...S.dek, maxWidth: '36rem', marginBottom: '2rem', color: 'rgba(241,245,249,0.94)' }}>
            A scroll-driven exhibition translating a personal photo archive into an editorial sequence
            of embeddings, clusters, temporal rhythms, and geographic traces.
          </p>
          <div className="assignment2-hero-stats">
            {heroStats.map(({ label, value, note }) => (
              <div key={label} className="assignment2-hero-stat">
                <p className="assignment2-hero-stat-label">{label}</p>
                <p className="assignment2-hero-stat-value">{value}</p>
                <p className="assignment2-hero-stat-note">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Essay body ── */}
      <div style={{ margin: '0 auto', width: 'min(112rem,calc(100vw - 2rem))', padding: '0 1.5rem 6rem' }}>

        {/* 1 – Introduction */}
        <ScrollSection id="entry" kicker="Introduction">
          <p style={S.body}>
            To investigate patterns in my life and behaviour, I used my personal photographic archive as
            a dataset, analysing a collection of over 7,000 photographs accumulated over many years.
            Through computational pre-processing and visualisation, I examined how my photographic
            habits reflect changes in social relationships, daily activities, and personal interests
            across time.
          </p>
          <p style={S.body}>
            Although photographs are not traditionally considered quantified-self data in the same way
            as biometric or sensor logs, they constitute a form of self-documentation that records what
            an individual chooses to preserve, remember, and represent. As such, photographic archives
            can function as an indirect but meaningful quantification of lived experience.
          </p>
        </ScrollSection>

        {/* 2 – Methodology */}
        <ScrollSection id="registers" kicker="Methodology" title="Building the dataset and computing embeddings.">
          <p style={S.body}>
            I collected and curated photographs from my phone, MacBook, and cloud storage, resulting in
            a dataset of over 7,000 images. While some photographs contained embedded EXIF metadata such
            as date and location, many lacked complete metadata. To address this, I manually annotated
            missing temporal and geographical information and stored the resulting metadata in a
            structured JSON file.
          </p>
          <p style={S.body}>
            To enable computational analysis beyond basic metadata, I generated image embeddings for all
            photographs using OpenCLIP and DINOv2. These embeddings provide high-dimensional
            representations of visual content, allowing for similarity comparison, clustering, and
            thematic grouping across the dataset. In addition, I computed the dominant colour of each
            photograph to support chromatic visualisations. I also manually labelled the number of
            people in each photo, where YOLO was used for assistance.
          </p>
          <p style={S.body}>
            I stored all the metadata in a structured JSON file, as shown below.
          </p>
          <JsonScrollExplainer />
        </ScrollSection>

        <VisBlock>
          <div style={{ display: 'grid', gap: '1.1rem', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
            <HistogramPanel />
            <PeoplePanel
              bins={assignment2Data.personCountHistogram}
              withPeople={totals.withPeople}
              totalImages={totals.images}
            />
            <TagPanelInline />
          </div>
        </VisBlock>

        {/* 3 – Constellation */}
        <ScrollSection id="constellation-room" kicker="Overview of Findings" title="A shift from family archives to individual practice.">
          <p style={S.body}>
            Several clear patterns emerged from the analysis. Photographs from my early years consist
            predominantly of family group portraits, reflecting the centrality of family life during
            childhood. This pattern declines noticeably after my move to university, when geographical
            distance reduced opportunities for family gatherings.
          </p>
          <p style={S.body}>
            The constellation maps eight visual clusters derived from OpenCLIP embeddings. Each node is
            a photograph; colour marks its cluster. Lines connect nearest neighbours in the feature
            space — dense webs indicate strong local coherence. Hover or click any node to inspect the
            image and its neighbours.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing visual constellation" minHeight="min(75vh,44rem)" eager>
            <AssignmentTwoGraph />
          </StagedVisual>
        </VisBlock>

        {/* 4 – Temporal ribbon */}
        <ScrollSection id="time" kicker="Temporal Register" title="New categories emerge in recent years.">
          <p style={S.body}>
            At the same time, new thematic categories begin to appear more frequently in recent years.
            These include photographs of classroom environments, museum visits, and Chinese calligraphy
            practice. The emergence of these subjects reflects the increasing influence of academic
            life, cultural engagement, and specialised personal interests on my daily routine.
          </p>
          <p style={S.body}>
            Taken together, the archive reveals a gradual shift in the structure of my lived experience:
            from family-oriented documentation in childhood toward a more individualised and
            academically shaped visual record in adulthood. Drag the range selector beneath the bars to
            isolate any period; hover any bar for a month detail card.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing temporal ribbon" minHeight="min(60vh,28rem)">
            <TemporalRibbon bins={assignment2Data.temporalBins} />
          </StagedVisual>
        </VisBlock>

        {/* 4b – Semantic timeline */}
        <ScrollSection id="semantic-timeline" kicker="Semantic Register" title="The machine's subject language shifts with the life being documented.">
          <p style={S.body}>
            Once BLIP captions, keywords, and VQA subject labels are folded together, a second timeline
            appears. Early years remain anchored in people and family presence; later years accumulate
            more architectural, artistic, and study-oriented traces.
          </p>
          <p style={S.body}>
            Hover any year column to inspect which semantic families dominate that slice of the archive,
            alongside the most common subjects and cleaned keywords attached to those images.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing semantic timeline" minHeight="min(66vh,36rem)">
            <SemanticTimeline years={assignment2Data.semanticTimeline} />
          </StagedVisual>
        </VisBlock>

        {/* 5 – Place × Subject Atlas */}
        <ScrollSection id="subject-atlas" kicker="Place × Subject Atlas" title="Each place is remembered through a different subject vocabulary.">
          <p style={S.body}>
            This heatmap crosses the archive's largest places with the most distinctive VQA subjects
            they contain. Rather than raw photo totals, it reveals what each location tends to be about:
            water-play in Beidaihe, paintings in Paris, boats in Venice, statues in Lisbon.
          </p>
          <p style={S.body}>
            Hover any cell to read the count and inspect a representative image from that place-subject
            intersection.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing place subject atlas" minHeight="min(72vh,42rem)">
            <PlaceSubjectAtlas atlas={assignment2Data.placeSubjectAtlas} />
          </StagedVisual>
        </VisBlock>

        {/* 5b – 2D Map */}
        <ScrollSection id="map-room" kicker="Geographic Distribution" title="Where the photographs were taken, and what each place tends to hold.">
          <p style={S.body}>
            All {assignment2Data.totals.images.toLocaleString()} images mapped to their place of origin. The corpus has a dense centre of gravity
            in mainland China, particularly in major cities and along travel routes. Scattered clusters mark
            travels to Southeast Asia — Hanoi, Da Nang, Bangkok — as well as European cities including London,
            Paris, Brussels, Venice, and Lausanne.
          </p>
          <p style={S.body}>
            Use the mode toggle to switch the field from pure quantity to subject-family or indoors/outdoors
            balance. Click any cluster to zoom in; click an individual point to pin its detail card.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing geographic field" minHeight="34rem">
            <PhotoMap semanticMap={assignment2Data.semanticMap} />
          </StagedVisual>
        </VisBlock>

        {/* 6 – Globe */}
        <ScrollSection id="globe-room" kicker="Geographic Distribution — 3D" title="The same corpus, rendered on a globe.">
          <p style={S.body}>
            The flat map compresses the world onto a plane; the globe restores the spherical geometry of
            the archive. Each spike rises from its coordinates — taller and thicker where more
            photographs were taken. The dominant mass over central China is immediately apparent, while
            the thinner spikes mark the scattered traces of international travel.
          </p>
          <p style={S.body}>
            Drag to rotate the globe and inspect any region. Hover a spike to read the location name and
            photo count. The auto-rotation can be interrupted by clicking and dragging; it resumes on
            release.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing 3D globe" minHeight="34rem">
            <GlobeView />
          </StagedVisual>
        </VisBlock>

        {/* 7 – Chromatic Fugue */}
        <ScrollSection id="fugue" kicker="Chromatic Fugue" title="Colour as another index of the corpus.">
          <p style={S.body}>
            The dominant colour of each photograph was computed to support chromatic visualisations and
            to explore whether colour distributions might reveal broader aesthetic or contextual
            patterns within the archive. Each stripe represents a photograph — colour comes from the
            dominant palette, height reflects style energy.
          </p>
          <p style={S.body}>
            Hover a stripe to audition its tone. Sort modes let the corpus be reread by cluster, hue,
            brightness, or woven constellation pattern.
          </p>
        </ScrollSection>

        <VisBlock>
          <StagedVisual label="Preparing chromatic field" minHeight="min(65vh,36rem)">
            <AssignmentTwoSonification />
          </StagedVisual>
        </VisBlock>

        {/* 8 – Beeswarm: sticky viz left, scrollable text right */}
        <div id="swarm" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', padding: '4.5rem 0 2rem' }}>

          {/* Left: sticky canvas */}
          <div style={{ flex: '0 0 64%', position: 'sticky', top: '1.5rem' }}>
            <ChromaticSwarm step={swarmStep} />
          </div>

          {/* Right: scrollable step cards */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Section header */}
            <div style={{ padding: '0 0 1rem' }}>
              <p style={S.kicker}>Scroll-Driven Beeswarm</p>
              <h2 style={S.h2}>The same corpus read as freely moving circles.</h2>
              <p style={S.body}>
                The stripes above collapse each photograph into a one-dimensional mark. Here the same data expands into two dimensions: each circle can drift, cluster, or align along an axis.
              </p>
              <p style={S.body}>
                Hover any circle to inspect the photograph and click to pin a detail strip. Radius encodes style energy; colour is the dominant hue.
              </p>
            </div>

            {/* One card per beeswarm step */}
            {SWARM_STEPS.map((s, i) => (
              <div
                key={s.key}
                ref={el => { swarmStepRefs.current[i] = el }}
                style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                <div style={{
                  width: '100%',
                  borderRadius: '1rem',
                  padding: '1.5rem 1.6rem',
                  border: `1px solid ${swarmStep === i ? 'rgba(29,35,41,0.25)' : 'var(--archive-color-rule)'}`,
                  background: swarmStep === i ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.42)',
                  boxShadow: swarmStep === i ? '0 8px 32px -8px rgba(15,23,42,0.14)' : 'none',
                  opacity: swarmStep === i ? 1 : 0.4,
                  transform: swarmStep === i ? 'translateX(0)' : 'translateX(6px)',
                  transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
                }}>
                  <p style={{
                    margin: '0 0 0.4rem',
                    font: '600 0.68rem/1 var(--archive-font-ui)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--archive-color-muted)',
                  }}>
                    Step {i + 1} of {SWARM_STEPS.length}
                  </p>
                  <h3 style={{
                    margin: '0 0 0.75rem',
                    font: '500 1.2rem/1.25 var(--archive-font-display)',
                    color: 'var(--archive-color-ink)',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    font: '0.9rem/1.75 var(--archive-font-ui)',
                    color: 'var(--archive-color-copy)',
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Notes */}
        <ScrollSection id="endnotes" kicker="Notes" title="Reading the archive as evidence.">
          <p style={S.body}>
            The visualisations do not claim photographic truth. They show what was kept, photographed,
            and later recoverable through metadata and embeddings.
          </p>
          <p style={S.body}>
            Where metadata was incomplete, dates and locations were manually restored. Person counts
            were manually checked after assisted detection to keep the archive legible rather than
            fully automated.
          </p>
          <p style={S.body}>
            All interaction patterns are designed for gradual reading: hover reveals detail, click
            opens deeper inspection, and reduced-motion preferences suppress decorative transitions.
          </p>
        </ScrollSection>

      </div>
    </div>
  )
}
