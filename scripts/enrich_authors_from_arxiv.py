import sys
sys.path.append('../backend')

import time
import requests
import xml.etree.ElementTree as ET
from app.core.neo4j_driver import get_neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ARXIV_API_BASE = "http://export.arxiv.org/api/query"

def fetch_arxiv_metadata(arxiv_id: str):
    """Fetch paper metadata from arXiv API"""
    # Remove version suffix if present (e.g., v1, v2)
    base_id = arxiv_id.split('v')[0] if 'v' in arxiv_id else arxiv_id
    
    params = {
        'id_list': base_id,
        'max_results': 1
    }
    
    try:
        response = requests.get(ARXIV_API_BASE, params=params, timeout=10)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entry = root.find('atom:entry', ns)
        if entry is None:
            logger.warning(f"No entry found for {arxiv_id}")
            return None
        
        # Extract authors
        authors = []
        for author in entry.findall('atom:author', ns):
            name = author.find('atom:name', ns)
            if name is not None:
                authors.append(name.text)
        
        # Extract base ID from the response
        id_url = entry.find('atom:id', ns).text
        actual_arxiv_id = id_url.split('/abs/')[-1]
        
        return {
            'arxiv_id': arxiv_id,
            'arxiv_base_id': base_id,
            'actual_arxiv_id': actual_arxiv_id,
            'authors': authors
        }
        
    except Exception as e:
        logger.error(f"Error fetching arXiv metadata for {arxiv_id}: {e}")
        return None

def add_authors_to_paper(driver, paper_data):
    """Add authors and update arxiv_base_id for a paper"""
    query = """
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    SET p.arxiv_base_id = $arxiv_base_id
    
    WITH p
    UNWIND $authors AS author_name
    MERGE (a:Author {name: author_name})
    ON CREATE SET 
        a.id = toLower(replace(author_name, ' ', '-')),
        a.created_at = datetime()
    MERGE (p)-[r:AUTHORED_BY]->(a)
    ON CREATE SET r.created_at = datetime()
    """
    
    try:
        driver.execute_write(query, {
            'arxiv_id': paper_data['arxiv_id'],
            'arxiv_base_id': paper_data['arxiv_base_id'],
            'authors': paper_data['authors']
        })
        return True
    except Exception as e:
        logger.error(f"Error adding authors to {paper_data['arxiv_id']}: {e}")
        return False

def enrich_papers_with_authors(limit: int = 100):
    """
    Enrich papers that don't have authors by fetching from arXiv API
    """
    driver = get_neo4j_driver()
    driver.connect()
    
    # Get papers without authors
    query = """
    MATCH (p:Paper)
    WHERE NOT EXISTS {
        MATCH (p)-[:AUTHORED_BY]->(a:Author)
    }
    AND p.arxiv_id IS NOT NULL
    RETURN p.arxiv_id as arxiv_id, p.title as title
    LIMIT $limit
    """
    
    papers = driver.execute_read(query, {'limit': limit})
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Found {len(papers)} papers without authors")
    logger.info(f"{'='*60}\n")
    
    success_count = 0
    failed_count = 0
    
    for idx, paper in enumerate(papers, 1):
        arxiv_id = paper['arxiv_id']
        title = paper['title']
        
        logger.info(f"[{idx}/{len(papers)}] Processing: {arxiv_id}")
        logger.info(f"  Title: {title[:60]}...")
        
        # Fetch metadata from arXiv
        metadata = fetch_arxiv_metadata(arxiv_id)
        
        if metadata and metadata['authors']:
            # Add authors to paper
            if add_authors_to_paper(driver, metadata):
                logger.info(f"  ✅ Added {len(metadata['authors'])} authors")
                logger.info(f"  📝 Authors: {', '.join(metadata['authors'][:3])}{'...' if len(metadata['authors']) > 3 else ''}")
                success_count += 1
            else:
                logger.error(f"  ❌ Failed to add authors")
                failed_count += 1
        else:
            logger.warning(f"  ⚠️  No authors found on arXiv")
            failed_count += 1
        
        # Rate limiting - arXiv asks for ~1 request per second
        time.sleep(1.5)
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Author enrichment complete!")
    logger.info(f"Successfully enriched: {success_count} papers")
    logger.info(f"Failed: {failed_count} papers")
    logger.info(f"{'='*60}\n")
    
    driver.close()

if __name__ == "__main__":
    # Enrich all papers without authors
    enrich_papers_with_authors(limit=200)
