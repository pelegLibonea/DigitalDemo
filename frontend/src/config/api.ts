/**
 * API Configuration
 * 
 * This module centralizes all API endpoint configuration.
 * The base URL is loaded from environment variables:
 * - Development: VITE_API_BASE_URL from .env.local
 * - Production: VITE_API_BASE_URL from .env.production
 * - Default fallback: http://localhost:8808
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8808";

export const API_CONFIG = {
  baseUrl: API_BASE_URL,

  // Document endpoints
  documents: {
    list: `${API_BASE_URL}/api/documents`,
    detail: (docId: string) => `${API_BASE_URL}/api/documents/${docId}`,
    approve: (docId: string) => `${API_BASE_URL}/api/documents/${docId}/approve`,
    saveResults: (docId: string) => `${API_BASE_URL}/api/documents/${docId}/results`,
    upload: `${API_BASE_URL}/api/upload`,
  },

  // Results endpoints
  results: {
    pdf: (docId: string) => `${API_BASE_URL}/api/results/pdf/${docId}`,
    json: (docId: string) => `${API_BASE_URL}/api/results/json/${docId}`,
  },

  // Server-Sent Events for real-time updates
  events: {
    global: `${API_BASE_URL}/api/events`,
    document: (docId: string) => `${API_BASE_URL}/api/events/${docId}`,
  },

  // Notification endpoints (used by external processors)
  notify: {
    resultReady: `${API_BASE_URL}/api/notify/result-ready`,
    processingStarted: `${API_BASE_URL}/api/notify/processing-started`,
    error: `${API_BASE_URL}/api/notify/error`,
  },

  // Health check
  health: `${API_BASE_URL}/health`,
};

// For debugging in development
if (import.meta.env.DEV) {
  console.log("[API Config] Base URL:", API_BASE_URL);
}
