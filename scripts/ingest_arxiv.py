import sys
sys.path.append('../backend')

import time
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.neo4j_driver import get_neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ARXIV_API_BASE = "http://export.arxiv.org/api/query"

def fetch_arxiv_papers(
    categories: List[str] = None,
    search_query: str = None,
    max_results: int = 100,
    start_date: str = None,
    end_date: str = None
) -> List[Dict]:
    """
    Fetch papers from ArXiv API with flexible filtering.
    
    Args:
        categories: List of ArXiv categories (e.g., ['cs.AI', 'cs.CL'])
        search_query: Custom search query (e.g., 'all:transformer')
        max_results: Maximum number of papers to fetch
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    """
    if categories and search_query:
        raise ValueError("Provide either categories or search_query, not both")
    
    # Build query
    if search_query:
        query = search_query
    elif categories:
        # Combine categories with OR
        cat_queries = [f"cat:{cat}" for cat in categories]
        query = " OR ".join(cat_queries)
    else:
        query = "cat:cs.AI OR cat:cs.CL OR cat:cs.LG"
    
    # Add date range if provided
    if start_date and end_date:
        query = f"({query}) AND submittedDate:[{start_date} TO {end_date}]"
    
    params = {
        'search_query': query,
        'start': 0,
        'max_results': max_results,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }
    
    try:
        logger.info(f"Fetching papers with query: {query}")
        response = requests.get(ARXIV_API_BASE, params=params, timeout=30)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        papers = []
        for entry in root.findall('atom:entry', ns):
            paper = parse_arxiv_entry(entry, ns)
            if paper:
                papers.append(paper)
        
        logger.info(f"Fetched {len(papers)} papers from ArXiv")
        return papers
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching from ArXiv: {e}")
        return []
    except ET.ParseError as e:
        logger.error(f"Error parsing ArXiv XML: {e}")
        return []

def parse_arxiv_entry(entry, ns) -> Optional[Dict]:
    """Parse a single ArXiv entry from XML"""
    try:
        # Extract arxiv_id from id URL
        id_url = entry.find('atom:id', ns).text
        arxiv_id = id_url.split('/abs/')[-1]
        
        # Get other fields
        title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
        summary = entry.find('atom:summary', ns).text.strip().replace('\n', ' ')
        published = entry.find('atom:published', ns).text[:10]  # YYYY-MM-DD
        
        # PDF URL
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}"
        
        # Categories
        categories = [cat.get('term') for cat in entry.findall('atom:category', ns)]
        
        # Authors
        authors = []
        for author in entry.findall('atom:author', ns):
            name = author.find('atom:name', ns)
            if name is not None:
                authors.append(name.text)
        
        return {
            'arxiv_id': arxiv_id,
            'title': title,
            'abstract': summary,
            'published_date': published,
            'pdf_url': pdf_url,
            'categories': categories,
            'authors': authors
        }
    except Exception as e:
        logger.error(f"Error parsing entry: {e}")
        return None

def create_paper_node(driver, paper: Dict):
    """Create Paper node in Neo4j"""
    query = """
    MERGE (p:Paper {arxiv_id: $arxiv_id})
    ON CREATE SET
        p.title = $title,
        p.abstract = $abstract,
        p.published_date = date($published_date),
        p.pdf_url = $pdf_url,
        p.categories = $categories,
        p.created_at = datetime(),
        p.source = 'arxiv',
        p.enriched = false
    ON MATCH SET
        p.updated_at = datetime()
    
    WITH p
    UNWIND $authors AS author_name
    MERGE (a:Author {name: author_name})
    ON CREATE SET a.created_at = datetime()
    MERGE (a)-[r:AUTHORED]->(p)
    ON CREATE SET r.created_at = datetime()
    """
    
    try:
        driver.execute_write(query, {
            'arxiv_id': paper['arxiv_id'],
            'title': paper['title'],
            'abstract': paper['abstract'],
            'published_date': paper['published_date'],
            'pdf_url': paper['pdf_url'],
            'categories': paper['categories'],
            'authors': paper['authors']
        })
    except Exception as e:
        logger.error(f"Error creating paper {paper['arxiv_id']}: {e}")

def ingest_arxiv_bulk(
    categories: List[str] = None,
    max_results: int = 100,
    days_back: int = 30
):
    """
    Bulk ingest papers from ArXiv.
    
    Args:
        categories: List of categories to fetch (default: AI/ML categories)
        max_results: Max papers per category
        days_back: Fetch papers from last N days
    """
    driver = get_neo4j_driver()
    driver.connect()
    
    # Default categories
    if not categories:
        categories = [
            'cs.AI',   # Artificial Intelligence
            'cs.CL',   # Computation and Language
            'cs.LG',   # Machine Learning
            'cs.CV',   # Computer Vision
            'cs.NE',   # Neural and Evolutionary Computing
            'stat.ML'  # Machine Learning (Statistics)
        ]
    
    # Calculate date range
    end_date = datetime.now().strftime('%Y%m%d%H%M%S')
    start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y%m%d%H%M%S')
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Starting ArXiv bulk ingestion")
    logger.info(f"Categories: {', '.join(categories)}")
    logger.info(f"Max results per category: {max_results}")
    logger.info(f"Date range: Last {days_back} days")
    logger.info(f"{'='*60}\n")
    
    total_ingested = 0
    
    for category in categories:
        logger.info(f"\nFetching papers for category: {category}")
        
        papers = fetch_arxiv_papers(
            categories=[category],
            max_results=max_results,
            start_date=start_date,
            end_date=end_date
        )
        
        logger.info(f"Creating nodes for {len(papers)} papers...")
        
        for idx, paper in enumerate(papers, 1):
            create_paper_node(driver, paper)
            
            if idx % 10 == 0:
                logger.info(f"  Progress: {idx}/{len(papers)}")
                time.sleep(1)  # Rate limiting
        
        total_ingested += len(papers)
        logger.info(f"✓ Completed {category}: {len(papers)} papers")
        time.sleep(3)  # Rate limiting between categories
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Bulk ingestion complete!")
    logger.info(f"Total papers ingested: {total_ingested}")
    logger.info(f"{'='*60}\n")
    
    driver.close()

if __name__ == "__main__":
    # Example usage: Fetch 50 papers per category from last 30 days
    ingest_arxiv_bulk(
        categories=['cs.AI', 'cs.CL', 'cs.LG', 'cs.CV'],
        max_results=50,
        days_back=30
    )
