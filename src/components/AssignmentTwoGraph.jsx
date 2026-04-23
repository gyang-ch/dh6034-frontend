import { useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { assignment2GraphData } from '../data/assignment2GraphData'
import { photographUrl } from '../lib/photographs'

// ── K-Means palette (8 fixed clusters) ──────────────────────────────────────
const KMEANS_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

function kmeansColour(clusterId) {
  return KMEANS_COLOURS[clusterId % KMEANS_COLOURS.length]
}

// ── HDBSCAN palette (68 clusters + noise) ───────────────────────────────────
// Sigma WebGL renderer requires hex strings — hsl() is not supported.
const HDBSCAN_NOISE_COLOUR = '#94a3b8'

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const v = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * v).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hdbscanColour(clusterId) {
  if (clusterId === -1) return HDBSCAN_NOISE_COLOUR
  const hue = (clusterId * 137.508) % 360
  const sat = 58 + (clusterId % 3) * 7
  const lit = 48 + (clusterId % 5) * 4
  return hslToHex(hue, sat, lit)
}

function nodeColour(node, mode) {
  return mode === 'hdbscan' ? hdbscanColour(node.hdbscanClusterId) : kmeansColour(node.clusterId)
}

const imageUrl = photographUrl

// Pre-compute top HDBSCAN clusters by node count in the sampled graph
const hdbscanClusterCounts = (() => {
  const counts = new Map()
  for (const node of assignment2GraphData.nodes) {
    const id = node.hdbscanClusterId
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
})()

const TOP_HDBSCAN_CLUSTERS = [...hdbscanClusterCounts.entries()]
  .filter(([id]) => id !== -1)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([id]) => id)

// Cluster name maps derived from node attributes
const KMEANS_NAMES = (() => {
  const map = {}
  for (const node of assignment2GraphData.nodes) {
    if (node.clusterId != null && node.clusterName && !(node.clusterId in map))
      map[node.clusterId] = node.clusterName
  }
  return map
})()

const HDBSCAN_NAMES = (() => {
  const map = { [-1]: 'noise / outlier' }
  for (const node of assignment2GraphData.nodes) {
    if (node.hdbscanClusterId != null && node.hdbscanClusterName && !(node.hdbscanClusterId in map))
      map[node.hdbscanClusterId] = node.hdbscanClusterName
  }
  return map
})()

export default function AssignmentTwoGraph() {
  const containerRef = useRef(null)
  const sigmaRef = useRef(null)
  const graphRef = useRef(null)
  const neighborMapRef = useRef(null)
  const hoveredNodeRef = useRef(null)
  const clusterModeRef = useRef('kmeans')
  const [clusterMode, setClusterMode] = useState('kmeans')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)

  // ── Main sigma setup (run once) ────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const graph = new Graph({ multi: true })
    const neighborMap = new Map()

    // Build neighbour map for both edge sets (union)
    for (const edgeSet of [assignment2GraphData.edges, assignment2GraphData.hdbscanEdges ?? []]) {
      for (const edge of edgeSet) {
        if (!neighborMap.has(edge.source)) neighborMap.set(edge.source, new Set())
        if (!neighborMap.has(edge.target)) neighborMap.set(edge.target, new Set())
        neighborMap.get(edge.source).add(edge.target)
        neighborMap.get(edge.target).add(edge.source)
      }
    }

    for (const node of assignment2GraphData.nodes) {
      graph.addNode(node.filename, {
        ...node,
        x: node.x,
        y: node.y,
        size: 2.4 + node.styleEnergy * 6,
        color: kmeansColour(node.clusterId),
        label: '',
      })
    }

    // Add both edge sets with a mode tag to filter in edgeReducer
    for (const edge of assignment2GraphData.edges) {
      graph.addEdge(edge.source, edge.target, {
        mode: 'kmeans',
        size: Math.max(0.35, 1.2 - edge.distance),
        color: 'rgba(15, 23, 42, 0.28)',
        distance: edge.distance,
      })
    }
    for (const edge of (assignment2GraphData.hdbscanEdges ?? [])) {
      graph.addEdge(edge.source, edge.target, {
        mode: 'hdbscan',
        size: Math.max(0.35, 1.2 - edge.distance),
        color: 'rgba(15, 23, 42, 0.28)',
        distance: edge.distance,
      })
    }

    const sigma = new Sigma(graph, container, {
      allowInvalidContainer: true,
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 2000,
      defaultEdgeType: 'line',
      zIndex: true,
      minCameraRatio: 0.45,
      maxCameraRatio: 8,
    })

    sigmaRef.current = sigma
    graphRef.current = graph
    neighborMapRef.current = neighborMap

    const updateHoverState = (nodeId, position) => {
      const data = graph.getNodeAttributes(nodeId)
      const neighbours = Array.from(neighborMap.get(nodeId) ?? []).slice(0, 3)
      setImageFailed(false)
      setHoveredNode({ ...data, neighbours, left: position.x, top: position.y })
    }

    sigma.on('enterNode', ({ node, event }) => updateHoverState(node, event))
    sigma.on('leaveNode', () => { setHoveredNode(null); setImageFailed(false) })
    sigma.on('moveBody', ({ event }) => {
      setHoveredNode((cur) => cur ? { ...cur, left: event.x, top: event.y } : cur)
    })
    sigma.on('clickNode', ({ node, event }) => updateHoverState(node, event))
    sigma.on('clickStage', () => { setHoveredNode(null); setImageFailed(false) })

    sigma.setSetting('nodeReducer', (node, data) => {
      const mode = clusterModeRef.current
      const hovered = hoveredNodeRef.current
      const attrs = graph.getNodeAttributes(node)
      const baseColor = nodeColour(attrs, mode)

      if (!hovered) {
        return { ...data, color: baseColor }
      }

      const isFocus = node === hovered.filename
      const isNeighbour = neighborMapRef.current?.get(hovered.filename)?.has(node)

      if (isFocus || isNeighbour) {
        return {
          ...data,
          color: baseColor,
          zIndex: 1,
          size: isFocus ? data.size * 1.35 : data.size * 1.08,
        }
      }

      return {
        ...data,
        color: 'rgba(148, 163, 184, 0.18)',
        size: Math.max(1.4, data.size * 0.72),
      }
    })

    sigma.setSetting('edgeReducer', (edge, data) => {
      const mode = clusterModeRef.current
      const hovered = hoveredNodeRef.current
      const edgeMode = graphRef.current?.getEdgeAttribute(edge, 'mode')

      // Hide edges that don't belong to the active mode
      if (edgeMode !== mode) return { ...data, hidden: true }

      if (!hovered || !graphRef.current) return data

      const source = graphRef.current.source(edge)
      const target = graphRef.current.target(edge)
      const related = source === hovered.filename || target === hovered.filename

      if (related) {
        return { ...data, color: 'rgba(15, 23, 42, 0.34)', size: data.size * 1.5, hidden: false }
      }

      return { ...data, color: 'rgba(148, 163, 184, 0.12)' }
    })

    sigma.getCamera().animatedReset({ duration: 600 })
    sigma.refresh()

    return () => {
      setHoveredNode(null)
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
      neighborMapRef.current = null
    }
  }, [])

  // ── Sync hovered node ref + refresh on hover change ───────────────────────
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode
    sigmaRef.current?.refresh()
  }, [hoveredNode])

  // ── Sync cluster mode ref + re-colour nodes + refresh ────────────────────
  useEffect(() => {
    clusterModeRef.current = clusterMode
    const graph = graphRef.current
    const sigma = sigmaRef.current
    if (!graph || !sigma) return
    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, 'color', nodeColour(attrs, clusterMode))
    })
    sigma.refresh()
  }, [clusterMode])

  // ── Legend content ────────────────────────────────────────────────────────
  const legendItems = clusterMode === 'kmeans'
    ? KMEANS_COLOURS.map((colour, i) => ({
        colour,
        label: KMEANS_NAMES[i] ?? `Cluster ${i}`,
      }))
    : [
        ...TOP_HDBSCAN_CLUSTERS.map((id) => ({
          colour: hdbscanColour(id),
          label: HDBSCAN_NAMES[id] ?? `Cluster ${id}`,
        })),
        { colour: HDBSCAN_NOISE_COLOUR, label: `noise / outlier (${hdbscanClusterCounts.get(-1) ?? 0})` },
      ]

  return (
    <div className="assignment2-panel overflow-hidden rounded-[1.6rem] border border-slate-300/70 bg-white/72 p-5 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm md:p-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-data text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">Image Constellation</p>
          <h3 className="font-title text-[clamp(1.45rem,2vw,2rem)] leading-tight text-slate-950">
            A real nearest-neighbour network projected through UMAP space
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Nodes are photographs, positioned by their precomputed UMAP coordinates and linked to nearby images in the shared feature space. Hover or tap a node to inspect the photograph, tags, cluster, and dimensions.
        </p>
      </div>

      {/* Cluster mode toggle */}
      <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
        <button
          onClick={() => setClusterMode('kmeans')}
          className={`rounded-full px-4 py-1.5 transition-colors ${
            clusterMode === 'kmeans'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          K-Means
        </button>
        <button
          onClick={() => setClusterMode('hdbscan')}
          className={`rounded-full px-4 py-1.5 transition-colors ${
            clusterMode === 'hdbscan'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          HDBSCAN
        </button>
      </div>

      <div className="assignment2-graph-shell relative">
        <div ref={containerRef} className="assignment2-graph h-[38rem] w-full rounded-[1.2rem]" />

        {hoveredNode && (
          <article
            className="assignment2-graph-card pointer-events-none absolute z-20 w-[min(20rem,calc(100%-1rem))] overflow-hidden rounded-[1.2rem] border border-slate-200/90 bg-[rgba(255,252,246,0.96)] shadow-[0_26px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-md"
            style={{
              left: `clamp(0.5rem, calc(${hoveredNode.left}px - 1rem), calc(100% - 20.5rem))`,
              top: `clamp(0.5rem, calc(${hoveredNode.top}px - 1rem), calc(100% - 24rem))`,
              transform: 'translate(18px, 18px)',
            }}
          >
            {!imageFailed ? (
              <img
                src={imageUrl(hoveredNode.filename)}
                alt={hoveredNode.filename}
                className="h-44 w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-44 items-end bg-[linear-gradient(135deg,#dfe9f0,#f4ead9)] p-4">
                <p className="font-data text-xs uppercase tracking-[0.22em] text-slate-600">Preview unavailable</p>
              </div>
            )}
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-data text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                    {clusterMode === 'hdbscan'
                      ? (HDBSCAN_NAMES[hoveredNode.hdbscanClusterId] ?? `HDBSCAN Cluster ${hoveredNode.hdbscanClusterId}`)
                      : (KMEANS_NAMES[hoveredNode.clusterId] ?? `K-Means Cluster ${hoveredNode.clusterId}`)}
                  </p>
                  <h4 className="mt-1 font-title text-xl leading-tight text-slate-950">{hoveredNode.filename}</h4>
                </div>
                <div
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs text-white"
                  style={{ backgroundColor: nodeColour(hoveredNode, clusterMode) }}
                >
                  {hoveredNode.styleEnergy}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {hoveredNode.dominant.map((colour) => (
                  <span
                    key={`${hoveredNode.filename}-${colour.hex}`}
                    className="h-7 w-7 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: colour.hex }}
                    title={colour.hex}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {hoveredNode.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-300/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                  <p className="font-data text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Dimensions</p>
                  <p className="mt-1">{hoveredNode.width} × {hoveredNode.height}</p>
                </div>
                <div>
                  <p className="font-data text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Brightness</p>
                  <p className="mt-1">{hoveredNode.brightness}</p>
                </div>
              </div>

              <div>
                <p className="font-data text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Nearby Images</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {hoveredNode.neighbours.length > 0 ? hoveredNode.neighbours.join(', ') : 'No linked neighbours.'}
                </p>
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-3">
        {legendItems.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs text-slate-700"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.colour }} />
            <span className="font-data">{item.label}</span>
          </div>
        ))}
        {clusterMode === 'hdbscan' && (
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500">
            <span className="font-data">+ {Math.max(0, (new Set(assignment2GraphData.nodes.map(n => n.hdbscanClusterId)).size - 1) - TOP_HDBSCAN_CLUSTERS.length)} more clusters</span>
          </div>
        )}
      </div>
    </div>
  )
}
