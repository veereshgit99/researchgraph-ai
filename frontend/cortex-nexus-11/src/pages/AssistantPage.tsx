import { useState } from "react";
import { Send, Sparkles, Paperclip, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AssistantPage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI research assistant. Ask me anything about papers, concepts, methods, or help exploring the research landscape.",
    },
  ]);

  const suggestions = [
    "Explain the Transformer architecture",
    "What are the latest advances in computer vision?",
    "Compare BERT and GPT models",
    "Show me papers about few-shot learning",
  ];

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages([...messages, { role: "user", content: message }]);
    setMessage("");

    // Simulate assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I understand you're asking about that topic. Let me help you explore the research landscape and find relevant papers...",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-5 animate-in ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="h-6 w-6 text-accent-primary" />
                </div>
              )}
              <Card className={`p-6 max-w-3xl ${msg.role === "user" ? "bg-accent-primary text-white border-accent-primary shadow-md" : "bg-card border-border shadow-sm"} rounded-2xl`}>
                <p className="text-base leading-relaxed">{msg.content}</p>
              </Card>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="space-y-6 pt-12 animate-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-sm text-muted-foreground text-center font-medium uppercase tracking-wide">Suggested Questions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <Card
                    key={suggestion}
                    className="p-5 cursor-pointer hover:shadow-lg hover:border-accent-primary/50 hover:-translate-y-0.5 transition-all duration-300 border-border bg-card rounded-2xl"
                    onClick={() => setMessage(suggestion)}
                  >
                    <p className="text-sm font-medium text-foreground leading-relaxed">{suggestion}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6">
          <div className="relative flex items-center gap-3 bg-background/95 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3">
            {/* Attach button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-full hover:bg-accent/10"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* Input */}
            <input
              type="text"
              placeholder="Ask about papers, concepts, methods..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent border-none outline-none text-base px-4 py-3 text-foreground placeholder:text-muted-foreground/60"
            />

            {/* Enter/Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="shrink-0 h-11 w-11 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowUp className="h-5 w-5 text-white" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
