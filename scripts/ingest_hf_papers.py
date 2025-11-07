import sys
sys.path.append('../backend')

import time
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.neo4j_driver import get_neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_PAPERS_SEARCH_API = "https://huggingface.co/api/papers/search"
HF_DAILY_PAPERS_API = "https://huggingface.co/api/daily_papers"

def fetch_hf_daily_papers(date: str = None) -> List[Dict]:
    """Fetch daily papers from Hugging Face"""
    url = HF_DAILY_PAPERS_API
    if date:
        url = f"{url}?date={date}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching HF daily papers: {e}")
        return []

def search_hf_papers(query: str = None, date: str = None) -> List[Dict]:
    """
    Search papers on Hugging Face (undocumented API).
    
    Args:
        query: Search query (e.g., 'transformer', 'LLM')
        date: Date filter in YYYY-MM-DD format
    """
    params = {}
    if query:
        params['q'] = query
    if date:
        params['date'] = date
    
    try:
        response = requests.get(HF_PAPERS_SEARCH_API, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error searching HF papers: {e}")
        return []

def create_paper_from_hf(driver, paper: Dict):
    """Create Paper node from HF data"""
    query = """
    MERGE (p:Paper {arxiv_id: $arxiv_id})
    ON CREATE SET
        p.title = $title,
        p.abstract = $abstract,
        p.published_date = date($published_date),
        p.pdf_url = $pdf_url,
        p.hf_url = $hf_url,
        p.hf_upvotes = $upvotes,
        p.on_huggingface = true,
        p.created_at = datetime(),
        p.source = 'huggingface',
        p.enriched = false
    ON MATCH SET
        p.hf_upvotes = $upvotes,
        p.on_huggingface = true,
        p.updated_at = datetime()
    """
    
    arxiv_id = paper.get('id', '')
    
    try:
        driver.execute_write(query, {
            'arxiv_id': arxiv_id,
            'title': paper.get('title', ''),
            'abstract': paper.get('summary', ''),
            'published_date': paper.get('publishedAt', '')[:10],
            'pdf_url': f"https://arxiv.org/pdf/{arxiv_id}",
            'hf_url': f"https://huggingface.co/papers/{arxiv_id}",
            'upvotes': paper.get('upvotes', 0)
        })
    except Exception as e:
        logger.error(f"Error creating paper {arxiv_id}: {e}")

def ingest_hf_papers_bulk(
    use_daily: bool = True,
    use_search: bool = False,
    search_queries: List[str] = None,
    days_back: int = 7
):
    """
    Ingest papers from Hugging Face.
    
    Args:
        use_daily: Use daily papers API
        use_search: Use search API (undocumented)
        search_queries: List of search queries
        days_back: Number of days to fetch
    """
    driver = get_neo4j_driver()
    driver.connect()
    
    total_ingested = 0
    
    # Fetch daily papers
    if use_daily:
        logger.info(f"\n{'='*60}")
        logger.info(f"Fetching HF daily papers for last {days_back} days")
        logger.info(f"{'='*60}\n")
        
        for i in range(days_back):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            logger.info(f"Fetching papers for {date}...")
            
            papers = fetch_hf_daily_papers(date)
            logger.info(f"Found {len(papers)} papers")
            
            for paper in papers:
                create_paper_from_hf(driver, paper)
                total_ingested += 1
            
            time.sleep(2)
    
    # Search papers by query
    if use_search and search_queries:
        logger.info(f"\n{'='*60}")
        logger.info(f"Searching HF papers with queries")
        logger.info(f"{'='*60}\n")
        
        for query in search_queries:
            logger.info(f"Searching for: {query}")
            
            papers = search_hf_papers(query=query)
            logger.info(f"Found {len(papers)} papers")
            
            for paper in papers:
                create_paper_from_hf(driver, paper)
                total_ingested += 1
            
            time.sleep(2)
    
    logger.info(f"\n✅ HF ingestion complete! Total: {total_ingested} papers\n")
    driver.close()

if __name__ == "__main__":
    # Ingest daily papers from last 7 days
    ingest_hf_papers_bulk(
        use_daily=True,
        days_back=7
    )
    
    # Optional: Also search by keywords
    # ingest_hf_papers_bulk(
    #     use_daily=False,
    #     use_search=True,
    #     search_queries=['transformer', 'LLM', 'multimodal', 'RAG']
    # )
