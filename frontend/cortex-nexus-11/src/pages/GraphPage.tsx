import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import GraphVisualization from "@/components/GraphVisualization";
import { useSearchParams } from "react-router-dom";

const GraphPage = () => {
  const [searchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([]);

  // Check for paper parameter in URL on mount
  useEffect(() => {
    const paperParam = searchParams.get('paper');
    if (paperParam) {
      setSelectedPaper(paperParam);
    }
  }, [searchParams]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleGraphLoad = (nodeTypes: string[]) => {
    setAvailableNodeTypes(nodeTypes);
  };

  const getFilterColor = (type: string) => {
    switch (type) {
      case 'Author':
        return 'from-amber-500 to-orange-500';
      case 'Concept':
        return 'from-emerald-500 to-teal-500';
      case 'Method':
        return 'from-violet-500 to-purple-500';
      case 'Dataset':
        return 'from-pink-500 to-rose-500';
      case 'Metric':
        return 'from-cyan-500 to-blue-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  const getFilterBgColor = (type: string) => {
    switch (type) {
      case 'Author':
        return { active: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20', inactive: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600' };
      case 'Concept':
        return { active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20', inactive: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600' };
      case 'Method':
        return { active: 'bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20', inactive: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-500/20 hover:from-violet-600 hover:to-purple-600' };
      case 'Dataset':
        return { active: 'bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20', inactive: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 hover:from-pink-600 hover:to-rose-600' };
      case 'Metric':
        return { active: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20', inactive: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-600' };
      default:
        return { active: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20', inactive: 'bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-md shadow-slate-500/20 hover:from-slate-600 hover:to-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-96 border-r border-border/50 bg-card/50 backdrop-blur-sm p-8">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Knowledge Graph
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Discover connections between papers, concepts, and methods
            </p>
          </div>

          {/* Filters - Only show if graph is loaded */}
          {selectedPaper && availableNodeTypes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                Filter by Type
              </h3>
              <div className="flex flex-col gap-2">
                {availableNodeTypes.map((type) => {
                  const isActive = !activeFilters.includes(type);
                  const colors = getFilterBgColor(type);

                  return (
                    <Badge
                      key={type}
                      onClick={() => toggleFilter(type)}
                      className={`cursor-pointer px-4 py-3 text-sm font-medium transition-all rounded-lg flex items-center justify-between ${isActive ? colors.inactive : `${colors.active} border`
                        }`}
                    >
                      <span>{type}s</span>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}          {/* Selected Paper Info */}
          {selectedPaper ? (
            <div className="border border-border/60 rounded-xl p-6 bg-card/50">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-accent-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Viewing Graph
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedPaper}
                </p>
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="mt-4 px-4 py-2 text-xs bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border/60 rounded-xl p-8 bg-accent/5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-accent-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click on a paper from the Dashboard to view its knowledge graph
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Graph Area */}
      <main className="flex-1 relative">
        {selectedPaper ? (
          <GraphVisualization
            arxivId={selectedPaper}
            hiddenNodeTypes={activeFilters}
            onGraphLoad={handleGraphLoad}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Paper Selected
              </h3>
              <p className="text-muted-foreground">
                Use the search bar on the left to find a paper and visualize its knowledge graph
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GraphPage;
