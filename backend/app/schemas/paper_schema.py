from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class PaperBase(BaseModel):
    arxiv_id: str = Field(..., description="ArXiv paper ID")
    title: str
    abstract: Optional[str] = None
    published_date: date
    categories: List[str] = []
    pdf_url: Optional[str] = None
    citation_count: Optional[int] = 0

class PaperCreate(PaperBase):
    pass

class PaperResponse(PaperBase):
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PaperSearchResult(BaseModel):
    paper: PaperResponse
    score: float

class PaperList(BaseModel):
    papers: List[PaperResponse]
    total: int
    page: int
    page_size: int
