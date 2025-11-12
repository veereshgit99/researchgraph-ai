from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Message]] = None


class ChatResponse(BaseModel):
    response: str
    context: Dict[str, Any]
    sources: Dict[str, List[str]]
    usage: Optional[Dict[str, int]] = None
