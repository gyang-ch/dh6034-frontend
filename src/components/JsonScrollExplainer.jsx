import { useState, useEffect, useRef } from 'react'

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
    // whitespace (preserve)
    if (/\s/.test(text[i])) {
      let s = ''
      while (i < text.length && /\s/.test(text[i])) s += text[i++]
      tokens.push({ t: 'ws', v: s })
      continue
    }
    // string
    if (text[i] === '"') {
      let s = '"'; i++
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') s += text[i++]
        s += text[i++]
      }
      s += '"'; i++
      // key if followed by ':'
      let j = i
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++
      tokens.push({ t: j < text.length && text[j] === ':' ? 'key' : 'str', v: s })
      continue
    }
    // number
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
    id: 'filename',
    label: 'File Identifier',
    title: 'Filename',
    color: '#818cf8',
    lines: ['    "filename": "2004-04-25_Lanzhou_001.JPG",'],
    explanation: 'Encodes date, place, and shot number — self-describing without a database. Applied consistently during manual curation.',
  },
  {
    id: 'date-place',
    label: 'Temporal & Geographic Metadata',
    title: 'Date & Place',
    color: '#22d3ee',
    lines: [
      '    "date": "2004-04-25",',
      '    "place": "Lanzhou",',
    ],
    explanation: 'ISO 8601 date and human-readable place name, from EXIF metadata or manually annotated where missing.',
  },
  {
    id: 'gps',
    label: 'GPS Coordinates',
    title: 'Latitude & Longitude',
    color: '#34d399',
    lines: [
      '    "lat": 36.0526223,',
      '    "lng": 103.8394984,',
    ],
    explanation: 'Decimal-degree coordinates from EXIF GPS or geocoded from the place name. Powers the map, globe, and place–subject atlas.',
  },
  {
    id: 'person',
    label: 'Social Metadata',
    title: 'Person Count',
    color: '#fbbf24',
    lines: ['    "person_count": 1,'],
    explanation: 'Number of visible people, YOLO-detected then manually verified. Tracks the shift from family portraits to solo photography over time.',
  },
  {
    id: 'blip',
    label: 'AI-Generated Descriptions',
    title: 'BLIP Captions & VQA',
    color: '#f472b6',
    lines: [
      '    "BLIP_Caption": "a young boy with his arms outstretched in the air",',
      '    "BLIP_Keywords": ["young", "boy", "his", "arms"],',
      '    "BLIP_VQA_Scene": "indoors",',
      '    "BLIP_VQA_Subject": "boy",',
    ],
    explanation: 'BLIP generates a free-form caption, keyword list, and VQA answers for scene type and subject — enabling the semantic timeline.',
  },
  {
    id: 'colours',
    label: 'Chromatic Data',
    title: 'Dominant Colours',
    color: '#a78bfa',
    lines: [
      '    "dominant_colours": [',
      '      { "hex": "#a3bcd1", "rgb": [163, 188, 209], "hsl_saturation": 0.333 },',
      '      { "hex": "#8ba4ba", "rgb": [139, 164, 186], "hsl_saturation": 0.254 },',
      '      { "hex": "#640815", "rgb": [100, 8, 21], "hsl_saturation": 0.852 }',
      '    ],',
    ],
    explanation: 'Top colours extracted by k-means on the pixel palette, stored as hex, RGB, and HSL saturation. Used in the Chromatic Fugue stripes.',
  },
  {
    id: 'clip',
    label: 'Semantic Tagging',
    title: 'CLIP Tags',
    color: '#2dd4bf',
    lines: [
      '    "clip_tags": [',
      '      { "tag": "bright image", "score": 0.02 },',
      '      { "tag": "portrait",     "score": 0.0199 },',
      '      { "tag": "park",         "score": 0.0199 },',
      '      { "tag": "motion blur",  "score": 0.0197 }',
      '    ],',
    ],
    explanation: 'Candidate tags scored by cosine similarity between the image embedding and each tag\'s text embedding in CLIP space.',
  },
  {
    id: 'stats',
    label: 'Technical Properties',
    title: 'Image Statistics',
    color: '#38bdf8',
    lines: [
      '    "image_stats": {',
      '      "width": 1632,  "height": 1224,  "aspect_ratio": 1.3333,',
      '      "mean_rgb": [134.59, 138.1, 156.68],',
      '      "std_rgb": [33.64, 64.8, 68.43]',
      '    },',
    ],
    explanation: 'Pixel dimensions, aspect ratio, per-channel mean (brightness proxy), and standard deviation (contrast proxy).',
  },
  {
    id: 'cluster',
    label: 'Visual Clustering',
    title: 'Cluster Assignment',
    color: '#fb923c',
    lines: [
      '    "cluster_id": 3,',
      '    "cluster_label": "cluster_3",',
    ],
    explanation: 'K-means cluster from CLIP embeddings. Photos in the same cluster share visual themes and share a colour in the constellation graph.',
  },
  {
    id: 'umap',
    label: '2D Embedding Projection',
    title: 'UMAP Coordinates',
    color: '#818cf8',
    lines: [
      '    "umap_x": 0.3585,',
      '    "umap_y": 0.3645,',
    ],
    explanation: 'Position in a UMAP projection of the 768-d CLIP space — visually similar images cluster together. Used to place nodes in the constellation.',
  },
  {
    id: 'style',
    label: 'Visual Complexity',
    title: 'Style Energy',
    color: '#f87171',
    lines: ['    "style_energy": 0.4933,'],
    explanation: 'Edge-gradient magnitude normalised 0–1. Higher values mean busier, more textured images. Encodes stripe height in the Chromatic Fugue.',
  },
  {
    id: 'neighbours',
    label: 'Visual Similarity',
    title: 'Nearest Neighbours',
    color: '#22d3ee',
    lines: [
      '    "nearest_neighbours": [',
      '      { "filename": "2004-04-25_Lanzhou_002.JPG", "distance": 0.1499 },',
      '      { "filename": "2006-07-27_Beidaihe_009.JPG", "distance": 0.3479 },',
      '      { "filename": "2006-07-27_Beidaihe_008.JPG", "distance": 0.3564 }',
      '    ],',
    ],
    explanation: 'Five most similar photos by cosine distance in CLIP space. These links form the edges of the constellation graph.',
  },
  {
    id: 'pca',
    label: 'Structural Decomposition',
    title: 'PCA Features',
    color: '#34d399',
    lines: [
      '    "pca_features": { "structure": 0.7768, "palette": 0.4819, "texture": 0.4744 },',
    ],
    explanation: 'Three PCA scores summarising compositional geometry, colour breadth, and texture complexity — each normalised across the archive.',
  },
  {
    id: 'hdbscan',
    label: 'Density-Based Clustering',
    title: 'HDBSCAN Cluster',
    color: '#c084fc',
    lines: [
      '    "hdbscan_cluster": 53,',
      '    "hdbscan_neighbours": [',
      '      { "filename": "2006-07-27_Beidaihe_020.JPG", "distance": 0.0273 },',
      '      { "filename": "2006-07-27_Beidaihe_019.JPG", "distance": 0.0276 }',
      '    ]',
    ],
    explanation: 'Finer-grained density cluster (HDBSCAN) that allows outliers; neighbours are the closest members of the same local group.',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function JsonScrollExplainer() {
  const [activeId, setActiveId] = useState(STEPS[0].id)
  const sentinelRefs  = useRef([])
  const codeRef       = useRef(null)   // the <pre> scroll container
  const stepCodeRefs  = useRef([])     // one ref per step span inside the code

  // Scroll the code window so the highlighted block is centred in view
  useEffect(() => {
    const idx = STEPS.findIndex(s => s.id === activeId)
    const el  = stepCodeRefs.current[idx]
    const pre = codeRef.current
    if (!el || !pre) return
    const targetTop = el.offsetTop - pre.clientHeight / 2 + el.offsetHeight / 2
    pre.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }, [activeId])

  useEffect(() => {
    const observers = sentinelRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(STEPS[i].id) },
        { rootMargin: '-15% 0px -75% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const active = STEPS.find(s => s.id === activeId) ?? STEPS[0]

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', margin: '2.5rem -3rem 0', width: 'calc(100% + 6rem)' }}>

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
              scrollBehavior: 'smooth',
            }}
          >
            <code>
              <CodeLine text={'['} />
              <CodeLine text={'  {'} />
              {STEPS.map((step, i) => (
                <span
                  key={step.id}
                  ref={el => { stepCodeRefs.current[i] = el }}
                  style={{
                    display: 'block',
                    background: activeId === step.id ? `${step.color}38` : 'transparent',
                    borderLeft: `4px solid ${activeId === step.id ? step.color : 'transparent'}`,
                    paddingLeft: '0.55rem',
                    borderRadius: '0 4px 4px 0',
                    transition: 'background 0.35s ease, border-color 0.35s ease',
                  }}
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            ref={el => { sentinelRefs.current[i] = el }}
            style={{
              minHeight: '22rem',
              display: 'flex',
              alignItems: 'center',
              padding: '2rem 0',
            }}
          >
            <div style={{
              width: '100%',
              borderRadius: '1rem',
              padding: '1.4rem 1.6rem',
              border: `1px solid ${activeId === step.id ? 'rgba(29,35,41,0.22)' : 'var(--archive-color-rule)'}`,
              background: activeId === step.id ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.42)',
              boxShadow: activeId === step.id ? '0 8px 32px -8px rgba(15,23,42,0.13)' : 'none',
              opacity: activeId === step.id ? 1 : 0.4,
              transform: activeId === step.id ? 'translateX(0)' : 'translateX(6px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
            }}>
              <p style={{
                margin: '0 0 0.25rem',
                font: '600 0.67rem/1 var(--archive-font-ui)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: step.color,
              }}>
                {step.label}
              </p>
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
