from typing import List, Optional
from app.core.neo4j_driver import get_neo4j_driver
from app.schemas.paper_schema import PaperCreate, PaperResponse
import logging

logger = logging.getLogger(__name__)

class PapersService:
    def __init__(self):
        self.driver = get_neo4j_driver()
    
    def create_paper(self, paper: PaperCreate) -> str:
        """Create a new paper"""
        paper_data = paper.model_dump()
        paper_data['published_date'] = paper_data['published_date'].isoformat()
        return self.driver.create_paper(paper_data)
    
    def get_paper(self, arxiv_id: str) -> Optional[dict]:
        """Get paper by ID"""
        return self.driver.get_paper(arxiv_id)
    
    def list_papers(self, page: int = 1, page_size: int = 20) -> dict:
        """List papers with pagination"""
        offset = (page - 1) * page_size
        papers = self.driver.list_papers(limit=page_size, offset=offset)
        
        return {
            'papers': papers,
            'page': page,
            'page_size': page_size,
            'total': len(papers)  # TODO: Add count query
        }
    
    def search_papers(self, query: str, limit: int = 20) -> List[dict]:
        """Search papers by text"""
        return self.driver.search_papers(query, limit)

papers_service = PapersService()
