import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network, Search, Filter, Shield, Globe, Smartphone,
  Building, Server, ExternalLink, X, Info
} from 'lucide-react';
import { api } from '../services/api';
import { GraphResponse, GraphNode, GraphEdge, Sector } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';

export const ThreatIntelligenceGraph: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<GraphResponse>({ nodes: [], edges: [] });
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('banking');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const [gData, secData] = await Promise.all([
        api.getThreatGraph({ sector_id: selectedSector || undefined }),
        api.getSectors()
      ]);
      setGraphData(gData);
      setSectors(secData);
      if (gData.nodes.length > 0 && !selectedNode) {
        setSelectedNode(gData.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load threat graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [selectedSector]);

  // Compute 2D node positions in a circular / force-directed aesthetic layout for responsive SVG
  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const count = graphData.nodes.length;
    if (count === 0) return posMap;

    const centerX = 360;
    const centerY = 240;
    const radius = Math.min(200, Math.max(130, count * 18));

    // Place brand nodes closer to center
    const brandNodes = graphData.nodes.filter(n => n.type === 'brand');
    const otherNodes = graphData.nodes.filter(n => n.type !== 'brand');

    brandNodes.forEach((node, i) => {
      const bAngle = (i / Math.max(1, brandNodes.length)) * 2 * Math.PI;
      const bRad = 60;
      posMap.set(node.id, {
        x: centerX + Math.cos(bAngle) * bRad,
        y: centerY + Math.sin(bAngle) * bRad
      });
    });

    otherNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, otherNodes.length)) * 2 * Math.PI;
      posMap.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    return posMap;
  }, [graphData.nodes]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'brand': return <Shield className="w-4 h-4 text-white" />;
      case 'social': return <Globe className="w-4 h-4 text-white" />;
      case 'app': return <Smartphone className="w-4 h-4 text-white" />;
      case 'publisher': return <Building className="w-4 h-4 text-white" />;
      case 'domain': return <Server className="w-4 h-4 text-white" />;
      default: return <Network className="w-4 h-4 text-white" />;
    }
  };

  const getNodeColor = (type: string, severity?: string) => {
    if (type === 'brand') return 'fill-indigo-600 stroke-indigo-400';
    if (type === 'domain') return 'fill-sky-500 stroke-sky-300';
    if (type === 'publisher') return 'fill-purple-600 stroke-purple-400';
    if (severity === 'Critical') return 'fill-rose-600 stroke-rose-400';
    if (severity === 'High') return 'fill-orange-500 stroke-orange-300';
    if (severity === 'Medium') return 'fill-amber-500 stroke-amber-300';
    return 'fill-emerald-600 stroke-emerald-400';
  };

  // Find edges connected to the selected node
  const connectedEdges = graphData.edges.filter(
    e => selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cross-Sector Threat Intelligence Graph
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Correlate related candidate findings, rogue publishers, domains, and impersonation clusters backed by verified evidence.
          </p>
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs sm:text-sm font-semibold p-2 border border-slate-200 rounded-lg bg-white text-slate-700 shadow-xs"
          >
            <option value="">All Sectors (Global Graph)</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Legend & Demo Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Entity Types:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> Protected Brand</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-600"></span> Rogue Social Profile</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Suspicious Mobile App</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-600"></span> App Publisher / Dev</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500"></span> Domain / Host</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 italic">
          <Info className="w-3.5 h-3.5" />
          Click any node to view entity dossier and relation evidence.
        </div>
      </div>

      {/* Main Graph & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Interactive Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-inner relative overflow-hidden min-h-[480px] flex items-center justify-center">
          {loading ? (
            <div className="text-slate-400 text-sm animate-pulse">Loading Threat Intelligence Graph...</div>
          ) : graphData.nodes.length === 0 ? (
            <div className="text-slate-400 text-sm">No graph nodes for this sector. Click "Load Demo Data" above.</div>
          ) : (
            <svg
              viewBox="0 0 720 480"
              className="w-full h-full max-h-[520px] select-none"
            >
              {/* Edges */}
              {graphData.edges.map((edge) => {
                const sPos = nodePositions.get(edge.source);
                const tPos = nodePositions.get(edge.target);
                if (!sPos || !tPos) return null;

                const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

                return (
                  <g key={edge.id}>
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={isHighlighted ? '#60a5fa' : '#334155'}
                      strokeWidth={isHighlighted ? 2.5 : 1.2}
                      strokeDasharray={edge.relationship.includes('MISMATCH') ? '4 3' : undefined}
                      opacity={isHighlighted ? 1.0 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => {
                const pos = nodePositions.get(node.id);
                if (!pos) return null;

                const isSelected = selectedNode?.id === node.id;
                const radius = node.type === 'brand' ? 22 : 17;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={radius}
                      className={`${getNodeColor(node.type, node.severity)} transition-all shadow-md`}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />

                    {/* Node Label Text */}
                    <text
                      y={radius + 14}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={10}
                      fontWeight="600"
                      className="pointer-events-none drop-shadow"
                    >
                      {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Synthetic Demo Watermark */}
          <div className="absolute bottom-3 left-4 text-[11px] text-slate-500 font-mono">
            Graph Mode: Synthetic Correlated Entities
          </div>
        </div>

        {/* Selected Entity Dossier Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-sentinel-600" />
                <h3 className="font-bold text-slate-900 text-sm">Entity Intelligence Dossier</h3>
              </div>
              {selectedNode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{selectedNode.label}</h4>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedNode.id}</div>
                </div>

                {selectedNode.severity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Risk Assessment:</span>
                    <SeverityBadge severity={selectedNode.severity} score={selectedNode.risk_score} />
                  </div>
                )}

                {/* Evidence Relations */}
                <div>
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    Verified Relationship Evidence ({connectedEdges.length})
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {connectedEdges.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No direct links found.</p>
                    ) : (
                      connectedEdges.map((e) => (
                        <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="font-semibold text-sentinel-700 flex items-center justify-between">
                            <span>{e.relationship}</span>
                            <span className="text-[10px] font-mono text-slate-400">Confidence {(e.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {e.evidence}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select a graph node to inspect relationships and correlation evidence.
              </div>
            )}
          </div>

          {selectedNode && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => navigate('/investigations')}
                className="w-full py-2 bg-slate-50 hover:bg-sentinel-50 text-sentinel-600 rounded-lg text-xs font-semibold border border-slate-200 hover:border-sentinel-300 transition-colors"
              >
                Inspect in Investigation Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
