import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Network, Sparkles, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface PaperData {
  title: string;
  authors: string | string[];
  year: number;
  venue: string;
  description: string;
  abstract?: string;
  hf_ai_summary?: string;
  hf_ai_keywords?: string[];
  hf_keywords?: string[];
  graph_concepts?: string[];
  graph_methods?: string[];
  concepts: string[];
  dataset?: string;
  metrics?: string[];
  models?: { name: string; variant?: "base" | "big" }[];
  arxiv_id?: string;
  pdf_url?: string;
  hf_url?: string;
  hf_upvotes?: number;
  on_huggingface?: boolean;
}

interface PaperDetailModalProps {
  paper: PaperData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaperDetailModal = ({ paper, open, onOpenChange }: PaperDetailModalProps) => {
  const navigate = useNavigate();

  if (!paper) return null;

  // Format authors - handle both string and array
  const authorsText = Array.isArray(paper.authors)
    ? paper.authors.join(", ")
    : paper.authors;

  // Get keywords based on whether paper is on HuggingFace
  let keywords: string[] = [];
  if (paper.on_huggingface && (paper.hf_ai_keywords || paper.hf_keywords)) {
    // Use HF keywords for papers on HuggingFace
    keywords = paper.hf_ai_keywords || paper.hf_keywords || [];
  } else {
    // Use graph concepts and methods for papers not on HuggingFace
    const graphConcepts = paper.graph_concepts || [];
    const graphMethods = paper.graph_methods || [];
    keywords = [...graphConcepts, ...graphMethods];
  }

  // Limit to 10 keywords max
  keywords = keywords.slice(0, 10);

  const handleViewGraph = () => {
    if (paper.arxiv_id) {
      onOpenChange(false);
      navigate(`/graph?paper=${paper.arxiv_id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="h-full max-h-[90vh]">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold text-foreground leading-tight pr-8">
                {paper.title}
              </DialogTitle>
              <p className="text-muted-foreground text-base mt-3 font-medium">
                {authorsText} · {paper.venue} {paper.year}
              </p>
            </DialogHeader>

            <div className="space-y-8">
              {/* HF AI Summary - Highlighted */}
              {paper.hf_ai_summary && (
                <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <h3 className="text-sm font-bold text-accent-primary uppercase tracking-wider">
                      AI SUMMARY
                    </h3>
                  </div>
                  <p className="text-foreground text-base leading-relaxed pl-8">
                    {paper.hf_ai_summary}
                  </p>
                </div>
              )}

              {/* Abstract */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  ABSTRACT
                </h3>
                <p className="text-foreground/80 text-base leading-relaxed">
                  {paper.abstract || paper.description}
                </p>
              </div>

              {/* Keywords - Horizontal layout to save space */}
              {keywords.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    KEYWORDS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, idx) => (
                      <Badge
                        key={`${keyword}-${idx}`}
                        className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border-accent-primary/20 text-sm font-medium px-3 py-1.5"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Two column layout for metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Metrics */}
                  {paper.metrics && paper.metrics.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        METRICS
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {paper.metrics.map((metric) => (
                          <Badge
                            key={metric}
                            variant="outline"
                            className="text-sm font-medium px-3 py-1.5 bg-muted/50"
                          >
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Dataset */}
                  {paper.dataset && (
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        DATASET
                      </h3>
                      <p className="text-foreground font-medium text-base">{paper.dataset}</p>
                    </div>
                  )}

                  {/* Models */}
                  {paper.models && paper.models.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        MODELS
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {paper.models.map((model) => (
                          <Badge
                            key={model.name}
                            className={
                              model.variant === "base"
                                ? "bg-green-600 text-white hover:bg-green-700 text-sm font-medium px-3 py-1.5"
                                : "bg-green-700 text-white hover:bg-green-800 text-sm font-medium px-3 py-1.5"
                            }
                          >
                            {model.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="default"
                  className="gap-2"
                  onClick={handleViewGraph}
                  disabled={!paper.arxiv_id}
                >
                  <Network className="h-4 w-4" />
                  View in Graph
                </Button>
                <Button variant="ghost" size="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </Button>
                {paper.pdf_url && (
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2 ml-auto"
                    onClick={() => window.open(paper.pdf_url, '_blank')}
                  >
                    <FileText className="h-4 w-4" />
                    View PDF
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                {paper.hf_url && (
                  <Button
                    size="default"
                    className="gap-2"
                    onClick={() => window.open(paper.hf_url, '_blank')}
                  >
                    View on Hugging Face
                    <ExternalLink className="h-3 w-3" />
                    {paper.hf_upvotes && (
                      <Badge variant="secondary" className="ml-2">
                        ❤️ {paper.hf_upvotes}
                      </Badge>
                    )}
                  </Button>
                )}
                {paper.arxiv_id && !paper.hf_url && (
                  <Button
                    size="default"
                    className="gap-2"
                    onClick={() => window.open(`https://arxiv.org/abs/${paper.arxiv_id}`, '_blank')}
                  >
                    View on ArXiv
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
