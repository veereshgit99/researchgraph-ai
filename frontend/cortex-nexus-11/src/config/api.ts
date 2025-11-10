export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    ENDPOINTS: {
        PAPERS: '/api/v1/papers/',
        PAPERS_SEARCH: '/api/v1/papers/search/',
        PAPER_DETAIL: (arxivId: string) => `/api/v1/papers/${arxivId}/`,
        PAPER_GRAPH: (arxivId: string) => `/api/v1/papers/${arxivId}/graph`,
    }
};
