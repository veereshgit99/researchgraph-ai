import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroBackground from "@/assets/hero-background.jpg";
import { PaperDetailModal, type PaperData } from "@/components/PaperDetailModal";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { useNavigate } from "react-router-dom";
import { paperAPI } from "@/services/api";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trendingPapers, setTrendingPapers] = useState<PaperData[]>([]);
  const [searchResults, setSearchResults] = useState<PaperData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrendingPapers();
  }, []);

  // Search as user types (with debouncing)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Debounce: wait 500ms after user stops typing
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadTrendingPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paperAPI.getAll(1, 3); // Get first 3 papers

      // Transform backend data to frontend format
      const papers: PaperData[] = response.papers?.map((paper: any) => {
        // Determine keywords based on HuggingFace status
        let displayConcepts: string[] = [];
        if (paper.on_huggingface && (paper.hf_ai_keywords || paper.hf_keywords)) {
          displayConcepts = paper.hf_ai_keywords || paper.hf_keywords || [];
        } else {
          const graphConcepts = paper.graph_concepts || [];
          const graphMethods = paper.graph_methods || [];
          displayConcepts = [...graphConcepts, ...graphMethods];
        }

        return {
          title: paper.title || "Untitled",
          authors: (paper.authors && paper.authors.length > 0) ? paper.authors : [],
          year: paper.published_date ? new Date(paper.published_date).getFullYear() : new Date().getFullYear(),
          venue: paper.categories?.[0] || "arXiv",
          concepts: displayConcepts,
          hf_ai_keywords: paper.hf_ai_keywords,
          hf_keywords: paper.hf_keywords,
          graph_concepts: paper.graph_concepts,
          graph_methods: paper.graph_methods,
          description: paper.abstract || "No description available",
          abstract: paper.abstract,
          hf_ai_summary: paper.hf_ai_summary,
          arxiv_id: paper.arxiv_id,
          pdf_url: paper.pdf_url,
          hf_url: paper.hf_url,
          hf_upvotes: paper.hf_upvotes,
          on_huggingface: paper.on_huggingface,
          dataset: paper.datasets?.[0] || undefined,
          metrics: paper.metrics || [],
          models: paper.models || [],
        };
      }) || [];

      setTrendingPapers(papers);
    } catch (err: any) {
      console.error('Failed to load papers:', err);
      setError(err.message || 'Failed to load papers. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setSearching(true);
        console.log("Searching for:", searchQuery);
        const response = await paperAPI.search(searchQuery, 20);
        console.log("Search results:", response);

        // Backend returns array of {paper: {...}, score: number}
        // Transform to frontend format
        const papers: PaperData[] = (Array.isArray(response) ? response : []).map((item: any) => {
          const paper = item.paper || item; // Handle both formats

          // Determine keywords based on HuggingFace status
          let displayConcepts: string[] = [];
          if (paper.on_huggingface && (paper.hf_ai_keywords || paper.hf_keywords)) {
            displayConcepts = paper.hf_ai_keywords || paper.hf_keywords || [];
          } else {
            const graphConcepts = paper.graph_concepts || [];
            const graphMethods = paper.graph_methods || [];
            displayConcepts = [...graphConcepts, ...graphMethods];
          }

          return {
            title: paper.title || "Untitled",
            authors: (paper.authors && paper.authors.length > 0) ? paper.authors : [],
            year: paper.published_date ? new Date(paper.published_date).getFullYear() : new Date().getFullYear(),
            venue: paper.categories?.[0] || "arXiv",
            concepts: displayConcepts,
            hf_ai_keywords: paper.hf_ai_keywords,
            hf_keywords: paper.hf_keywords,
            graph_concepts: paper.graph_concepts,
            graph_methods: paper.graph_methods,
            description: paper.abstract || "No description available",
            abstract: paper.abstract,
            hf_ai_summary: paper.hf_ai_summary,
            arxiv_id: paper.arxiv_id,
            pdf_url: paper.pdf_url,
            hf_url: paper.hf_url,
            hf_upvotes: paper.hf_upvotes,
            on_huggingface: paper.on_huggingface,
            dataset: paper.datasets?.[0] || undefined,
            metrics: paper.metrics || [],
            models: paper.models || [],
          };
        });

        console.log("Transformed papers:", papers);
        setSearchResults(papers);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handlePaperClick = (paper: PaperData) => {
    setSelectedPaper(paper);
    setIsModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading research papers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connection Error</h2>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadTrendingPapers}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaperDetailModal
        paper={selectedPaper}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-in opacity-0 [animation-delay:0.1s] [animation-fill-mode:forwards]">
              The research engine for AI
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed animate-fade-in opacity-0 [animation-delay:0.3s] [animation-fill-mode:forwards]">
              A platform where agents read, connect, and reason across global scientific knowledge.
            </p>

            {/* Enhanced Search Bar */}
            <div className="relative pt-8 animate-fade-in opacity-0 [animation-delay:0.5s] [animation-fill-mode:forwards]">
              <EnhancedSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Search Results for "{searchQuery}"
            </h2>
            <p className="text-muted-foreground text-lg">
              Found {searchResults.length} papers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {searchResults.map((paper, idx) => {
              const authors = Array.isArray(paper.authors) && paper.authors.length > 0
                ? paper.authors
                : [];
              const authorDisplay = authors.length > 6
                ? authors.slice(0, 6).join(", ") + ", et al."
                : authors.join(", ");

              return (
                <Card
                  key={`${paper.title}-${idx}`}
                  onClick={() => handlePaperClick(paper)}
                  className="group p-8 hover:shadow-xl transition-all duration-500 cursor-pointer bg-card border-border rounded-2xl hover:-translate-y-1"
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    animation: 'slideIn 0.6s var(--ease-out-expo) forwards'
                  }}
                >
                  <h3 className="font-bold text-xl mb-3 text-foreground leading-tight group-hover:text-accent-primary transition-colors">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {authorDisplay} · {paper.venue} {paper.year}
                  </p>
                  <p className="text-sm text-foreground/70 mb-6 line-clamp-3 leading-relaxed">
                    {paper.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {paper.concepts.slice(0, 3).map((concept) => (
                      <Badge
                        key={concept}
                        className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border-accent-primary/20 text-xs font-medium px-3 py-1.5 transition-colors"
                      >
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Searching state */}
      {searching && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching for "{searchQuery}"...</p>
          </div>
        </section>
      )}

      {/* Trending Papers */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-3">Trending Papers</h2>
          <p className="text-muted-foreground text-lg">Most explored research this week</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {trendingPapers.map((paper, idx) => {
            const authors = Array.isArray(paper.authors) && paper.authors.length > 0
              ? paper.authors
              : [];
            const authorDisplay = authors.length > 6
              ? authors.slice(0, 6).join(", ") + ", et al."
              : authors.join(", ");

            return (
              <Card
                key={paper.title}
                onClick={() => handlePaperClick(paper)}
                className="group p-8 hover:shadow-xl transition-all duration-500 cursor-pointer bg-card border-border rounded-2xl hover:-translate-y-1"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  animation: 'slideIn 0.6s var(--ease-out-expo) forwards'
                }}
              >
                <h3 className="font-bold text-xl mb-3 text-foreground leading-tight group-hover:text-accent-primary transition-colors">
                  {paper.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {authorDisplay} · {paper.venue} {paper.year}
                </p>
                <p className="text-sm text-foreground/70 mb-6 line-clamp-3 leading-relaxed">
                  {paper.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {paper.concepts.slice(0, 3).map((concept) => (
                    <Badge
                      key={concept}
                      className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border-accent-primary/20 text-xs font-medium px-3 py-1.5 transition-colors"
                    >
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Popular Concepts */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 pb-24">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-3">Popular Concepts</h2>
          <p className="text-muted-foreground text-lg">Explore trending AI & ML concepts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: "Transformers",
              description: "Self-attention mechanism revolutionizing NLP and computer vision tasks",
              papers: "2,847 papers",
              concepts: ["Self-Attention", "BERT", "GPT", "Vision Transformers"]
            },
            {
              name: "Diffusion Models",
              description: "Generative models creating high-quality images through iterative denoising",
              papers: "1,523 papers",
              concepts: ["DALL-E", "Stable Diffusion", "Imagen", "Denoising"]
            },
            {
              name: "Reinforcement Learning",
              description: "Training agents through trial and error to maximize rewards",
              papers: "2,934 papers",
              concepts: ["Q-Learning", "Policy Gradient", "Actor-Critic", "Multi-Agent"]
            },
            {
              name: "Graph Neural Networks",
              description: "Neural networks operating on graph-structured data",
              papers: "1,123 papers",
              concepts: ["GCN", "GAT", "GraphSAGE", "Message Passing"]
            },
          ].map((concept, idx) => (
            <Card
              key={concept.name}
              className="group p-8 hover:shadow-xl transition-all duration-500 cursor-pointer bg-card border-border rounded-2xl hover:-translate-y-1"
              style={{
                animationDelay: `${idx * 0.1}s`,
                animation: 'slideIn 0.6s var(--ease-out-expo) forwards'
              }}
            >
              <h3 className="font-bold text-xl mb-3 text-foreground leading-tight group-hover:text-accent-primary transition-colors">
                {concept.name}
              </h3>
              <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
                {concept.description}
              </p>
              <p className="text-xs text-muted-foreground mb-4 font-medium">
                {concept.papers}
              </p>
              <div className="flex flex-wrap gap-2">
                {concept.concepts.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border-accent-primary/20 text-xs font-medium px-3 py-1.5 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
