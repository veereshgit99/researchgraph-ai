import sys
sys.path.append('../backend')

import time
import requests
from typing import Dict, List, Optional
from app.core.neo4j_driver import get_neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_API_BASE = "https://huggingface.co/api"

def get_hf_paper_metadata(arxiv_id: str) -> Optional[Dict]:
    """
    Fetch paper metadata from Hugging Face Papers API.
    Endpoint: GET /api/papers/{arxiv_id}
    """
    clean_id = arxiv_id.split('v')[0]
    
    try:
        url = f"{HF_API_BASE}/papers/{clean_id}"
        logger.info(f"  🔍 Fetching metadata: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            logger.info(f"  ℹ️  Paper not found on Hugging Face")
            return None
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ Error fetching HF paper metadata: {e}")
        return None

def get_hf_paper_repos(arxiv_id: str) -> Optional[Dict]:
    """
    Fetch all models, datasets, and Spaces referencing this paper.
    Endpoint: GET /api/arxiv/{arxiv_id}/repos
    """
    clean_id = arxiv_id.split('v')[0]
    
    try:
        url = f"{HF_API_BASE}/arxiv/{clean_id}/repos"
        logger.info(f"  🔍 Fetching repos: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            logger.info(f"  ℹ️  No repos found")
            return {'models': [], 'datasets': [], 'spaces': []}
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ Error fetching HF repos: {e}")
        return {'models': [], 'datasets': [], 'spaces': []}

def update_paper_metadata(driver, arxiv_id: str, metadata: Dict):
    """Update paper node with Hugging Face metadata"""
    query = """
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    SET 
        p.hf_upvotes = $upvotes,
        p.hf_discussion_id = $discussion_id,
        p.hf_ai_summary = $ai_summary,
        p.hf_keywords = $keywords,
        p.hf_url = $hf_url,
        p.hf_published_at = $published_at,
        p.hf_enriched = true,
        p.hf_enriched_at = datetime(),
        p.on_huggingface = true
    """
    
    try:
        driver.execute_write(query, {
            'arxiv_id': arxiv_id,
            'upvotes': metadata.get('upvotes', 0),
            'discussion_id': metadata.get('discussionId', ''),
            'ai_summary': metadata.get('ai_summary', ''),
            'keywords': metadata.get('ai_keywords', []),
            'hf_url': f"https://huggingface.co/papers/{arxiv_id.split('v')[0]}",
            'published_at': metadata.get('publishedAt', '')
        })
    except Exception as e:
        logger.error(f"  ❌ Error updating paper metadata: {e}")

def create_repository_from_metadata(driver, metadata: Dict, arxiv_id: str):
    """
    Create Repository node from paper metadata (githubRepo field).
    This is the PRIMARY source of GitHub repos for papers.
    """
    github_repo = metadata.get('githubRepo')
    github_stars = metadata.get('githubStars', 0)
    
    if not github_repo:
        return
    
    query = """
    MERGE (r:Repository {url: $url})
    ON CREATE SET
        r.name = $name,
        r.stars = $stars,
        r.source = 'huggingface',
        r.created_at = datetime()
    ON MATCH SET
        r.stars = $stars,
        r.updated_at = datetime()
    
    WITH r
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (r)-[rel:IMPLEMENTS]->(p)
    ON CREATE SET rel.source = 'huggingface'
    """
    
    try:
        repo_name = github_repo.replace('https://github.com/', '').strip('/')
        driver.execute_write(query, {
            'url': github_repo,
            'name': repo_name,
            'stars': github_stars,
            'arxiv_id': arxiv_id
        })
        logger.info(f"  ✅ Repository: {repo_name} ({github_stars} ⭐)")
    except Exception as e:
        logger.error(f"  ❌ Error creating repository: {e}")

def create_or_update_model(driver, model_data: Dict, arxiv_id: str):
    """Create Model node and link to paper"""
    query = """
    MERGE (m:Model {id: $model_id})
    ON CREATE SET
        m.name = $name,
        m.likes = $likes,
        m.downloads = $downloads,
        m.url = $url,
        m.author = $author,
        m.created_at = datetime()
    ON MATCH SET
        m.likes = $likes,
        m.downloads = $downloads,
        m.updated_at = datetime()
    
    WITH m
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (m)-[r:CITES]->(p)
    ON CREATE SET r.source = 'huggingface'
    """
    
    try:
        driver.execute_write(query, {
            'model_id': model_data.get('id', ''),
            'name': model_data.get('id', ''),
            'likes': model_data.get('likes', 0),
            'downloads': model_data.get('downloads', 0),
            'url': f"https://huggingface.co/{model_data.get('id', '')}",
            'author': model_data.get('author', ''),
            'arxiv_id': arxiv_id
        })
    except Exception as e:
        logger.error(f"  ❌ Error creating model: {e}")

def create_or_update_dataset(driver, dataset_data: Dict, arxiv_id: str):
    """Create Dataset node and link to paper"""
    query = """
    MERGE (d:Dataset {id: $dataset_id})
    ON CREATE SET
        d.name = $name,
        d.likes = $likes,
        d.downloads = $downloads,
        d.url = $url,
        d.author = $author,
        d.created_at = datetime()
    ON MATCH SET
        d.likes = $likes,
        d.downloads = $downloads,
        d.updated_at = datetime()
    
    WITH d
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (d)-[r:REFERENCES]->(p)
    ON CREATE SET r.source = 'huggingface'
    """
    
    try:
        driver.execute_write(query, {
            'dataset_id': dataset_data.get('id', ''),
            'name': dataset_data.get('id', ''),
            'likes': dataset_data.get('likes', 0),
            'downloads': dataset_data.get('downloads', 0),
            'url': f"https://huggingface.co/datasets/{dataset_data.get('id', '')}",
            'author': dataset_data.get('author', ''),
            'arxiv_id': arxiv_id
        })
    except Exception as e:
        logger.error(f"  ❌ Error creating dataset: {e}")

def create_or_update_space(driver, space_data: Dict, arxiv_id: str):
    """Create Space node and link to paper"""
    query = """
    MERGE (s:Space {id: $space_id})
    ON CREATE SET
        s.name = $name,
        s.likes = $likes,
        s.url = $url,
        s.author = $author,
        s.sdk = $sdk,
        s.created_at = datetime()
    ON MATCH SET
        s.likes = $likes,
        s.updated_at = datetime()
    
    WITH s
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (s)-[r:DEMONSTRATES]->(p)
    ON CREATE SET r.source = 'huggingface'
    """
    
    try:
        driver.execute_write(query, {
            'space_id': space_data.get('id', ''),
            'name': space_data.get('id', ''),
            'likes': space_data.get('likes', 0),
            'url': f"https://huggingface.co/spaces/{space_data.get('id', '')}",
            'author': space_data.get('author', ''),
            'sdk': space_data.get('sdk', ''),
            'arxiv_id': arxiv_id
        })
    except Exception as e:
        logger.error(f"  ❌ Error creating space: {e}")

def enrich_huggingface(limit: int = 10):
    """
    Main Hugging Face enrichment loop.
    Fetches paper metadata + all related models, datasets, spaces, and repos.
    """
    driver = get_neo4j_driver()
    driver.connect()
    
    # Get papers without HF enrichment
    query = """
    MATCH (p:Paper)
    WHERE p.enriched = true 
    AND (p.hf_enriched IS NULL OR p.hf_enriched = false)
    RETURN p.arxiv_id as arxiv_id, p.title as title
    LIMIT $limit
    """
    
    papers = driver.execute_read(query, {'limit': limit})
    logger.info(f"Found {len(papers)} papers to enrich from Hugging Face\n")
    
    enriched_count = 0
    total_models = 0
    total_datasets = 0
    total_spaces = 0
    total_repos = 0
    
    for idx, paper in enumerate(papers, 1):
        arxiv_id = paper['arxiv_id']
        title = paper['title']
        
        logger.info(f"[{idx}/{len(papers)}] Processing: {title[:60]}...")
        
        # 1. Fetch paper metadata
        metadata = get_hf_paper_metadata(arxiv_id)
        
        if not metadata:
            # Mark as attempted even if not found
            driver.execute_write("""
                MATCH (p:Paper {arxiv_id: $arxiv_id})
                SET p.hf_enriched = true, 
                    p.hf_enriched_at = datetime(),
                    p.on_huggingface = false
            """, {'arxiv_id': arxiv_id})
            logger.info("")
            continue
        
        # Update paper with metadata
        update_paper_metadata(driver, arxiv_id, metadata)
        logger.info(f"  ✅ Metadata: {metadata.get('upvotes', 0)} upvotes")
        
        # Extract GitHub repo from metadata (PRIMARY SOURCE)
        create_repository_from_metadata(driver, metadata, arxiv_id)
        if metadata.get('githubRepo'):
            total_repos += 1
        
        # 2. Fetch related repos (models, datasets, spaces)
        repos_data = get_hf_paper_repos(arxiv_id)
        
        models = repos_data.get('models', [])
        datasets = repos_data.get('datasets', [])
        spaces = repos_data.get('spaces', [])
        
        logger.info(f"  ✅ Repos: {len(models)} models, {len(datasets)} datasets, {len(spaces)} spaces")
        
        # Create Model nodes
        for model in models[:10]:  # Limit to 10 models
            create_or_update_model(driver, model, arxiv_id)
            total_models += 1
        
        # Create Dataset nodes
        for dataset in datasets[:10]:  # Limit to 10 datasets
            create_or_update_dataset(driver, dataset, arxiv_id)
            total_datasets += 1
        
        # Create Space nodes
        for space in spaces[:10]:  # Limit to 10 spaces
            create_or_update_space(driver, space, arxiv_id)
            total_spaces += 1
        
        enriched_count += 1
        logger.info("")
        
        # Rate limiting (be respectful)
        time.sleep(2)
    
    logger.info(f"✅ HF enrichment complete!")
    logger.info(f"   Papers enriched: {enriched_count}")
    logger.info(f"   GitHub repos linked: {total_repos}")
    logger.info(f"   Models linked: {total_models}")
    logger.info(f"   Datasets linked: {total_datasets}")
    logger.info(f"   Spaces linked: {total_spaces}")
    
    driver.close()

if __name__ == "__main__":
    # Process all papers that have been enriched but not HF-enriched
    enrich_huggingface(limit=200)  # Process up to 200 papers
