import sys
sys.path.append('../backend')

import os
import json
import time
from typing import Dict, List
import google.generativeai as genai
from app.core.neo4j_driver import get_neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

# Initialize Gemini client
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

EXTRACTION_PROMPT = """You are an AI research expert. Analyze this academic paper and extract structured information.

Paper Title: {title}
Abstract: {abstract}

Extract the following entities from the paper:

1. **Concepts**: High-level AI/ML concepts introduced or heavily featured (e.g., "Transformer", "Self-Attention", "Reinforcement Learning", ....)
2. **Methods**: Specific techniques, algorithms, or approaches (e.g., "Multi-Head Attention", "Adam Optimizer", "Dropout", ....)
3. **Datasets**: Datasets mentioned for training or evaluation (e.g., "ImageNet", "GLUE", "CIFAR-10", ....)
4. **Metrics**: Evaluation metrics used (e.g., "BLEU", "Accuracy", "F1 Score", "Perplexity", ....)

Return ONLY a valid JSON object with this exact structure:
{{
  "concepts": [
    {{"name": "concept name", "category": "Architecture|Training|Evaluation|Other", "confidence": 0.0-1.0}}
  ],
  "methods": [
    {{"name": "method name", "algorithm_type": "optimization|regularization|attention|other"}}
  ],
  "datasets": [
    {{"name": "dataset name", "domain": "Computer Vision|NLP|Audio|Other"}}
  ],
  "metrics": [
    {{"name": "metric name", "higher_is_better": true|false}}
  ]
}}

Rules:
- Only extract entities explicitly mentioned in the text
- Use standard naming (e.g., "BERT" not "bert" or "Bert")
- Confidence: 1.0 for explicit mentions, 0.7-0.9 for implied
- Return empty arrays if no entities found
- Do not include explanations, only the JSON
"""

def extract_entities(title, abstract, max_retries=3):
    for attempt in range(max_retries):
        try:
            prompt = EXTRACTION_PROMPT.format(title=title, abstract=abstract[:1500])
            response = model.generate_content(
                prompt, 
                generation_config={
                    "temperature": 0, 
                    "max_output_tokens": 2000,
                    "response_mime_type": "application/json"  # Force JSON response
                },
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
            )
            
            # Check if response was blocked
            if not response.candidates:
                logger.warning(f"Response blocked by safety filters (attempt {attempt+1})")
                if attempt == max_retries - 1:
                    logger.error(f"All attempts blocked - returning empty entities")
                    return {"concepts": [], "methods": [], "datasets": [], "metrics": []}
                time.sleep(1)
                continue
            
            # Get response text
            response_text = response.text.strip() if hasattr(response, 'text') else ""
            
            if not response_text:
                logger.error(f"No usable Gemini response text (attempt {attempt+1})")
                time.sleep(1)
                continue
            
            # Try to parse JSON
            try:
                entities = json.loads(response_text)
                return entities
            except json.JSONDecodeError as json_err:
                logger.warning(f"JSON parse error (attempt {attempt+1}): {json_err}. Attempting self-correction...")
                
                # Ask Gemini to fix the broken JSON
                fix_prompt = (
                    "The following text is not valid JSON due to a formatting error. "
                    "Please analyze and return ONLY the corrected JSON object with no explanations:\n\n"
                    f"{response_text}"
                )
                
                correction_response = model.generate_content(
                    fix_prompt,
                    generation_config={
                        "temperature": 0,
                        "response_mime_type": "application/json"
                    },
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                    ]
                )
                
                corrected_text = correction_response.text.strip()
                entities = json.loads(corrected_text)
                logger.info(f"✅ JSON self-correction successful!")
                return entities
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error (attempt {attempt+1}): {e}")
        except Exception as e:
            logger.error(f"Extraction error (attempt {attempt+1}): {e}")
        
        time.sleep(1)
    
    # Safe fallback
    return {"concepts": [], "methods": [], "datasets": [], "metrics": []}



def create_concept(driver, concept_data: Dict, paper_arxiv_id: str):
    """Create concept node and link to paper"""
    query = """
    MERGE (c:Concept {name: $name})
    ON CREATE SET
        c.description = $description,
        c.category = $category,
        c.created_at = datetime()
    
    WITH c
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (p)-[r:INTRODUCES]->(c)
    ON CREATE SET r.confidence = $confidence
    """
    
    driver.execute_write(query, {
        'name': concept_data['name'],
        'description': '',
        'category': concept_data.get('category', 'Other'),
        'arxiv_id': paper_arxiv_id,
        'confidence': concept_data.get('confidence', 0.9)
    })

def create_method(driver, method_data: Dict, paper_arxiv_id: str):
    """Create method node and link to paper"""
    query = """
    MERGE (m:Method {name: $name})
    ON CREATE SET
        m.description = '',
        m.algorithm_type = $algorithm_type,
        m.created_at = datetime()
    
    WITH m
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (p)-[r:PROPOSES]->(m)
    ON CREATE SET r.is_primary = true
    """
    
    driver.execute_write(query, {
        'name': method_data['name'],
        'algorithm_type': method_data.get('algorithm_type', 'other'),
        'arxiv_id': paper_arxiv_id
    })

def create_dataset(driver, dataset_data: Dict, paper_arxiv_id: str):
    """Create dataset node and link to paper"""
    query = """
    MERGE (d:Dataset {name: $name})
    ON CREATE SET
        d.description = '',
        d.domain = $domain,
        d.created_at = datetime()
    
    WITH d
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (p)-[r:EVALUATES_ON]->(d)
    """
    
    driver.execute_write(query, {
        'name': dataset_data['name'],
        'domain': dataset_data.get('domain', 'Other'),
        'arxiv_id': paper_arxiv_id
    })

def create_metric(driver, metric_data: Dict, paper_arxiv_id: str):
    """Create metric node and link to paper"""
    query = """
    MERGE (m:Metric {name: $name})
    ON CREATE SET
        m.description = '',
        m.higher_is_better = $higher_is_better,
        m.created_at = datetime()
    
    WITH m
    MATCH (p:Paper {arxiv_id: $arxiv_id})
    MERGE (p)-[r:USES_METRIC]->(m)
    """
    
    driver.execute_write(query, {
        'name': metric_data['name'],
        'higher_is_better': metric_data.get('higher_is_better', True),
        'arxiv_id': paper_arxiv_id
    })

def enrich_papers(limit: int = 10, skip_enriched: bool = True):
    """
    Main enrichment loop: extract entities and update graph.
    """
    driver = get_neo4j_driver()
    driver.connect()
    
    # Get papers to enrich
    query = """
    MATCH (p:Paper)
    WHERE p.enriched IS NULL OR p.enriched = false
    RETURN p.arxiv_id as arxiv_id, p.title as title, p.abstract as abstract
    LIMIT $limit
    """
    
    papers = driver.execute_read(query, {'limit': limit})
    
    logger.info(f"Found {len(papers)} papers to enrich")
    
    for idx, paper in enumerate(papers, 1):
        arxiv_id = paper['arxiv_id']
        title = paper['title']
        abstract = paper['abstract'] or ''
        
        logger.info(f"\n[{idx}/{len(papers)}] Processing: {title[:60]}...")
        
        # Extract entities
        entities = extract_entities(title, abstract)
        
        # Log extracted entities
        logger.info(f"  Concepts: {len(entities.get('concepts', []))}")
        logger.info(f"  Methods: {len(entities.get('methods', []))}")
        logger.info(f"  Datasets: {len(entities.get('datasets', []))}")
        logger.info(f"  Metrics: {len(entities.get('metrics', []))}")
        
        # Create nodes and relationships
        try:
            for concept in entities.get('concepts', []):
                create_concept(driver, concept, arxiv_id)
            
            for method in entities.get('methods', []):
                create_method(driver, method, arxiv_id)
            
            for dataset in entities.get('datasets', []):
                create_dataset(driver, dataset, arxiv_id)
            
            for metric in entities.get('metrics', []):
                create_metric(driver, metric, arxiv_id)
            
            # Mark paper as enriched
            driver.execute_write("""
                MATCH (p:Paper {arxiv_id: $arxiv_id})
                SET p.enriched = true, p.enriched_at = datetime()
            """, {'arxiv_id': arxiv_id})
            
            logger.info(f"  ✅ Enriched successfully")
            
        except Exception as e:
            logger.error(f"  ❌ Error enriching paper: {e}")
        
        # Rate limiting (Gemini: ~1 request/sec recommended)
        time.sleep(1)
    
    logger.info(f"\n✅ Enrichment complete! Processed {len(papers)} papers")
    driver.close()

if __name__ == "__main__":
    # Get API key from environment
    if not os.getenv("GEMINI_API_KEY"):
        logger.error("❌ GEMINI_API_KEY not set in environment")
        exit(1)
    
    # Enrich all unenriched papers (180 new papers)
    enrich_papers(limit=200)  # Process up to 200 papers
