import { useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { EdgeArrowProgram } from 'sigma/rendering'
import { centralityGraphData } from '../data/centralityGraphData'
import { photographUrl } from '../lib/photographs'

// ── Static lookups (built once from the pre-computed data file) ───────────────
const { photos, nodes: nodeList, edges: edgeList, maxIndegree: MAX_INDEGREE, uniformSize: NODE_SIZE, colorStops: COLOR_STOPS } = centralityGraphData

const nodeMap = new Map()
for (const nd of nodeList) nodeMap.set(nd.id, nd)

// Outgoing and incoming neighbour sets for hover highlighting
const outNeighbors = new Map()
const inNeighbors  = new Map()
for (const [si, ti] of edgeList) {
  const src = photos[si], tgt = photos[ti]
  if (!src || !tgt) continue
  if (!outNeighbors.has(src)) outNeighbors.set(src, new Set())
  if (!inNeighbors.has(tgt))  inNeighbors.set(tgt,  new Set())
  outNeighbors.get(src).add(tgt)
  inNeighbors.get(tgt).add(src)
}

// Colour gradient: slate → blue → red (low → high in-degree)
function centralityColor(d) {
  const t = d / MAX_INDEGREE
  let r, g, b
  if (t < 0.5) {
    const r2 = t * 2
    r = Math.round(107 + (58  - 107) * r2)
    g = Math.round(122 + (134 - 122) * r2)
    b = Math.round(141 + (255 - 141) * r2)
  } else {
    const r2 = (t - 0.5) * 2
    r = Math.round(58  + (255 - 58 ) * r2)
    g = Math.round(134 + (90  - 134) * r2)
    b = Math.round(255 + (95  - 255) * r2)
  }
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// Parse date / place from filename: YYYY-MM-DD_Place_NNN.ext
function parseFilename(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})_(.+?)_\d+/)
  if (!m) return { date: '', place: filename }
  return { date: m[1], place: m[2].replace(/_/g, ' ') }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CentralityNetwork() {
  const containerRef  = useRef(null)
  const sigmaRef      = useRef(null)
  const graphRef      = useRef(null)
  const hoveredRef    = useRef(null)
  const showEdgesRef  = useRef(false)

  const [showEdges,  setShowEdges]  = useState(false)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)

  // ── Build Sigma graph (once) ──────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const graph = new Graph({ type: 'directed', multi: false })

    for (const nd of nodeList) {
      graph.addNode(nd.id, {
        x:        nd.x,
        y:        nd.y,
        size:     NODE_SIZE,
        color:    nd.color,
        label:    '',
        indegree: nd.indegree,
      })
    }

    for (const [si, ti] of edgeList) {
      const src = photos[si], tgt = photos[ti]
      if (!src || !tgt) continue
      try {
        graph.addEdge(src, tgt, {
          hidden: true,
          color:  'rgba(62,107,160,0.35)',
          size:   0.7,
        })
      } catch (_) { /* skip duplicate edges */ }
    }

    const sigma = new Sigma(graph, container, {
      allowInvalidContainer:      true,
      renderEdgeLabels:           false,
      labelRenderedSizeThreshold: 9999,
      defaultEdgeType:            'arrow',
      edgeProgramClasses:         { arrow: EdgeArrowProgram },
      zIndex:                     true,
      minCameraRatio:             0.1,
      maxCameraRatio:             15,
    })

    sigmaRef.current  = sigma
    graphRef.current  = graph

    const onEnter = ({ node, event }) => {
      const nd     = nodeMap.get(node) ?? {}
      const parsed = parseFilename(node)
      setImageFailed(false)
      setHoveredNode({
        filename: node,
        indegree: nd.indegree ?? 0,
        date:     nd.date || parsed.date,
        place:    nd.place || parsed.place,
        left:     event.x,
        top:      event.y,
      })
    }
    const onLeave = () => { setHoveredNode(null); setImageFailed(false) }

    sigma.on('enterNode',  onEnter)
    sigma.on('leaveNode',  onLeave)
    sigma.on('clickNode',  onEnter)
    sigma.on('clickStage', onLeave)
    sigma.on('moveBody', ({ event }) =>
      setHoveredNode(cur => cur ? { ...cur, left: event.x, top: event.y } : cur)
    )

    sigma.setSetting('nodeReducer', (node, data) => {
      const hov = hoveredRef.current
      if (!hov) return data
      if (node === hov) return { ...data, zIndex: 2, size: NODE_SIZE * 2.2 }
      const isOut = outNeighbors.get(hov)?.has(node)
      const isIn  = inNeighbors.get(hov)?.has(node)
      if (isOut || isIn) return { ...data, zIndex: 1, size: NODE_SIZE * 1.4 }
      return { ...data, color: 'rgba(148,163,184,0.12)', size: NODE_SIZE * 0.8 }
    })

    sigma.setSetting('edgeReducer', (edge, data) => {
      const hov  = hoveredRef.current
      const show = showEdgesRef.current

      if (hov) {
        const src = graph.source(edge)
        const tgt = graph.target(edge)
        if (src === hov || tgt === hov) {
          return { ...data, hidden: false, size: 1.1, color: 'rgba(62,107,160,0.65)' }
        }
      }

      if (show) return { ...data, hidden: false }
      return { ...data, hidden: true }
    })

    sigma.getCamera().animatedReset({ duration: 600 })
    sigma.refresh()

    return () => {
      setHoveredNode(null)
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
    }
  }, [])

  // Sync refs so reducers pick up latest state without needing re-registration
  useEffect(() => {
    hoveredRef.current = hoveredNode?.filename ?? null
    sigmaRef.current?.refresh()
  }, [hoveredNode])

  useEffect(() => {
    showEdgesRef.current = showEdges
    sigmaRef.current?.refresh()
  }, [showEdges])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="assignment2-panel overflow-hidden rounded-[1.6rem] border border-slate-300/70 bg-white/72 p-5 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm md:p-7">

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-data text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">
            Centrality Network
          </p>
          <h3 className="font-title text-[clamp(1.45rem,2vw,2rem)] leading-tight text-slate-950">
            Directed k-NN graph coloured by in-degree centrality
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          All {photos.length.toLocaleString()} photographs as nodes. Each arrow points from a photo to
          one of its 5 most visually similar neighbours (asymmetric — if A lists B, B need not list A).
          A node's colour reflects its <em>in-degree</em>: how many other photos count it among their
          top-5 nearest neighbours. Warm colours mark visual archetypes — images so representative that
          many others converge on them.
        </p>
      </div>

      {/* Edge toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
          <button
            onClick={() => setShowEdges(false)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              !showEdges ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Nodes only
          </button>
          <button
            onClick={() => setShowEdges(true)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              showEdges ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Show all edges
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Hover any node to reveal its directed neighbours regardless of mode.
        </p>
      </div>

      {/* Graph shell */}
      <div className="assignment2-graph-shell relative">
        <div ref={containerRef} className="assignment2-graph h-[44rem] w-full rounded-[1.2rem]" />

        {hoveredNode && (
          <article
            className="assignment2-graph-card pointer-events-none absolute z-20 w-[min(17rem,calc(100%-1rem))] overflow-hidden rounded-[1.2rem] border border-slate-200/90 bg-[rgba(255,252,246,0.96)] shadow-[0_26px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-md"
            style={{
              left:      `clamp(0.5rem, calc(${hoveredNode.left}px - 1rem), calc(100% - 17.5rem))`,
              top:       `clamp(0.5rem, calc(${hoveredNode.top}px - 1rem), calc(100% - 22rem))`,
              transform: 'translate(18px, 18px)',
            }}
          >
            {!imageFailed ? (
              <img
                src={photographUrl(hoveredNode.filename)}
                alt={hoveredNode.filename}
                className="h-36 w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-36 items-end bg-[linear-gradient(135deg,#dfe9f0,#f4ead9)] p-4">
                <p className="font-data text-xs uppercase tracking-[0.22em] text-slate-600">
                  Preview unavailable
                </p>
              </div>
            )}

            <div className="space-y-3 p-4">
              {/* In-degree bar */}
              <div>
                <p className="font-data text-[0.67rem] uppercase tracking-[0.2em] text-slate-500">
                  In-degree centrality
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-title text-2xl leading-none text-slate-900">
                    {hoveredNode.indegree}
                  </span>
                  <span className="text-xs text-slate-400">/ {MAX_INDEGREE} max</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:      `${((hoveredNode.indegree / MAX_INDEGREE) * 100).toFixed(1)}%`,
                      background: nodeMap.get(hoveredNode.filename)?.color ?? '#6b7a8d',
                    }}
                  />
                </div>
              </div>

              {/* Date / place */}
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                {hoveredNode.date && (
                  <div>
                    <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-400">Date</p>
                    <p className="mt-0.5">{hoveredNode.date}</p>
                  </div>
                )}
                {hoveredNode.place && (
                  <div>
                    <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-400">Place</p>
                    <p className="mt-0.5 truncate">{hoveredNode.place}</p>
                  </div>
                )}
              </div>

              <p className="truncate font-data text-[0.6rem] uppercase tracking-[0.14em] text-slate-400">
                {hoveredNode.filename}
              </p>
            </div>
          </article>
        )}
      </div>

      {/* Centrality legend */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="font-data text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">In-degree</p>
        <div
          className="h-3 w-48 overflow-hidden rounded-full"
          style={{ background: `linear-gradient(to right, ${COLOR_STOPS.join(', ')})` }}
        />
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>low</span>
          <span className="mx-1 text-slate-300">→</span>
          <span>high</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {[['Slate-blue','low'], ['Teal','low-mid'], ['Sage green','mid'], ['Amber','mid-high'], ['Terracotta','high']].map(([label, level], i) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_STOPS[i] }} />
              {label}
            </span>
          ))}
        </div>
        <p className="w-full text-xs text-slate-400">
          Colour uses a percentile-rank scale so each band covers roughly the same share of nodes,
          not the same numerical range. Node size is uniform; only colour encodes centrality.
          Layout: UMAP on the k-NN graph — nearby nodes are genuinely similar in feature space.
        </p>
      </div>
    </div>
  )
}
