import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 60000, // Increased to 60 seconds for AI responses
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const paperAPI = {
    // Get all papers with pagination
    getAll: async (page = 1, pageSize = 20) => {
        const response = await api.get(API_CONFIG.ENDPOINTS.PAPERS, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    // Search papers
    search: async (query: string, limit = 20) => {
        const response = await api.get(API_CONFIG.ENDPOINTS.PAPERS_SEARCH, {
            params: { q: query, limit },
        });
        return response.data;
    },

    // Get paper by arXiv ID
    getById: async (arxivId: string) => {
        const response = await api.get(API_CONFIG.ENDPOINTS.PAPER_DETAIL(arxivId));
        return response.data;
    },

    // Get paper graph data
    getGraph: async (arxivId: string) => {
        const response = await api.get(API_CONFIG.ENDPOINTS.PAPER_GRAPH(arxivId));
        return response.data;
    },
};

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    message: string;
    conversation_history?: Message[];
}

export interface ChatResponse {
    response: string;
    context: {
        papers: any[];
        concepts: any[];
        methods: any[];
    };
    sources: {
        papers: string[];
        concepts: string[];
        methods: string[];
    };
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export const assistantAPI = {
    // Send a chat message
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
        const response = await api.post(API_CONFIG.ENDPOINTS.ASSISTANT_CHAT, request);
        return response.data;
    },

    // Stream chat (returns EventSource for SSE)
    streamChat: (request: ChatRequest) => {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSISTANT_CHAT_STREAM}`;
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
    },

    // Health check
    healthCheck: async () => {
        const response = await api.get(API_CONFIG.ENDPOINTS.ASSISTANT_HEALTH);
        return response.data;
    },
};

export default api;
