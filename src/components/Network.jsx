import { useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { photographUrl } from '../lib/photographs'

// ── K-Means palette (8 fixed clusters) ──────────────────────────────────────
const KMEANS_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

function kmeansColour(clusterId) {
  return KMEANS_COLOURS[clusterId % KMEANS_COLOURS.length]
}

// ── HDBSCAN palette — 33 comfortable, distinct muted tones ──────────────────
const HDBSCAN_NOISE_COLOUR = '#94a3b8'

const HDBSCAN_PALETTE = [
  '#d97b7b', // muted red
  '#d8905e', // terracotta
  '#d4a84e', // amber
  '#b8b83c', // olive
  '#88c45a', // lime
  '#50c47e', // mint
  '#3cb89a', // seafoam
  '#42a8cc', // sky
  '#4e86d4', // cornflower
  '#6270cc', // periwinkle
  '#8258c8', // violet
  '#a448b4', // purple
  '#c2489e', // magenta
  '#cc5484', // rose
  '#cc6e6e', // salmon
  '#c49060', // sandy brown
  '#b0b45a', // khaki
  '#80bc54', // yellow-green
  '#4cb48a', // teal-green
  '#3aa0b0', // cyan-teal
  '#4488c4', // medium blue
  '#5c6cbc', // slate blue
  '#7458b4', // medium violet
  '#9454a4', // plum
  '#b44494', // orchid
  '#cc547a', // warm pink
  '#d08858', // peach
  '#a4b43c', // yellow-olive
  '#68b44c', // grass green
  '#3cb49e', // aqua
  '#4478b8', // azure
  '#5458a4', // indigo
  '#7c4ca4', // deep violet
]

const imageUrl = photographUrl

function computeDerived(nodes) {
  const counts = new Map()
  for (const node of nodes) {
    const id = node.hdbscanClusterId
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const ALL_HDBSCAN_CLUSTERS = [...counts.keys()].filter((id) => id !== -1).sort((a, b) => a - b)

  const KMEANS_NAMES = {}
  for (const node of nodes) {
    if (node.clusterId != null && node.clusterName && !(node.clusterId in KMEANS_NAMES))
      KMEANS_NAMES[node.clusterId] = node.clusterName
  }

  const HDBSCAN_NAMES = { [-1]: 'noise / outlier' }
  for (const node of nodes) {
    if (node.hdbscanClusterId != null && node.hdbscanClusterName && !(node.hdbscanClusterId in HDBSCAN_NAMES))
      HDBSCAN_NAMES[node.hdbscanClusterId] = node.hdbscanClusterName
  }

  return { ALL_HDBSCAN_CLUSTERS, KMEANS_NAMES, HDBSCAN_NAMES }
}

export default function Network() {
  const containerRef = useRef(null)
  const sigmaRef = useRef(null)
  const graphRef = useRef(null)
  const neighborMapRef = useRef(null)
  const hoveredNodeRef = useRef(null)
  const hoveredClusterRef = useRef(null)
  const clusterModeRef = useRef('kmeans')
  const derivedRef = useRef(null)
  const [clusterMode, setClusterMode] = useState('kmeans')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoveredCluster, setHoveredCluster] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [graphData, setGraphData] = useState(null)
  const [derived, setDerived] = useState(null)

  // ── Load graph data on mount (deferred so the 5 MB file isn't parsed eagerly)
  useEffect(() => {
    import('../data/assignment2GraphData').then(({ assignment2GraphData }) => {
      const d = computeDerived(assignment2GraphData.nodes)
      derivedRef.current = d
      setDerived(d)
      setGraphData(assignment2GraphData)
    })
  }, [])

  // ── Colour helpers (inside component so they close over derivedRef) ─────────
  function hdbscanColour(clusterId) {
    if (clusterId === -1) return HDBSCAN_NOISE_COLOUR
    const allClusters = derivedRef.current?.ALL_HDBSCAN_CLUSTERS ?? []
    const idx = allClusters.indexOf(clusterId)
    return HDBSCAN_PALETTE[idx >= 0 ? idx % HDBSCAN_PALETTE.length : clusterId % HDBSCAN_PALETTE.length]
  }

  function nodeColour(node, mode) {
    return mode === 'hdbscan' ? hdbscanColour(node.hdbscanClusterId) : kmeansColour(node.clusterId)
  }

  // ── Main sigma setup (runs once graphData is available) ───────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container || !graphData) return undefined

    const graph = new Graph({ multi: true })
    const neighborMap = new Map()

    // Build neighbour map for both edge sets (union)
    for (const edgeSet of [graphData.edges, graphData.hdbscanEdges ?? []]) {
      for (const edge of edgeSet) {
        if (!neighborMap.has(edge.source)) neighborMap.set(edge.source, new Set())
        if (!neighborMap.has(edge.target)) neighborMap.set(edge.target, new Set())
        neighborMap.get(edge.source).add(edge.target)
        neighborMap.get(edge.target).add(edge.source)
      }
    }

    for (const node of graphData.nodes) {
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
    for (const edge of graphData.edges) {
      graph.addEdge(edge.source, edge.target, {
        mode: 'kmeans',
        size: Math.max(0.35, 1.2 - edge.distance),
        color: 'rgba(15, 23, 42, 0.28)',
        distance: edge.distance,
      })
    }
    for (const edge of (graphData.hdbscanEdges ?? [])) {
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
      const highlightCluster = hoveredClusterRef.current
      const attrs = graph.getNodeAttributes(node)
      const baseColor = nodeColour(attrs, mode)

      // Node hover takes priority over cluster hover
      if (hovered) {
        const isFocus = node === hovered.filename
        const isNeighbour = neighborMapRef.current?.get(hovered.filename)?.has(node)
        if (isFocus || isNeighbour) {
          return { ...data, color: baseColor, zIndex: 1, size: isFocus ? data.size * 1.35 : data.size * 1.08 }
        }
        return { ...data, color: 'rgba(148, 163, 184, 0.18)', size: Math.max(1.4, data.size * 0.72) }
      }

      // Cluster hover from legend
      if (highlightCluster !== null) {
        const nodeCluster = mode === 'hdbscan' ? attrs.hdbscanClusterId : attrs.clusterId
        if (nodeCluster === highlightCluster) {
          return { ...data, color: baseColor, zIndex: 1 }
        }
        return { ...data, color: 'rgba(148, 163, 184, 0.1)', size: Math.max(1.4, data.size * 0.72) }
      }

      return { ...data, color: baseColor }
    })

    sigma.setSetting('edgeReducer', (edge, data) => {
      const mode = clusterModeRef.current
      const hovered = hoveredNodeRef.current
      const highlightCluster = hoveredClusterRef.current
      const edgeMode = graphRef.current?.getEdgeAttribute(edge, 'mode')

      // Hide edges that don't belong to the active mode
      if (edgeMode !== mode) return { ...data, hidden: true }

      if (!graphRef.current) return data

      const source = graphRef.current.source(edge)
      const target = graphRef.current.target(edge)

      // Node hover takes priority over cluster hover
      if (hovered) {
        const related = source === hovered.filename || target === hovered.filename
        if (related) {
          return { ...data, color: 'rgba(15, 23, 42, 0.34)', size: data.size * 1.5, hidden: false }
        }
        return { ...data, color: 'rgba(148, 163, 184, 0.12)' }
      }

      if (highlightCluster !== null) {
        const srcCluster = mode === 'hdbscan'
          ? graphRef.current.getNodeAttribute(source, 'hdbscanClusterId')
          : graphRef.current.getNodeAttribute(source, 'clusterId')
        const tgtCluster = mode === 'hdbscan'
          ? graphRef.current.getNodeAttribute(target, 'hdbscanClusterId')
          : graphRef.current.getNodeAttribute(target, 'clusterId')
        if (srcCluster === highlightCluster && tgtCluster === highlightCluster) {
          return data
        }
        return { ...data, color: 'rgba(148, 163, 184, 0.08)' }
      }

      return data
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
  }, [graphData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync hovered node ref + refresh on hover change ───────────────────────
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode
    sigmaRef.current?.refresh()
  }, [hoveredNode])

  // ── Sync hovered cluster ref + refresh ───────────────────────────────────
  useEffect(() => {
    hoveredClusterRef.current = hoveredCluster
    sigmaRef.current?.refresh()
  }, [hoveredCluster])

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

  const handleZoomIn = () => {
    sigmaRef.current?.getCamera().animatedZoom({ duration: 260 })
  }

  const handleZoomOut = () => {
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 260 })
  }

  const handleResetView = () => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 500 })
  }

  // ── Legend content ────────────────────────────────────────────────────────
  const legendItems = !derived ? [] : clusterMode === 'kmeans'
    ? KMEANS_COLOURS.map((colour, i) => ({
        colour,
        label: derived.KMEANS_NAMES[i] ?? `Cluster ${i}`,
        clusterId: i,
      }))
    : derived.ALL_HDBSCAN_CLUSTERS.map((id) => ({
        colour: hdbscanColour(id),
        label: derived.HDBSCAN_NAMES[id] ?? `Cluster ${id}`,
        clusterId: id,
      }))

  return (
    <div className="assignment2-panel overflow-hidden rounded-[1.6rem] border border-slate-300/70 bg-white/72 p-5 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm md:p-7 mx-auto" style={{ maxWidth: 'min(100%, 1120px)' }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-data text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">Image Constellation</p>
          <h3 className="font-title text-[clamp(1.45rem,2vw,2rem)] leading-tight text-slate-950">
            A real nearest-neighbour network projected through UMAP space
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Nodes are photographs, positioned by their precomputed UMAP coordinates and linked to nearby images in the shared feature space. Hover a node to inspect the photograph, cluster, and other information.
        </p>
      </div>

      {/* Cluster mode toggle */}
      <div className="atlas-display-tabs__list-container mb-4">
        <div
          className="atlas-display-tabs__list"
          role="group"
          aria-label="Cluster algorithm"
          style={{ '--atlas-active-tab-index': clusterMode === 'kmeans' ? 0 : 1, '--atlas-tab-gap': '3px' }}
        >
          <span aria-hidden="true" className="atlas-display-tabs__indicator" />
          {[['kmeans', 'K-Means'], ['hdbscan', 'HDBSCAN']].map(([key, label], index) => (
            <button
              key={key}
              type="button"
              aria-pressed={clusterMode === key}
              className="atlas-display-tabs__tab"
              data-selected={clusterMode === key}
              style={{ minWidth: 0, minHeight: 0, padding: '0.35rem 0.95rem' }}
              onClick={() => setClusterMode(key)}
            >
              {index > 0 && <span aria-hidden="true" className="atlas-display-tabs__separator" />}
              <span className="atlas-display-tabs__label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="assignment2-graph-shell relative">
        <div ref={containerRef} className="assignment2-graph h-[34rem] w-full rounded-[1.2rem]" />

        <div className="assignment2-map-toolbar" aria-label="Network zoom controls">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="assignment2-map-toolbtn"
            aria-label="Zoom in"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="assignment2-map-toolbtn"
            aria-label="Zoom out"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title="Return to 100%"
            className="assignment2-map-toolbtn"
            aria-label="Return network to 100%"
          >
            <span className="assignment2-map-toolbtn-glow" aria-hidden="true" />
            <span className="assignment2-map-toolbtn-face" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </span>
          </button>
        </div>

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
            <div className="space-y-2.5 p-3">
              <div>
                <p className="font-data text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                  {clusterMode === 'hdbscan'
                    ? (derived?.HDBSCAN_NAMES[hoveredNode.hdbscanClusterId] ?? `HDBSCAN Cluster ${hoveredNode.hdbscanClusterId}`)
                    : (derived?.KMEANS_NAMES[hoveredNode.clusterId] ?? `K-Means Cluster ${hoveredNode.clusterId}`)}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {hoveredNode.dominant.map((colour) => (
                  <span
                    key={`${hoveredNode.filename}-${colour.hex}`}
                    className="h-5 w-5 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: colour.hex }}
                    title={colour.hex}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {(hoveredNode.gemmaKeywords ?? []).map((kw) => (
                  <span key={kw} className="rounded-full border border-slate-300/80 bg-slate-50 px-2 py-0.5 text-[0.68rem] text-slate-600">
                    {kw}
                  </span>
                ))}
              </div>

              <div>
                <p className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">Nearby Images</p>
                {hoveredNode.neighbours.length > 0 ? (
                  <div className="mt-1.5 flex gap-1.5">
                    {hoveredNode.neighbours.map((filename) => (
                      <img
                        key={filename}
                        src={imageUrl(filename)}
                        alt={filename}
                        className="h-12 w-12 rounded-md object-cover shadow-sm"
                        title={filename}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-600">No linked neighbours.</p>
                )}
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs text-slate-700 transition-all"
            style={{ opacity: hoveredCluster !== null && hoveredCluster !== item.clusterId ? 0.4 : 1 }}
            onMouseEnter={() => setHoveredCluster(item.clusterId)}
            onMouseLeave={() => setHoveredCluster(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.colour }} />
            <span className="font-data">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
