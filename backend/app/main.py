from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.neo4j_driver import get_neo4j_driver
from app.api import papers, assistant

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    driver = get_neo4j_driver()
    driver.connect()
    if driver.verify_connectivity():
        logger.info("✓ Neo4j connected successfully")
    else:
        logger.error("✗ Neo4j connection failed")
    
    yield
    
    # Shutdown
    driver.close()
    logger.info("Application shutdown")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:8080",  # Vite dev server
        "http://127.0.0.1:8080",  # Alternative localhost
        "*" # Allow all origins for simplicity; adjust in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(papers.router, prefix=settings.API_PREFIX)
app.include_router(assistant.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "message": "ResearchGraph AI API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    driver = get_neo4j_driver()
    neo4j_status = driver.verify_connectivity()
    
    return {
        "status": "healthy" if neo4j_status else "unhealthy",
        "neo4j": "connected" if neo4j_status else "disconnected"
    }
