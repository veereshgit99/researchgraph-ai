import sys
sys.path.append('../backend')

import arxiv
from datetime import datetime
from app.core.neo4j_driver import get_neo4j_driver
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ingest_arxiv_papers(
    query: str = "cat:cs.AI OR cat:cs.LG",
    max_results: int = 100
):
    """
    Fetch papers from ArXiv and store in Neo4j.
    
    Args:
        query: ArXiv search query
        max_results: Number of papers to fetch
    """
    # Initialize Neo4j
    driver = get_neo4j_driver()
    driver.connect()
    
    # Search ArXiv
    logger.info(f"Searching ArXiv: {query}")
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    papers_added = 0
    papers_skipped = 0
    
    for result in search.results():
        try:
            # Extract paper data
            paper_data = {
                'arxiv_id': result.entry_id.split('/')[-1],
                'title': result.title,
                'abstract': result.summary,
                'published_date': result.published.strftime('%Y-%m-%d'),
                'categories': result.categories,
                'pdf_url': result.pdf_url,
                'citation_count': 0  # We'll add citation data later
            }
            
            # Check if paper already exists
            existing = driver.get_paper(paper_data['arxiv_id'])
            if existing:
                logger.info(f"⏭️  Skipping {paper_data['arxiv_id']} (already exists)")
                papers_skipped += 1
                continue
            
            # Create paper in Neo4j
            driver.create_paper(paper_data)
            logger.info(f"✅ Added: {paper_data['title'][:60]}...")
            papers_added += 1
            
            # Create authors
            for idx, author in enumerate(result.authors, 1):
                author_id = author.name.lower().replace(' ', '-')
                
                # Create author node
                author_query = """
                MERGE (a:Author {id: $id})
                ON CREATE SET
                    a.name = $name,
                    a.created_at = datetime()
                RETURN a.id
                """
                driver.execute_write(author_query, {
                    'id': author_id,
                    'name': author.name
                })
                
                # Link author to paper
                link_query = """
                MATCH (p:Paper {arxiv_id: $arxiv_id})
                MATCH (a:Author {id: $author_id})
                MERGE (p)-[:AUTHORED_BY {position: $position}]->(a)
                """
                driver.execute_write(link_query, {
                    'arxiv_id': paper_data['arxiv_id'],
                    'author_id': author_id,
                    'position': idx
                })
            
        except Exception as e:
            logger.error(f"Error processing paper: {e}")
            continue
    
    logger.info(f"\n📊 Summary:")
    logger.info(f"   Papers added: {papers_added}")
    logger.info(f"   Papers skipped: {papers_skipped}")
    logger.info(f"   Total processed: {papers_added + papers_skipped}")
    
    driver.close()

if __name__ == "__main__":
    # Example queries:
    # "cat:cs.AI OR cat:cs.LG" - AI/ML papers
    # "Transformer" - Papers mentioning Transformer
    # "all:LLM" - Papers about LLMs
    
    ingest_arxiv_papers(
        query="cat:cs.LG",  # Machine Learning category
        max_results=50  # Start with 50 papers
    )
