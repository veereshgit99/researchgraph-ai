# ResearchGraph AI

A personalized AI research assistant powered by Neo4j and OpenAI, designed to help researchers discover papers, understand concepts, and explore research landscapes intelligently.

## 🎯 Vision

Build a game-changing research companion that combines a knowledge graph of academic papers with AI-powered natural language understanding to provide context-aware research insights, intelligent discovery, and personalized recommendations.

## ✨ Features

### 🤖 AI Research Assistant
- Chat interface powered by **OpenAI GPT** (GPT-5-nano, GPT-4o-mini, GPT-4o)
- Smart query extraction to understand research intent
- Context-aware responses using Neo4j knowledge graph
- Source citations from your database (papers, concepts, methods)
- Multi-turn conversation with history tracking

### 📚 Knowledge Graph
- Neo4j database storing papers, authors, concepts, methods, datasets, metrics
- Intelligent relationships: papers authored by researchers, introducing concepts, proposing methods
- Fast semantic search across millions of papers

### 📊 Interactive Graph Visualization
- Real-time graph exploration with **React Flow**
- Zoom, pan, and interact with paper networks
- Dynamic filtering by node type
- Hover tooltips showing paper metadata
- Color-coded nodes by type (Paper, Author, Concept, Method, etc.)

### 🔍 Paper Discovery
- Browse all papers with rich metadata
- Full-text search across titles and abstracts
- View detailed paper information with authors, abstract, keywords
- Direct links to ArXiv papers
- HuggingFace AI summaries (when available)

### 📱 Clean, Modern UI
- Built with **React + TypeScript** and **Tailwind CSS**
- Responsive design works on desktop and tablet
- Fast interactions with **Vite** build tool
- Intuitive navigation and user experience

### Graph Data (Neo4j)
```
Nodes: Paper, Author, Concept, Method, Dataset, Metric
Relationships: AUTHORED_BY, INTRODUCES, PROPOSES, EVALUATES_ON, USES_METRIC
```

## 💬 How to Use

### 1. Dashboard
- Browse all papers in your knowledge graph
- Click on papers to view full details
- Search for papers by title/keywords

### 2. Graph View
- Explore paper relationships interactively
- Filter by node type (papers, authors, concepts, etc.)
- Click nodes to highlight connections
- Discover research patterns visually

### 3. AI Assistant
- Ask questions about papers and research topics
- Examples:
  - "Explain transformers"
  - "What papers discuss attention mechanisms?"
  - "Show me papers about few-shot learning"
- AI will cite relevant papers from your database
- Continue multi-turn conversations for deeper exploration

## 🧠 How It Works

### Query Flow
1. **User asks question** → "Explain the Transformer architecture"
2. **AI extracts research terms** → ["Transformer", "attention mechanism"]
3. **Neo4j search** → Find 5 papers matching search terms
4. **Format context** → Create markdown with paper info, concepts, methods
5. **OpenAI processing** → Send context + question to GPT
6. **Return response** → Display response with source citations

### Smart Features
- **Intelligent query extraction** - Uses AI to understand research intent, ignores conversational noise
- **No hallucination** - Only cites papers from your actual knowledge graph
- **Context awareness** - Remembers last 10 messages in conversation
- **Multi-term search** - Searches multiple related terms for better coverage

## 🎓 Examples

### Question: "Explain transformers"
**Assistant responds with:**
- Detailed explanation of transformer architecture
- **Sources:** Papers like "Attention Is All You Need"
- **Concepts:** Self-attention, multi-head attention
- **Methods:** Transformer architecture

### Question: "What papers discuss few-shot learning?"
**Assistant responds with:**
- Overview of few-shot learning
- **Sources:** Relevant papers from your database
- **Concepts:** Few-shot learning, meta-learning
- **Methods:** Prototypical networks, matching networks

## 🤝 Contributing

Contributions welcome! Areas for help:
- Data ingestion scripts for more paper sources
- Frontend improvements and UI/UX
- Backend optimization
- Documentation
- Testing

Built with ❤️ for researchers
