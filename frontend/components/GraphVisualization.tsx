import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GRAPH_NODES as initialNodes, GRAPH_EDGES as initialEdges } from '../constants';
import { GraphNode, GraphEdge } from '../types';

const nodeColors = {
  paper: 'fill-blue-600',
  concept: 'fill-teal-500',
  method: 'fill-indigo-500',
};

const nodeRadii = {
  paper: 12,
  concept: 8,
  method: 8,
};

// Physics Constants
const REPULSION_STRENGTH = 1500;
const LINK_STRENGTH = 0.1;
const IDEAL_LINK_DISTANCE = 180;
const CENTERING_FORCE = 0.005;
const DAMPING = 0.95; // velocity decay

type SimNode = GraphNode & { vx: number; vy: number };

const GraphVisualization: React.FC<{ nodes: GraphNode[], edges: GraphEdge[] }> = ({ nodes: visibleNodes, edges: visibleEdges }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>(() =>
    initialNodes.map(node => ({ ...node, vx: 0, vy: 0 }))
  );
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  const simNodeMap = useMemo(() => new Map(simNodes.map(node => [node.id, node])), [simNodes]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  // Main physics simulation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const simulationStep = () => {
      if (draggingNodeId) {
        animationFrameId = requestAnimationFrame(simulationStep);
        return;
      }

      setSimNodes(currentNodes => {
        const newNodes = currentNodes.map(node => ({ ...node, fx: 0, fy: 0 }));

        // Forces
        for (let i = 0; i < newNodes.length; i++) {
          const nodeA = newNodes[i];

          // Repulsion force from other nodes
          for (let j = i + 1; j < newNodes.length; j++) {
            const nodeB = newNodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 1) distance = 1;

            const force = REPULSION_STRENGTH / (distance * distance);
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;

            nodeA.fx -= forceX;
            nodeA.fy -= forceY;
            nodeB.fx += forceX;
            nodeB.fy += forceY;
          }

          // Centering force
          const centerDx = 450 - nodeA.x;
          const centerDy = 400 - nodeA.y;
          nodeA.fx += centerDx * CENTERING_FORCE;
          nodeA.fy += centerDy * CENTERING_FORCE;
        }
        
        // Link force - ONLY for visible edges
        for (const edge of visibleEdges) {
          const sourceNode = newNodes.find(n => n.id === edge.source);
          const targetNode = newNodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) continue;

          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance === 0) continue;

          const displacement = distance - IDEAL_LINK_DISTANCE;
          const force = displacement * LINK_STRENGTH;
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;

          sourceNode.fx += forceX;
          sourceNode.fy += forceY;
          targetNode.fx -= forceX;
          targetNode.fy -= forceY;
        }

        // Update positions
        return newNodes.map(node => {
          if (node.id === draggingNodeId) {
            return { ...node, vx: 0, vy: 0 };
          }
          const newVx = (node.vx + (node.fx || 0)) * DAMPING;
          const newVy = (node.vy + (node.fy || 0)) * DAMPING;
          const newX = node.x + newVx;
          const newY = node.y + newVy;
          return { ...node, x: newX, y: newY, vx: newVx, vy: newVy };
        });
      });

      animationFrameId = requestAnimationFrame(simulationStep);
    };

    simulationStep();

    return () => cancelAnimationFrame(animationFrameId);
  }, [draggingNodeId, visibleEdges]);

  const getSVGPoint = (e: React.MouseEvent) => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svgRef.current.getScreenCTM();
    if (screenCTM) {
      return pt.matrixTransform(screenCTM.inverse());
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    setDraggingNodeId(nodeId);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const point = getSVGPoint(e);
    if (point) {
      setSimNodes(currentNodes =>
        currentNodes.map(n =>
          n.id === draggingNodeId ? { ...n, x: point.x, y: point.y, vx: 0, vy: 0 } : n
        )
      );
    }
  };
  
  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  return (
    <div className="w-full h-full bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/80 shadow-inner overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 900 800" ref={svgRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <style>
          {`
            .edge-pulse {
              stroke-dasharray: 4 8;
              animation: edge-flow 2s linear infinite;
            }
            @keyframes edge-flow {
              from { stroke-dashoffset: 12; }
              to { stroke-dashoffset: 0; }
            }
          `}
        </style>

        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {visibleEdges.map((edge, i) => {
          const sourceNode = simNodeMap.get(edge.source);
          const targetNode = simNodeMap.get(edge.target);
          if (!sourceNode || !targetNode) return null;

          return (
            <g key={`edge-group-${i}`} className="transition-opacity duration-300">
              <line
                key={`edge-bg-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                className="stroke-gray-300/80"
                strokeWidth="1.5"
              />
               <line
                key={`edge-fg-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                className="edge-pulse stroke-gray-400/80"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {simNodes.map(node => (
          <g 
            key={node.id} 
            transform={`translate(${node.x}, ${node.y})`} 
            className={`cursor-grab group transition-opacity duration-300 ${visibleNodeIds.has(node.id) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          >
            <circle
              r={nodeRadii[node.type] + 4}
              className={`${nodeColors[node.type]} opacity-0 transition-opacity duration-300 group-hover:opacity-20`}
            />
            <circle
              r={nodeRadii[node.type]}
              className={`${nodeColors[node.type]} transition-all duration-300 group-hover:stroke-2 group-hover:stroke-white`}
              filter="url(#glow)"
            />
            <text
              textAnchor="middle"
              y={-24}
              className="text-sm fill-gray-800 font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none stroke-white stroke-1"
              paintOrder="stroke"
            >
              {node.label}
            </text>
             <text
              textAnchor="middle"
              y={-24}
              className="text-sm fill-gray-800 font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default GraphVisualization;
