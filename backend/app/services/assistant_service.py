from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings
from app.core.neo4j_driver import get_neo4j_driver
import json
import logging

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

class AssistantService:
    def __init__(self):
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-api-key-here":
            raise ValueError(
                "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file. "
                "Get your API key from: https://platform.openai.com/api-keys"
            )
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.neo4j_driver = get_neo4j_driver()  # Use singleton instance
        self.model = settings.OPENAI_MODEL
    
    def _extract_search_terms(self, query: str) -> List[str]:
        """
        Use OpenAI to intelligently extract research-related search terms from the query.
        This is much more accurate than simple keyword extraction.
        """
        try:
            # Use a quick GPT call to extract search terms
            extraction_prompt = f"""Extract 1-3 key technical/research terms from this question that would be useful for searching an academic paper database. 
Only return terms related to research topics, methods, or technical concepts. Ignore conversational words.
If the question is not about research/technical topics, return "NONE".

Question: "{query}"

Return only the search terms as a comma-separated list, or "NONE". Examples:
- "Explain transformers" -> transformer, attention mechanism
- "What's the latest in computer vision?" -> computer vision, vision models
- "Can I ask about sports?" -> NONE
- "Papers about BERT" -> BERT, language model
- "How does reinforcement learning work?" -> reinforcement learning

Search terms:"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use faster model for extraction
                messages=[{"role": "user", "content": extraction_prompt}],
                temperature=0,
                max_tokens=50
            )
            
            result = response.choices[0].message.content.strip()
            
            if result.upper() == "NONE" or not result:
                logger.info(f"No research terms found in query: '{query}'")
                return []
            
            # Parse the comma-separated terms
            search_terms = [term.strip() for term in result.split(',') if term.strip()]
            logger.info(f"Extracted search terms from '{query}': {search_terms}")
            return search_terms
            
        except Exception as e:
            logger.error(f"Error extracting search terms: {e}")
            # Fallback to simple extraction
            return self._simple_term_extraction(query)
    
    def _simple_term_extraction(self, query: str) -> List[str]:
        """Fallback: Simple keyword extraction if OpenAI extraction fails."""
        # Just look for common technical terms as fallback
        query_lower = query.lower()
        common_terms = [
            'transformer', 'attention', 'bert', 'gpt', 'vision', 'language model',
            'neural network', 'deep learning', 'reinforcement learning', 'nlp',
            'computer vision', 'diffusion', 'gan', 'vit', 'llm', 'convolution'
        ]
        
        found_terms = [term for term in common_terms if term in query_lower]
        logger.info(f"Fallback extraction for '{query}': {found_terms}")
        return found_terms[:3] if found_terms else []
    
    def _get_relevant_context(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Retrieve relevant papers and concepts from Neo4j based on the query.
        Uses intelligent term extraction and graph connections.
        """
        # Extract key search terms from the query using AI
        search_terms = self._extract_search_terms(query)
        
        context = {
            "papers": [],
            "concepts": [],
            "methods": []
        }
        
        # If no research terms found, return empty context
        if not search_terms:
            logger.info("No research-related terms found - skipping database search")
            return context
        
        # Search for relevant papers using extracted terms
        with self.neo4j_driver.driver.session() as session:
            # Search with each term
            for search_term in search_terms:
                papers_query = """
                MATCH (p:Paper)
                WHERE toLower(p.title) CONTAINS toLower($query) 
                   OR toLower(p.abstract) CONTAINS toLower($query)
                OPTIONAL MATCH (p)-[:AUTHORED_BY]->(a:Author)
                OPTIONAL MATCH (p)-[:INTRODUCES]->(c:Concept)
                OPTIONAL MATCH (p)-[:PROPOSES]->(m:Method)
                RETURN p, 
                       collect(DISTINCT a.name)[0..3] as authors,
                       collect(DISTINCT c.name)[0..5] as concepts,
                       collect(DISTINCT m.name)[0..3] as methods
                LIMIT $limit
                """
                result = session.run(papers_query, {"query": search_term, "limit": limit})
                
                papers_found = 0
                for record in result:
                    papers_found += 1
                    paper = record["p"]
                    arxiv_id = paper.get("arxiv_id")
                    
                    # Avoid duplicates
                    if not any(p["arxiv_id"] == arxiv_id for p in context["papers"]):
                        context["papers"].append({
                            "arxiv_id": arxiv_id,
                            "title": paper.get("title"),
                            "abstract": paper.get("abstract"),
                            "published_date": str(paper.get("published_date")) if paper.get("published_date") else None,
                            "authors": record["authors"],
                            "concepts": record["concepts"],
                            "methods": record["methods"]
                        })
                
                if papers_found > 0:
                    logger.info(f"Found {papers_found} papers for search term: '{search_term}'")
            
            logger.info(f"Total unique papers found: {len(context['papers'])}")
            
            # Search for relevant concepts using search terms
            for search_term in search_terms:
                concepts_query = """
                MATCH (c:Concept)
                WHERE toLower(c.name) CONTAINS toLower($query)
                OPTIONAL MATCH (p:Paper)-[:INTRODUCES]->(c)
                RETURN c.name as name, 
                       c.category as category,
                       count(p) as paper_count
                ORDER BY paper_count DESC
                LIMIT 5
                """
                result = session.run(concepts_query, {"query": search_term})
            
                for record in result:
                    concept_name = record["name"]
                    if not any(c["name"] == concept_name for c in context["concepts"]):
                        context["concepts"].append({
                            "name": concept_name,
                            "category": record["category"],
                            "paper_count": record["paper_count"]
                        })
            
            # Search for relevant methods using search terms
            for search_term in search_terms:
                methods_query = """
                MATCH (m:Method)
                WHERE toLower(m.name) CONTAINS toLower($query)
                OPTIONAL MATCH (p:Paper)-[:PROPOSES]->(m)
                RETURN m.name as name,
                       m.algorithm_type as type,
                       count(p) as paper_count
                ORDER BY paper_count DESC
                LIMIT 5
                """
                result = session.run(methods_query, {"query": search_term})
            
                for record in result:
                    method_name = record["name"]
                    if not any(m["name"] == method_name for m in context["methods"]):
                        context["methods"].append({
                            "name": method_name,
                            "type": record["type"],
                            "paper_count": record["paper_count"]
                        })
        
        return context
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for the assistant."""
        return """You are an expert AI research assistant specializing in helping researchers explore academic papers, concepts, and methodologies.

Your capabilities:
- Access to a knowledge graph of research papers, concepts, methods, authors, datasets, and metrics
- Deep understanding of machine learning, natural language processing, and AI research
- Ability to explain complex research concepts clearly
- Providing insights about research trends, connections, and recommendations

When answering:
1. Use the provided context from the knowledge graph when available
2. Cite specific papers, concepts, or methods from the context
3. Be concise but informative
4. If you don't have relevant information in the context, say so clearly
5. Suggest related papers or concepts when appropriate
6. Use markdown formatting for better readability

Always be helpful, accurate, and research-focused."""
    
    def _format_context_for_prompt(self, context: Dict[str, Any]) -> str:
        """Format the retrieved context into a readable prompt."""
        context_parts = []
        
        if context["papers"]:
            context_parts.append("## Relevant Papers:")
            for i, paper in enumerate(context["papers"], 1):
                authors_str = ", ".join(paper["authors"][:3])
                if len(paper["authors"]) > 3:
                    authors_str += " et al."
                
                context_parts.append(f"\n{i}. **{paper['title']}**")
                context_parts.append(f"   - Authors: {authors_str}")
                context_parts.append(f"   - ArXiv ID: {paper['arxiv_id']}")
                if paper['published_date']:
                    context_parts.append(f"   - Published: {paper['published_date']}")
                if paper['concepts']:
                    context_parts.append(f"   - Concepts: {', '.join(paper['concepts'])}")
                if paper['methods']:
                    context_parts.append(f"   - Methods: {', '.join(paper['methods'])}")
                if paper['abstract']:
                    # Truncate abstract if too long
                    abstract = paper['abstract'][:300] + "..." if len(paper['abstract']) > 300 else paper['abstract']
                    context_parts.append(f"   - Abstract: {abstract}")
        
        if context["concepts"]:
            context_parts.append("\n## Relevant Concepts:")
            for concept in context["concepts"]:
                context_parts.append(f"- **{concept['name']}** ({concept['category']}) - used in {concept['paper_count']} papers")
        
        if context["methods"]:
            context_parts.append("\n## Relevant Methods:")
            for method in context["methods"]:
                context_parts.append(f"- **{method['name']}** ({method['type']}) - used in {method['paper_count']} papers")
        
        if not any([context["papers"], context["concepts"], context["methods"]]):
            return "No relevant information found in the knowledge graph for this query."
        
        return "\n".join(context_parts)
    
    async def chat(
        self, 
        message: str, 
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return a response with context.
        
        Args:
            message: The user's message
            conversation_history: Previous messages in the conversation
        
        Returns:
            Dict containing response, context, and metadata
        """
        # Get relevant context from Neo4j
        context = self._get_relevant_context(message)
        context_prompt = self._format_context_for_prompt(context)
        
        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": self._build_system_prompt()}
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history[-10:])  # Keep last 10 messages for context
        
        # Add current message with context
        user_message = f"Context from Knowledge Graph:\n{context_prompt}\n\nUser Question: {message}"
        messages.append({"role": "user", "content": user_message})
        
        # Get response from OpenAI
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            
            assistant_message = response.choices[0].message.content
            
            return {
                "response": assistant_message,
                "context": context,
                "sources": {
                    "papers": [p["arxiv_id"] for p in context["papers"]],
                    "concepts": [c["name"] for c in context["concepts"]],
                    "methods": [m["name"] for m in context["methods"]]
                },
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        
        except Exception as e:
            raise Exception(f"Error calling OpenAI API: {str(e)}")
    
    async def stream_chat(
        self, 
        message: str, 
        conversation_history: Optional[List[Dict[str, str]]] = None
    ):
        """
        Stream a chat response for real-time display.
        
        Args:
            message: The user's message
            conversation_history: Previous messages in the conversation
        
        Yields:
            Chunks of the response as they arrive
        """
        # Get relevant context from Neo4j
        context = self._get_relevant_context(message)
        context_prompt = self._format_context_for_prompt(context)
        
        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": self._build_system_prompt()}
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history[-10:])
        
        # Add current message with context
        user_message = f"Context from Knowledge Graph:\n{context_prompt}\n\nUser Question: {message}"
        messages.append({"role": "user", "content": user_message})
        
        # Stream response from OpenAI
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True
            )
            
            # First yield the context
            yield json.dumps({
                "type": "context",
                "data": context
            }) + "\n"
            
            # Then stream the response
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield json.dumps({
                        "type": "content",
                        "data": chunk.choices[0].delta.content
                    }) + "\n"
            
            # Finally send done signal
            yield json.dumps({
                "type": "done",
                "data": {}
            }) + "\n"
        
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "data": str(e)
            }) + "\n"
