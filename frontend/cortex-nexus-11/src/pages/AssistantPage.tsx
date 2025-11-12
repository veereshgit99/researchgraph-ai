import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Paperclip, ArrowUp, FileText, Lightbulb, Zap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assistantAPI, Message } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AssistantMessage extends Message {
  sources?: {
    papers: string[];
    concepts: string[];
    methods: string[];
  };
  context?: {
    papers: any[];
    concepts: any[];
    methods: any[];
  };
}

const AssistantPage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI research assistant. I have access to a knowledge graph of research papers, concepts, methods, and more. Ask me anything about papers, explain complex concepts, or help you explore the research landscape.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const suggestions = [
    "Explain the Transformer architecture",
    "What are the latest advances in computer vision?",
    "Compare BERT and GPT models",
    "Show me papers about few-shot learning",
    "What are common evaluation metrics in NLP?",
    "Explain self-supervised learning",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Add user message
    const newMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      // Call the chat API with conversation history
      const conversationHistory = newMessages.slice(1); // Exclude initial greeting
      const response = await assistantAPI.chat({
        message: userMessage,
        conversation_history: conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Add assistant response with sources
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.response,
          sources: response.sources,
          context: response.context,
        },
      ]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from assistant",
        variant: "destructive",
      });

      // Add error message
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-5 animate-in`}>
              <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                {msg.role === "assistant" ? (
                  <Sparkles className="h-6 w-6 text-accent-primary" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center text-sm font-semibold">
                    V
                  </div>
                )}
              </div>
              <div className="max-w-3xl space-y-3">
                <Card className="p-6 bg-card border-border shadow-sm rounded-2xl">
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{msg.content}</p>
                </Card>

                {/* Display sources if available */}
                {msg.role === "assistant" && msg.sources && (
                  <div className="space-y-2 pl-2">
                    {msg.sources.papers.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground">Sources:</span>
                          {msg.sources.papers.map((paper, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {paper}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.sources.concepts.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <Lightbulb className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground">Concepts:</span>
                          {msg.sources.concepts.map((concept, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.sources.methods.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <Zap className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground">Methods:</span>
                          {msg.sources.methods.map((method, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-5 animate-in">
              <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="h-6 w-6 text-accent-primary" />
              </div>
              <Card className="p-6 bg-card border-border shadow-sm rounded-2xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
                  <p className="text-base text-muted-foreground">Thinking...</p>
                </div>
              </Card>
            </div>
          )}

          {messages.length === 1 && !isLoading && (
            <div className="space-y-6 pt-12 animate-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-sm text-muted-foreground text-center font-medium uppercase tracking-wide">Suggested Questions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion}
                    className="p-5 cursor-pointer hover:shadow-lg hover:border-accent-primary/50 hover:-translate-y-0.5 transition-all duration-300 border-border bg-card rounded-2xl"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <p className="text-sm font-medium text-foreground leading-relaxed">{suggestion}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6">
          <div className="relative flex items-center gap-3 bg-background/95 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3">
            {/* Attach button - disabled for now */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-full hover:bg-accent/10"
              disabled
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* Input */}
            <input
              type="text"
              placeholder="Ask about papers, concepts, methods..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-base px-4 py-3 text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50"
            />

            {/* Enter/Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="shrink-0 h-11 w-11 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5 text-white" strokeWidth={2.5} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
