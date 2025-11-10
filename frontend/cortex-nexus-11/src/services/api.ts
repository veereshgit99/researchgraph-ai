import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
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

export default api;
