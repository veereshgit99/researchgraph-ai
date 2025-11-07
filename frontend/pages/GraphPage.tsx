import React, { useState, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import GraphVisualization from '../components/GraphVisualization';
import { GRAPH_NODES, GRAPH_EDGES } from '../constants';
import { GraphNode } from '../types';

type FilterType = GraphNode['type'];

const filterConfig: { type: FilterType; label: string; color: string }[] = [
    { type: 'paper', label: 'Papers', color: 'bg-blue-600' },
    { type: 'concept', label: 'Concepts', color: 'bg-teal-500' },
    { type: 'method', label: 'Methods', color: 'bg-indigo-500' },
];

const FilterButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}> = ({ label, isActive, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
      isActive
        ? `${color} text-white shadow-md`
        : 'bg-white/80 hover:bg-gray-200/50 text-gray-700 border border-gray-200/80'
    }`}
  >
    {label}
  </button>
);


const GraphPage: React.FC = () => {
    const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(() => new Set(['paper', 'concept', 'method']));

    const toggleFilter = (filter: FilterType) => {
        setActiveFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filter)) {
                newFilters.delete(filter);
            } else {
                newFilters.add(filter);
            }
            return newFilters;
        });
    };

    const filteredNodes = useMemo(() =>
        GRAPH_NODES.filter(node => activeFilters.has(node.type)),
        [activeFilters]
    );

    const filteredNodeIds = useMemo(() =>
        new Set(filteredNodes.map(n => n.id)),
        [filteredNodes]
    );

    const filteredEdges = useMemo(() =>
        GRAPH_EDGES.filter(edge =>
            filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
        ),
        [filteredNodeIds]
    );

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in pt-20 md:pt-24 px-4 pb-4">
      <aside className="lg:col-span-1 bg-white/60 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-gray-200/80 flex flex-col gap-6 h-full">
        <h2 className="text-xl font-bold text-gray-800">Explore Connections</h2>
        <SearchBar placeholder="Search a paper..." />
        
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Filters</h3>
          <div className="flex flex-wrap items-center gap-2">
            {filterConfig.map(({ type, label, color }) => (
                <FilterButton
                    key={type}
                    label={label}
                    color={color}
                    isActive={activeFilters.has(type)}
                    onClick={() => toggleFilter(type)}
                />
            ))}
          </div>
        </div>
        
        <div className="flex-grow flex items-center justify-center text-center text-gray-500 text-sm border-2 border-dashed border-gray-300/80 rounded-lg p-4">
          <p>Search for a paper to begin exploring its connections in the graph.</p>
        </div>

      </aside>
      <div className="lg:col-span-3 h-full min-h-[50vh] lg:min-h-0">
        <GraphVisualization nodes={filteredNodes} edges={filteredEdges} />
      </div>
    </div>
  );
};

export default GraphPage;