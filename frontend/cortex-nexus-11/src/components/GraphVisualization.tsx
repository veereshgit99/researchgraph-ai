import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { paperAPI } from '@/services/api';
import { Loader2 } from 'lucide-react'; interface GraphNode {
    id: string;
    label: string;
    type: string;
    properties: Record<string, any>;
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
    label: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface GraphVisualizationProps {
    arxivId: string;
    hiddenNodeTypes?: string[];
    onGraphLoad?: (nodeTypes: string[]) => void;
}

// Node type colors
const NODE_COLORS = {
    Paper: '#6366f1', // indigo
    Author: '#f59e0b', // amber
    Concept: '#10b981', // emerald
    Method: '#8b5cf6', // violet
    Dataset: '#ec4899', // pink
    Metric: '#06b6d4', // cyan
};

const GraphVisualization = ({ arxivId, hiddenNodeTypes = [], onGraphLoad }: GraphVisualizationProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [allNodes, setAllNodes] = useState<Node[]>([]);
    const [allEdges, setAllEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const nodeTypes = {};

    const getNodeColor = (type: string): string => {
        return NODE_COLORS[type as keyof typeof NODE_COLORS] || '#64748b';
    };

    const getNodeSize = (type: string): number => {
        if (type === 'Paper') return 180;
        if (type === 'Author') return 120;
        return 100;
    };

    const formatNodeTooltip = (node: GraphNode): string => {
        if (node.type !== 'Paper') return '';

        const year = node.properties.published_date
            ? new Date(node.properties.published_date).getFullYear()
            : 'N/A';
        const categories = node.properties.categories?.join(', ') || 'N/A';
        return `📄 ${node.label}\n\n` +
            `Year: ${year}\n` +
            `ArXiv ID: ${node.properties.arxiv_id || 'N/A'}\n` +
            `Categories: ${categories}`;
    };

    const formatEdgeLabel = (edgeType: string): string => {
        switch (edgeType) {
            case 'AUTHORED_BY':
            case 'AUTHORED':
                return 'AUTHORED BY';
            case 'INTRODUCES':
                return 'INTRODUCES';
            case 'PROPOSES':
                return 'PROPOSES';
            case 'EVALUATES_ON':
                return 'EVALUATES ON';
            case 'USES_METRIC':
                return 'USES METRIC';
            default:
                return edgeType;
        }
    };

    const layoutNodes = (graphData: GraphData): { nodes: Node[]; edges: Edge[] } => {
        // Group nodes by type for better layout
        const nodesByType: { [key: string]: GraphNode[] } = {};
        graphData.nodes.forEach(node => {
            if (!nodesByType[node.type]) {
                nodesByType[node.type] = [];
            }
            nodesByType[node.type].push(node);
        });

        const positions: { [key: string]: { x: number; y: number } } = {};

        // Find the paper node (center)
        const paperNode = graphData.nodes.find(n => n.type === 'Paper');
        if (paperNode) {
            positions[paperNode.id] = { x: 500, y: 400 };
        }

        // Layout other nodes in clusters around the paper
        const nodeTypes = ['Author', 'Concept', 'Method', 'Dataset', 'Metric'];
        const angleStep = (2 * Math.PI) / nodeTypes.length;

        nodeTypes.forEach((type, typeIndex) => {
            const nodesOfType = nodesByType[type] || [];
            if (nodesOfType.length === 0) return;

            const baseAngle = typeIndex * angleStep;
            const radius = 300;

            // Arrange nodes of same type in an arc
            nodesOfType.forEach((node, nodeIndex) => {
                const angleOffset = (nodeIndex - (nodesOfType.length - 1) / 2) * 0.3;
                const angle = baseAngle + angleOffset;

                // Add some variation to radius for organic look
                const radiusVariation = 50 * Math.sin(nodeIndex * 2.1);
                const finalRadius = radius + radiusVariation;

                positions[node.id] = {
                    x: 500 + finalRadius * Math.cos(angle),
                    y: 400 + finalRadius * Math.sin(angle),
                };
            });
        });

        // Create edges with different colors based on relationship type
        const getEdgeColor = (type: string) => {
            switch (type) {
                case 'AUTHORED_BY':
                case 'AUTHORED':
                    return '#f59e0b'; // amber
                case 'INTRODUCES':
                    return '#10b981'; // emerald
                case 'PROPOSES':
                    return '#8b5cf6'; // violet
                case 'EVALUATES_ON':
                    return '#ec4899'; // pink
                case 'USES_METRIC':
                    return '#06b6d4'; // cyan
                default:
                    return '#94a3b8'; // slate
            }
        };

        // Create React Flow nodes
        const reactFlowNodes: Node[] = graphData.nodes.map((node) => {
            const nodeWidth = getNodeSize(node.type);
            const pos = positions[node.id] || { x: 0, y: 0 };
            const tooltip = formatNodeTooltip(node);

            return {
                id: node.id,
                type: 'default',
                data: {
                    label: (
                        <div
                            style={{ textAlign: 'center', padding: node.type === 'Paper' ? '10px' : '6px' }}
                            {...(tooltip && { title: tooltip })}
                        >
                            <div style={{
                                fontWeight: 'bold',
                                fontSize: node.type === 'Paper' ? '10px' : '9px',
                                marginBottom: '3px',
                                opacity: 0.7,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                {node.type}
                            </div>
                            <div style={{
                                fontSize: node.type === 'Paper' ? '11px' : '10px',
                                lineHeight: '1.3',
                                fontWeight: node.type === 'Paper' ? 600 : 500,
                            }}>
                                {node.label.length > (node.type === 'Paper' ? 50 : 20)
                                    ? node.label.substring(0, node.type === 'Paper' ? 50 : 20) + '...'
                                    : node.label}
                            </div>
                        </div>
                    ),
                    nodeType: node.type,
                    tooltip: formatNodeTooltip(node),
                },
                position: pos,
                style: {
                    background: getNodeColor(node.type),
                    color: 'white',
                    border: node.type === 'Paper' ? '3px solid rgba(255, 255, 255, 0.5)' : '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    width: nodeWidth,
                    fontSize: '11px',
                    boxShadow: node.type === 'Paper'
                        ? '0 8px 32px rgba(99, 102, 241, 0.4)'
                        : '0 4px 12px rgba(0, 0, 0, 0.15)',
                    cursor: 'pointer',
                },
            };
        });

        const reactFlowEdges: Edge[] = graphData.edges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            type: 'default',
            animated: false,
            label: formatEdgeLabel(edge.type),
            style: {
                stroke: getEdgeColor(edge.type),
                strokeWidth: 2,
                strokeOpacity: 0.4,
            },
            labelStyle: {
                fontSize: '9px',
                fill: '#64748b',
                fontWeight: 600,
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '4px',
            },
            labelBgStyle: {
                fill: 'white',
                fillOpacity: 0.9,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: getEdgeColor(edge.type),
                width: 18,
                height: 18,
            },
        }));

        return { nodes: reactFlowNodes, edges: reactFlowEdges };
    };

    const loadGraph = async () => {
        try {
            setLoading(true);
            setError(null);
            const graphData: GraphData = await paperAPI.getGraph(arxivId);

            if (!graphData.nodes || graphData.nodes.length === 0) {
                setError('No graph data available for this paper');
                setLoading(false);
                return;
            }

            const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodes(graphData);
            setAllNodes(layoutedNodes);
            setAllEdges(layoutedEdges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

            // Extract unique node types and notify parent
            if (onGraphLoad) {
                const nodeTypes = Array.from(new Set(graphData.nodes.map(n => n.type))).filter(t => t !== 'Paper');
                onGraphLoad(nodeTypes);
            }
        } catch (err: any) {
            console.error('Error loading graph:', err);
            setError(err.response?.data?.detail || 'Failed to load graph data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (arxivId) {
            loadGraph();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arxivId]);

    // Filter nodes and edges when hiddenNodeTypes changes
    useEffect(() => {
        if (allNodes.length > 0) {
            const visibleNodes = allNodes.filter(node =>
                !hiddenNodeTypes.includes(node.data.nodeType)
            );
            const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
            const visibleEdges = allEdges.filter(edge =>
                visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
            );
            setNodes(visibleNodes);
            setEdges(visibleEdges);
        }
    }, [hiddenNodeTypes, allNodes, allEdges, setNodes, setEdges]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-accent-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading graph visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-muted-foreground mb-2">{error}</p>
                    <button
                        onClick={loadGraph}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                attributionPosition="bottom-left"
                className="bg-gradient-to-br from-background via-accent/5 to-background"
            >
                <Background color="#e2e8f0" gap={16} />
                <Controls className="bg-card border border-border rounded-lg shadow-lg" />
                <MiniMap
                    nodeColor={(node) => {
                        const type = node.data.label?.props?.children?.[0]?.props?.children || 'default';
                        return getNodeColor(type);
                    }}
                    className="bg-card border border-border rounded-lg shadow-lg"
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>
        </div>
    );
};

export default GraphVisualization;
