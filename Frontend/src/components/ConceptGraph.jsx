import { useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import SpriteText from 'three-spritetext'
import { parseHierarchyToGraph } from '../utils/graphParser'

/**
 * ConceptGraph
 * Renders a force-directed knowledge graph from the hierarchy JSON.
 *
 * Props:
 * - data: hierarchy JSON object returned by the backend (data.hierarchy)
 */
function ConceptGraph({ data, onSelectNode, knowledgeStates }) {
  const graphData = useMemo(() => parseHierarchyToGraph(data), [data])
  const fgRef = useRef(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [mode3D, setMode3D] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 800 })
  const containerRef = useRef(null)

  // Track container size to prevent the graph from defaulting to window width
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Make the layout more spacious by tuning the underlying forces.
  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current
    // Spread nodes out more and reduce collisions.
    fg.d3Force('charge').strength(-400)
    fg.d3Force('link').distance(180)
  }, [mode3D])

  // Ensure the whole graph fits inside the panel (for both 2D and 3D).
  useEffect(() => {
    if (!fgRef.current || !graphData.nodes.length) return
    const fg = fgRef.current
    const id = setTimeout(() => {
      if (typeof fg.zoomToFit === 'function') {
        fg.zoomToFit(400, 80)
      }
    }, 400)
    return () => clearTimeout(id)
  }, [graphData, mode3D])

  // Node size based on group
  // Returns radius for 2D, but we'll scale it up for 3D inside the 3D object creator
  const nodeVal = (node) => {
    if (node.group === 'root') return mode3D ? 40 : 15
    if (node.group === 'subtopic') return mode3D ? 25 : 10
    return mode3D ? 15 : 6 // concept
  }

  // Node color based on group and student knowledge state
  const nodeColor = (node) => {
    // Sanitize node ID for lookup (dots are underscores in DB keys)
    const stateKey = node.id ? String(node.id).replace(/\./g, '_') : '';
    
    // If we have knowledge state for this node, use it
    if (knowledgeStates && knowledgeStates[stateKey]) {
      const state = knowledgeStates[stateKey];
      if (state === 'green') return '#22c55e'; // Success Green
      if (state === 'yellow') return '#eab308'; // Warning Yellow
      if (state === 'red') return '#ef4444'; // Error Red
    }

    if (node.group === 'root') return '#ffffff'; // white
    if (node.group === 'subtopic') return '#d1d5db'; // light gray

    return '#6b7280'; // gray
  }

  if (!graphData.nodes.length) {
    return <p style={{ marginTop: '1rem' }}>No concept graph available.</p>
  }

  const handleNodeClick = (node) => {
    const id = String(node.id)
    setSelectedNodeId(id)

    // Notify parent about selection
    if (onSelectNode) {
      onSelectNode(node)
      return
    }

    // Keep root interactions focused in-place
    if (node.group === 'root' && fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
      if (!mode3D) {
        fgRef.current.centerAt(node.x, node.y, 800)
        fgRef.current.zoom(3, 800)
      }
      return
    }

    // Fallback or legacy behavior (can be removed if not needed)
    const url = `/concept?node=${encodeURIComponent(id)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const commonProps = {
    ref: fgRef,
    graphData,
    nodeRelSize: 1,
    nodeVal,
    nodeColor,
    linkColor: () => mode3D ? '#a1a1aa' : '#444444',
    linkOpacity: 0.4,
    linkDirectionalParticles: 2,
    linkDirectionalParticleSpeed: 0.005,
    linkDirectionalParticleWidth: 1.5,
    linkDirectionalParticleColor: () => '#ffffff',
    linkWidth: 1,
    warmupTicks: 80,
    cooldownTicks: 200,
    d3VelocityDecay: 0.25,
    enableNodeDrag: true,
    onNodeClick: handleNodeClick,
    width: dimensions.width,
    height: dimensions.height,
  }

  // 3D Node + Label styling with glow effect
  const nodeThreeObject = (node) => {
    const isSelected = selectedNodeId === String(node.id)
    const radius = nodeVal(node)
    
    // Basic sphere for the node
    const geometry = new THREE.SphereGeometry(radius)
    const material = new THREE.MeshStandardMaterial({ 
      color: nodeColor(node),
      transparent: true,
      opacity: 0.9,
      emissive: isSelected ? '#ffffff' : '#000000',
      emissiveIntensity: isSelected ? 0.5 : 0
    })
    const sphere = new THREE.Mesh(geometry, material)

    // Add glow effect (using a slightly larger, transparent sphere)
    if (isSelected) {
      const glowGeo = new THREE.SphereGeometry(radius * 1.4)
      const glowMat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.2
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      sphere.add(glow)
    }

    // Add white text label
    const sprite = new SpriteText(String(node.id))
    sprite.color = isSelected ? '#ffffff' : '#a1a1aa'
    sprite.textHeight = mode3D ? 12 : 8
    sprite.position.y = radius + 8
    
    const group = new THREE.Group()
    group.add(sphere)
    group.add(sprite)
    return group
  }

  // Enhanced 2D canvas rendering
  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = String(node.id)
    const fontSize = 11 / globalScale
    const isSelected = selectedNodeId === String(node.id)
    const radius = nodeVal(node)

    // Draw shadow/glow
    ctx.shadowColor = isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = (isSelected ? 10 : 4) / globalScale
    
    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = nodeColor(node)
    ctx.fill()
    
    // Reset shadow for subsequent drawings
    ctx.shadowBlur = 0

    // Highlight border for selected node
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
    } else {
      ctx.strokeStyle = '#ffffff33'
      ctx.lineWidth = 1 / globalScale
      ctx.stroke()
    }

    // Draw label
    ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = isSelected ? '#ffffff' : '#a1a1aa'
    ctx.fillText(label, node.x, node.y + radius + 4)
  }

  return (
    <>
      <div className="graph-toolbar">
        <button
          type="button"
          className={!mode3D ? 'graph-mode-btn graph-mode-btn--active' : 'graph-mode-btn'}
          onClick={() => setMode3D(false)}
        >
          2D
        </button>
        <button
          type="button"
          className={mode3D ? 'graph-mode-btn graph-mode-btn--active' : 'graph-mode-btn'}
          onClick={() => setMode3D(true)}
        >
          3D
        </button>
      </div>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '800px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {dimensions.width > 0 && (
          mode3D ? (
            <ForceGraph3D
              {...commonProps}
              backgroundColor="#000000"
              nodeThreeObject={nodeThreeObject}
              onEngineStop={() => {
                const fg = fgRef.current
                if (fg && typeof fg.zoomToFit === 'function') {
                  fg.zoomToFit(400, 80)
                }
              }}
            />
          ) : (
            <ForceGraph2D
              {...commonProps}
              nodeCanvasObject={nodeCanvasObject}
              onEngineStop={() => {
                const fg = fgRef.current
                if (fg && typeof fg.zoomToFit === 'function') {
                  fg.zoomToFit(400, 80)
                }
              }}
            />
          )
        )}
      </div>
      {selectedNodeId && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#e5e7eb' }}>
          Selected: <strong>{selectedNodeId}</strong>
        </p>
      )}
    </>
  )
}

export default ConceptGraph

