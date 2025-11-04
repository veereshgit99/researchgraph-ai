from neo4j import GraphDatabase, ManagedTransaction
from typing import Dict, List, Optional, Any
import logging
from .config import settings

logger = logging.getLogger(__name__)

class Neo4jDriver:
    """Production-grade Neo4j driver with connection pooling."""
    
    def __init__(self):
        self.driver = None
        
    def connect(self):
        """Initialize driver connection"""
        if not self.driver:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=60,
            )
            logger.info(f"Connected to Neo4j at {settings.NEO4J_URI}")
    
    def close(self):
        """Close driver connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def verify_connectivity(self) -> bool:
        """Test connection"""
        try:
            with self.driver.session() as session:
                result = session.run("RETURN 1 as test")
                return result.single()["test"] == 1
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    def execute_read(self, query: str, parameters: Dict = None) -> List[Dict]:
        """Execute read query"""
        with self.driver.session() as session:
            result = session.execute_read(
                self._run_query, query, parameters or {}
            )
            return result
    
    def execute_write(self, query: str, parameters: Dict = None) -> List[Dict]:
        """Execute write query"""
        with self.driver.session() as session:
            result = session.execute_write(
                self._run_query, query, parameters or {}
            )
            return result
    
    @staticmethod
    def _run_query(tx: ManagedTransaction, query: str, parameters: Dict) -> List[Dict]:
        """Run query in transaction and convert Neo4j types to Python types"""
        result = tx.run(query, parameters)
        
        def convert_value(value):
            """Recursively convert Neo4j types to Python types"""
            from neo4j.graph import Node, Relationship
            from neo4j.time import DateTime, Date, Time, Duration
            from datetime import datetime, date, time, timedelta
            
            if isinstance(value, Node):
                # Convert Node properties recursively
                return {k: convert_value(v) for k, v in dict(value).items()}
            elif isinstance(value, Relationship):
                # Convert Relationship properties recursively
                return {k: convert_value(v) for k, v in dict(value).items()}
            elif isinstance(value, DateTime):
                # Convert Neo4j DateTime to Python datetime
                return datetime(
                    value.year, value.month, value.day,
                    value.hour, value.minute, value.second,
                    value.nanosecond // 1000
                ).isoformat()
            elif isinstance(value, Date):
                # Convert Neo4j Date to Python date
                return date(value.year, value.month, value.day).isoformat()
            elif isinstance(value, Time):
                # Convert Neo4j Time to Python time
                return time(value.hour, value.minute, value.second, value.nanosecond // 1000).isoformat()
            elif isinstance(value, Duration):
                # Convert Neo4j Duration to total seconds
                return value.seconds
            elif isinstance(value, list):
                return [convert_value(item) for item in value]
            elif isinstance(value, dict):
                return {k: convert_value(v) for k, v in value.items()}
            else:
                return value
        
        return [
            {key: convert_value(value) for key, value in record.items()}
            for record in result
        ]

    
    # Paper operations
    def create_paper(self, paper_data: Dict) -> str:
        """Create or update paper"""
        query = """
        MERGE (p:Paper {arxiv_id: $arxiv_id})
        ON CREATE SET
            p.title = $title,
            p.abstract = $abstract,
            p.published_date = date($published_date),
            p.categories = $categories,
            p.pdf_url = $pdf_url,
            p.citation_count = COALESCE($citation_count, 0),
            p.created_at = datetime(),
            p.updated_at = datetime()
        ON MATCH SET
            p.updated_at = datetime(),
            p.citation_count = COALESCE($citation_count, p.citation_count)
        RETURN p.arxiv_id as arxiv_id
        """
        result = self.execute_write(query, paper_data)
        return result[0]['arxiv_id'] if result else None
    
    def get_paper(self, arxiv_id: str) -> Optional[Dict]:
        """Get paper by arXiv ID"""
        query = """
        MATCH (p:Paper {arxiv_id: $arxiv_id})
        RETURN p
        """
        result = self.execute_read(query, {'arxiv_id': arxiv_id})
        return result[0]['p'] if result else None
    
    def list_papers(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List papers with pagination"""
        query = """
        MATCH (p:Paper)
        RETURN p
        ORDER BY p.published_date DESC
        SKIP $offset
        LIMIT $limit
        """
        result = self.execute_read(query, {'limit': limit, 'offset': offset})
        return [r['p'] for r in result]
    
    def search_papers(self, search_term: str, limit: int = 20) -> List[Dict]:
        """Full-text search papers"""
        query = """
        CALL db.index.fulltext.queryNodes(
            'paper_fulltext', 
            $search_term
        ) YIELD node, score
        RETURN node as p, score
        ORDER BY score DESC
        LIMIT $limit
        """
        result = self.execute_read(query, {
            'search_term': search_term,
            'limit': limit
        })
        return [{'paper': r['p'], 'score': r['score']} for r in result]

# Singleton instance
neo4j_driver = Neo4jDriver()

def get_neo4j_driver() -> Neo4jDriver:
    """Get driver instance"""
    return neo4j_driver
