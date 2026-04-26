import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

// ── Syntax tokeniser ──────────────────────────────────────────────────────────

const TOK_COLORS = {
  key:    '#a5b4fc',  // indigo-300
  str:    '#6ee7b7',  // emerald-300
  num:    '#fdba74',  // orange-300
  bool:   '#d8b4fe',  // purple-300
  null:   '#fca5a5',  // red-300
  punct:  '#64748b',  // slate-500
}

function tokenize(text) {
  const tokens = []
  let i = 0
  while (i < text.length) {
    if (/\s/.test(text[i])) {
      let s = ''
      while (i < text.length && /\s/.test(text[i])) s += text[i++]
      tokens.push({ t: 'ws', v: s })
      continue
    }
    if (text[i] === '"') {
      let s = '"'; i++
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') s += text[i++]
        s += text[i++]
      }
      s += '"'; i++
      let j = i
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++
      tokens.push({ t: j < text.length && text[j] === ':' ? 'key' : 'str', v: s })
      continue
    }
    if (/[-\d]/.test(text[i])) {
      let s = ''
      while (i < text.length && /[-\d.eE+]/.test(text[i])) s += text[i++]
      tokens.push({ t: 'num', v: s }); continue
    }
    if (text.slice(i, i + 4) === 'true')  { tokens.push({ t: 'bool', v: 'true'  }); i += 4; continue }
    if (text.slice(i, i + 5) === 'false') { tokens.push({ t: 'bool', v: 'false' }); i += 5; continue }
    if (text.slice(i, i + 4) === 'null')  { tokens.push({ t: 'null', v: 'null'  }); i += 4; continue }
    tokens.push({ t: 'punct', v: text[i++] })
  }
  return tokens
}

function CodeLine({ text }) {
  const toks = tokenize(text)
  return (
    <span style={{ display: 'block', lineHeight: '1.6' }}>
      {toks.map((tok, i) =>
        tok.t === 'ws'
          ? tok.v
          : <span key={i} style={{ color: TOK_COLORS[tok.t] }}>{tok.v}</span>
      )}
    </span>
  )
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'date-place-gps',
    title: 'Date, Place & Coordinates',
    color: '#38bdf8',
    lines: [
      '    "date": "2004-04-25",',
      '    "place": "Lanzhou",',
      '    "lat": 36.0526223,',
      '    "lng": 103.8394984,',
    ],
    explanation: 'Date and place name from EXIF metadata, manually supplemented where missing. GPS coordinates come from EXIF or geocoded from the place name — they power the map, globe, and place–subject atlas.',
  },
  {
    id: 'person',
    title: 'Person Count & Social Context',
    color: '#38bdf8',
    lines: [
      '    "person_count": 1,',
      '    "myself": true,',
      '    "main_people": 1,',
      '    "category": "neither",',
    ],
    explanation: 'person_count is YOLO-estimated and manually verified. myself flags whether I appear. main_people counts primary subjects, excluding passers-by. category records the social context: family, friends, or neither.',
  },
  {
    id: 'captions',
    title: 'AI-Generated Captions',
    color: '#38bdf8',
    lines: [
      '    "BLIP_Caption": "a young boy with his arms outstretched in the air",',
      '    "BLIP_Keywords": ["young", "boy", "his", "arms", "outstretched", "air"],',
      '    "Gemma_caption": "A young boy in a red shirt poses against a white wall.",',
      '    "Gemma_keywords": ["boy", "red shirt", "shaved head", "wall", "pose"],',
    ],
    explanation: 'Two caption passes from different vision-language models. BLIP gives a short sentence and keywords. Gemma 4 (31B) produces more precise descriptions of colour, clothing, and spatial detail. Both feed the semantic timeline and subject groupings.',
  },
  {
    id: 'yolo',
    title: 'Object Detection',
    color: '#38bdf8',
    lines: [
      '    "yolo_objects": { "car": 1 },',
    ],
    explanation: 'YOLO detects object classes in each image, stored as a count map. An empty object means no detected objects. Used in the YOLO Object Timeline and to estimate person counts.',
  },
  {
    id: 'colours',
    title: 'Dominant Colours',
    color: '#38bdf8',
    lines: [
      '    "dominant_colours": [',
      '      { "hex": "#a3bcd1", "rgb": [163, 188, 209], "hsl_saturation": 0.333 },',
      '      { "hex": "#8ba4ba", "rgb": [139, 164, 186], "hsl_saturation": 0.254 },',
      '      { "hex": "#640815", "rgb": [100,   8,  21], "hsl_saturation": 0.852 },',
      '      { "hex": "#76889c", "rgb": [118, 136, 156], "hsl_saturation": 0.161 },',
      '      { "hex": "#4d4856", "rgb": [ 77,  72,  86], "hsl_saturation": 0.089 }',
      '    ],',
    ],
    explanation: 'The top five colours extracted by k-means on the pixel palette, stored as hex, RGB, and HSL saturation. Provide a chromatic fingerprint used in the Chromatic Fugue stripes.',
  },
  {
    id: 'clip',
    title: 'Semantic Tags',
    color: '#38bdf8',
    lines: [
      '    "clip_tags": [',
      '      { "tag": "bright image",  "score": 0.02   },',
      '      { "tag": "portrait",      "score": 0.0199 },',
      '      { "tag": "park",          "score": 0.0199 },',
      '      { "tag": "motion blur",   "score": 0.0197 }',
      '    ],',
    ],
    explanation: 'Candidate tags scored by cosine similarity between the image embedding and tag text embeddings in CLIP space. The top tags drive the tag-frequency panel and semantic timeline.',
  },
  {
    id: 'stats',
    title: 'Image Statistics',
    color: '#38bdf8',
    lines: [
      '    "image_stats": {',
      '      "width": 1632, "height": 1224, "aspect_ratio": 1.3333,',
      '      "mean_rgb": [134.59, 138.1, 156.68], "std_rgb": [33.64, 64.8, 68.43],',
      '      "brightness": 139.16, "contrast": 54.04, "entropy": 6.9496',
      '    },',
    ],
    explanation: 'Pixel dimensions, aspect ratio, per-channel mean and standard deviation, brightness, RMS contrast, and Shannon entropy. These feed the brightness chart and style-energy calculations.',
  },
  {
    id: 'umap',
    title: 'UMAP Coordinates',
    color: '#38bdf8',
    lines: [
      '    "umap_x": 0.3585,',
      '    "umap_y": 0.3645,',
    ],
    explanation: 'Position in a 2D UMAP projection of the CLIP embedding space — visually similar images cluster together. Used to place nodes in the constellation graph.',
  },
  {
    id: 'style',
    title: 'Style Energy',
    color: '#38bdf8',
    lines: ['    "style_energy": 0.4933,'],
    explanation: 'Edge-gradient magnitude normalised 0–1. Higher values mean busier, more textured images. Encodes stripe height in the Chromatic Fugue and radius in the beeswarm.',
  },
  {
    id: 'pca',
    title: 'PCA Features',
    color: '#38bdf8',
    lines: [
      '    "pca_features": { "structure": 0.7768, "palette": 0.4819, "texture": 0.4744 },',
    ],
    explanation: 'Three PCA scores summarising compositional geometry, colour breadth, and texture complexity — each normalised across the archive.',
  },
  {
    id: 'kmeans',
    title: 'K-Means Cluster & Neighbours',
    color: '#38bdf8',
    lines: [
      '    "kmeans_cluster": 3,',
      '    "kmeans_cluster_label": "cluster_3",',
      '    "kmeans_cluster_name": "indoor · stage · table",',
      '    "kmeans_neighbours": [',
      '      { "filename": "2004-04-25_Lanzhou_002.JPG", "distance": 0.1499 },',
      '      { "filename": "2006-07-27_Beidaihe_009.JPG", "distance": 0.3479 },',
      '      { "filename": "2006-07-27_Beidaihe_008.JPG", "distance": 0.3564 }',
      '    ],',
    ],
    explanation: 'K-means cluster from CLIP embeddings, with a human-readable name from the cluster\'s most representative keywords. Photos in the same cluster share visual themes and a colour in the constellation graph. Neighbours are the five most similar images by cosine distance — these links form the graph edges.',
  },
  {
    id: 'hdbscan',
    title: 'HDBSCAN Cluster',
    color: '#38bdf8',
    lines: [
      '    "hdbscan_cluster": 53,',
      '    "hdbscan_cluster_name": "butterflies · marks · practice",',
      '    "hdbscan_neighbours": [',
      '      { "filename": "2006-07-27_Beidaihe_020.JPG", "distance": 0.0273 },',
      '      { "filename": "2006-07-27_Beidaihe_019.JPG", "distance": 0.0276 }',
      '    ]',
    ],
    explanation: 'A finer-grained density cluster (HDBSCAN) that allows outliers, with a human-readable name from the cluster\'s top keywords. Neighbours are the closest members of the same local group in embedding space.',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function JsonScrollExplainer() {
  const containerRef = useRef(null)
  const codeRef      = useRef(null)
  const cardRefs     = useRef([])
  const stepCodeRefs = useRef([])

  useGSAP(() => {
    const cards      = cardRefs.current.filter(Boolean)
    const codeBlocks = stepCodeRefs.current.filter(Boolean)
    if (!cards.length) return

    // Initial state: first card active, rest blurred/faded
    gsap.set(cards[0], { opacity: 1, filter: 'blur(0px)', scale: 1 })
    cards[0].classList.add('active-card')
    cards.slice(1).forEach(card => {
      gsap.set(card, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98 })
    })
    if (codeBlocks[0]) codeBlocks[0].classList.add('active')

    function activateStep(i) {
      // Animate cards: focus active, blur others
      cards.forEach((card, j) => {
        if (j === i) {
          gsap.to(card, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
          card.classList.add('active-card')
        } else {
          gsap.to(card, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
          card.classList.remove('active-card')
        }
      })

      // Toggle glowing border on code blocks
      stepCodeRefs.current.forEach((block, j) => {
        if (!block) return
        if (j === i) block.classList.add('active')
        else block.classList.remove('active')
      })

      // Smooth-scroll the code window to centre the active block
      const el  = stepCodeRefs.current[i]
      const pre = codeRef.current
      if (el && pre) {
        const targetTop = el.offsetTop - pre.clientHeight / 2 + el.offsetHeight / 2
        gsap.to(pre, { scrollTop: Math.max(0, targetTop), duration: 0.6, ease: 'expo.out', overwrite: 'auto' })
      }
    }

    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top center',
        end: 'bottom center',
        onEnter:     () => activateStep(i),
        onEnterBack: () => activateStep(i),
      })
    })
  }, { scope: containerRef, dependencies: [] })

  return (
    <div ref={containerRef} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', margin: '2.5rem 0 0', maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto' }}>

      {/* ── Left: sticky code window ─────────────────────────────────────── */}
      <div style={{ flex: '0 0 60%', position: 'sticky', top: '5.5rem' }}>
        <div style={{
          borderRadius: '0.85rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px -16px rgba(0,0,0,0.55)',
          background: '#0f172a',
        }}>
          {/* title bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.65rem 1rem',
            background: '#1e293b',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['#f87171','#fbbf24','#34d399'].map(c => (
              <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, flexShrink: 0 }} />
            ))}
            <span style={{ marginLeft: '0.5rem', font: '0.72rem/1 "JetBrains Mono", monospace', color: '#64748b' }}>
              sample_photo_data.json
            </span>
          </div>

          {/* code body */}
          <pre
            ref={codeRef}
            style={{
              margin: 0,
              padding: '1rem 0.25rem 1rem 0',
              overflowX: 'auto',
              font: '0.78rem/1.6 "JetBrains Mono", "Fira Code", monospace',
              color: '#cbd5e1',
              maxHeight: '78vh',
              overflowY: 'auto',
            }}
          >
            <code>
              <CodeLine text={'['} />
              <CodeLine text={'  {'} />
              <CodeLine text={'    "filename": "2004-04-25_Lanzhou_001.JPG",'} />
              {STEPS.map((step, i) => (
                <span
                  key={step.id}
                  ref={el => { stepCodeRefs.current[i] = el }}
                  className="code-block-highlight"
                >
                  {step.lines.map((line, li) => (
                    <CodeLine key={li} text={line} />
                  ))}
                </span>
              ))}
              <CodeLine text={'  }'} />
              <CodeLine text={']'} />
            </code>
          </pre>
        </div>
      </div>

      {/* ── Right: scrollable explanation cards ──────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 11rem - 2rem)' }}>
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            style={{
              minHeight: '22rem',
              display: 'flex',
              alignItems: 'center',
              padding: '2rem 0',
            }}
          >
            <div
              ref={el => { cardRefs.current[i] = el }}
              className="explanation-card"
            >
              <h3 style={{
                margin: '0 0 0.6rem',
                font: '500 1.1rem/1.2 var(--archive-font-display)',
                color: 'var(--archive-color-ink)',
              }}>
                {step.title}
              </h3>
              <p style={{
                margin: 0,
                font: '0.875rem/1.65 var(--archive-font-ui)',
                color: 'var(--archive-color-copy)',
              }}>
                {step.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
