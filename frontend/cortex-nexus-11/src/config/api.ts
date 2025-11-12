export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    ENDPOINTS: {
        PAPERS: '/api/v1/papers/',
        PAPERS_SEARCH: '/api/v1/papers/search/',
        PAPER_DETAIL: (arxivId: string) => `/api/v1/papers/${arxivId}/`,
        PAPER_GRAPH: (arxivId: string) => `/api/v1/papers/${arxivId}/graph`,
        ASSISTANT_CHAT: '/api/v1/assistant/chat',
        ASSISTANT_CHAT_STREAM: '/api/v1/assistant/chat/stream',
        ASSISTANT_HEALTH: '/api/v1/assistant/health',
    }
};
