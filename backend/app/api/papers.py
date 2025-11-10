from fastapi import APIRouter, HTTPException, Query
from app.schemas.paper_schema import (
    PaperCreate, PaperResponse, PaperList, PaperSearchResult
)
from app.services.papers_service import papers_service
from typing import List

router = APIRouter(prefix="/papers", tags=["papers"])

@router.post("/", response_model=dict, status_code=201)
async def create_paper(paper: PaperCreate):
    """Create a new paper"""
    try:
        arxiv_id = papers_service.create_paper(paper)
        return {"arxiv_id": arxiv_id, "message": "Paper created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{arxiv_id}", response_model=dict)
async def get_paper(arxiv_id: str):
    """Get paper by arXiv ID"""
    paper = papers_service.get_paper(arxiv_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper

@router.get("/{arxiv_id}/debug", response_model=dict)
async def debug_paper(arxiv_id: str):
    """Debug paper and relationships"""
    from app.core.neo4j_driver import get_neo4j_driver
    driver = get_neo4j_driver()
    
    # Check paper exists
    query = """
    MATCH (p:Paper)
    WHERE p.arxiv_id = $arxiv_id 
       OR (p.arxiv_base_id IS NOT NULL AND p.arxiv_base_id = $arxiv_id)
    OPTIONAL MATCH (p)-[r:AUTHORED_BY]->(a:Author)
    WITH p, collect(DISTINCT a.name) as authors
    RETURN p.arxiv_id as arxiv_id, 
           p.arxiv_base_id as arxiv_base_id,
           p.title as title,
           authors,
           size(authors) as author_count
    """
    result = driver.execute_read(query, {'arxiv_id': arxiv_id})
    if not result:
        raise HTTPException(status_code=404, detail="Paper not found")
    return result[0]

@router.get("/{arxiv_id}/graph", response_model=dict)
async def get_paper_graph(arxiv_id: str):
    """Get graph data for a paper - nodes and relationships for visualization"""
    from app.core.neo4j_driver import get_neo4j_driver
    driver = get_neo4j_driver()
    
    # Get paper with all its relationships
    query = """
    MATCH (p:Paper)
    WHERE p.arxiv_id = $arxiv_id 
       OR (p.arxiv_base_id IS NOT NULL AND p.arxiv_base_id = $arxiv_id)
    
    // Get all connected nodes and relationships
    OPTIONAL MATCH (p)-[r]-(n)
    WHERE n:Author OR n:Concept OR n:Method OR n:Dataset OR n:Metric
    
    WITH p, collect(DISTINCT {
        node: n,
        relationship: r,
        rel_type: type(r),
        node_labels: labels(n)
    }) as connections
    
    // Build nodes array
    WITH p, connections,
         [{
            id: p.arxiv_id,
            label: p.title,
            type: 'Paper',
            properties: {
                title: p.title,
                arxiv_id: p.arxiv_id,
                published_date: toString(p.published_date),
                categories: p.categories
            }
         }] + 
         [conn in connections | {
            id: CASE 
                WHEN conn.node.name IS NOT NULL THEN conn.node.name
                WHEN conn.node.id IS NOT NULL THEN conn.node.id
                ELSE toString(id(conn.node))
            END,
            label: CASE 
                WHEN conn.node.name IS NOT NULL THEN conn.node.name
                WHEN conn.node.id IS NOT NULL THEN conn.node.id
                ELSE 'Unknown'
            END,
            type: conn.node_labels[0],
            properties: properties(conn.node)
         }] as nodes,
         
         // Build edges array
         [conn in connections WHERE conn.relationship IS NOT NULL | {
            source: p.arxiv_id,
            target: CASE 
                WHEN conn.node.name IS NOT NULL THEN conn.node.name
                WHEN conn.node.id IS NOT NULL THEN conn.node.id
                ELSE toString(id(conn.node))
            END,
            type: conn.rel_type,
            label: conn.rel_type
         }] as edges
    
    RETURN {
        nodes: nodes,
        edges: edges,
        center_node: p.arxiv_id
    } as graph
    """
    
    result = driver.execute_read(query, {'arxiv_id': arxiv_id})
    if not result or not result[0].get('graph'):
        raise HTTPException(status_code=404, detail="Paper not found")
    
    return result[0]['graph']

@router.get("/", response_model=dict)
async def list_papers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List papers with pagination"""
    return papers_service.list_papers(page=page, page_size=page_size)

@router.get("/search/", response_model=List[dict])
async def search_papers(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Full-text search papers"""
    return papers_service.search_papers(query=q, limit=limit)
