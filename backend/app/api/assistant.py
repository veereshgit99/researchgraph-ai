from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.assistant_schema import ChatRequest, ChatResponse
from app.services.assistant_service import AssistantService
from typing import Dict, Any
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])
assistant_service = AssistantService()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to the AI assistant and get a response.
    The assistant will use the knowledge graph for context.
    """
    try:
        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
        
        result = await assistant_service.chat(
            message=request.message,
            conversation_history=history
        )
        
        return ChatResponse(**result)
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat responses for real-time display.
    Returns a stream of Server-Sent Events (SSE).
    """
    try:
        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
        
        return StreamingResponse(
            assistant_service.stream_chat(
                message=request.message,
                conversation_history=history
            ),
            media_type="text/event-stream"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Check if the assistant service is running."""
    return {"status": "ok", "service": "AI Assistant"}
