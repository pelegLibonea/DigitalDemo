/**
 * API Client Service
 * 
 * Centralized API client for all backend communication.
 * Provides type-safe methods for all API operations.
 * Handles error responses consistently.
 */

import { API_CONFIG } from "../config/api";

export interface DocumentListItem {
  id: string;
  original_name: string;
  type?: string;
  status: string;
  upload_time: string;
  has_pdf: boolean;
  has_json: boolean;
}

export interface DocumentDetail extends DocumentListItem {
  result_pdf_url?: string | null;
  result_json_url?: string | null;
}

export interface ExtractedField {
  field_name: string;
  field_value: string;
  field_ocr_value?: string;
  typist_content?: string;
  visible: boolean;
  description: string;
  readonly: boolean;
  array_index?: number;
  field_order?: number;
  confidence?: number;
  region?: number[];
  field_type?: string;
  html_id?: string;
  dictionary?: string;
}

export interface ProcessedPage {
  fields: ExtractedField[];
}

export interface ProcessedDocument {
  pages: ProcessedPage[];
}

class APIClient {
  /**
   * List all documents
   */
  async listDocuments(): Promise<DocumentListItem[]> {
    const response = await fetch(API_CONFIG.documents.list);
    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get document details
   */
  async getDocument(docId: string): Promise<DocumentDetail> {
    const response = await fetch(API_CONFIG.documents.detail(docId));
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found");
      }
      throw new Error(`Failed to get document: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    file: File,
    docType: string
  ): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);

    const response = await fetch(API_CONFIG.documents.upload, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Upload failed: ${response.status} - ${error || "Unknown error"}`
      );
    }

    return response.json();
  }

  /**
   * Get processed document (JSON result)
   */
  async getProcessedDocument(docId: string): Promise<ProcessedDocument> {
    const response = await fetch(API_CONFIG.results.json(docId));
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Processed document not found");
      }
      throw new Error(`Failed to get processed document: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get PDF result URL
   */
  getPDFUrl(docId: string): string {
    return API_CONFIG.results.pdf(docId);
  }

  /**
   * Approve a document (sets status = 'approved')
   */
  async approveDocument(docId: string): Promise<void> {
    const response = await fetch(API_CONFIG.documents.approve(docId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to approve document: ${response.status}`);
    }
  }

  /**
   * Save updated processed document JSON to original results file
   */
  async saveProcessedDocument(docId: string, payload: ProcessedDocument): Promise<void> {
    const response = await fetch(API_CONFIG.documents.saveResults(docId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to save JSON: ${response.status} - ${text}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(API_CONFIG.health);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
