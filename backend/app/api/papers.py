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
