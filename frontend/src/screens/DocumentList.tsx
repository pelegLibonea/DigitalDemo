import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { apiClient } from "../services/apiClient";
import { API_CONFIG } from "../config/api";
import type { DocumentListItem, ProcessedDocument } from "../services/apiClient";

// Format date as DD-MM-YY HH:MM
function formatDateTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
        return isoString;
    }
}

// Helper to extract doc type from ProcessedDocument
function extractDocType(data: ProcessedDocument): string | null {
    // First check top-level properties
    if (data.document_type) return data.document_type;
    if (data.doc_type) return data.doc_type;
    if (data.type) return data.type;
    
    // Then look in the fields of the first page for a DocType field
    if (data.pages && data.pages.length > 0 && data.pages[0].fields) {
        const fields = data.pages[0].fields;
        // Look for common DocType field names (case-insensitive)
        const docTypeField = fields.find(f => 
            f.field_name.toLowerCase() === 'doctype' ||
            f.field_name.toLowerCase() === 'doc_type' ||
            f.field_name.toLowerCase() === 'document_type' ||
            f.field_name.toLowerCase() === 'documenttype'
        );
        if (docTypeField) {
            return docTypeField.typist_content || docTypeField.field_value || null;
        }
    }
    
    return null;
}

export default function DocumentList() {
    const [docs, setDocs] = useState<DocumentListItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    // Store doc types fetched from JSON results
    const [jsonDocTypes, setJsonDocTypes] = useState<Record<string, string>>({});
    
    // Filter states
    const [filters, setFilters] = useState({
        date: "",
        file: "",
        docType: "",
        status: "",
    });
    const [showFilters, setShowFilters] = useState(false);

    const loadDocuments = useCallback(() => {
        apiClient.listDocuments().then((data) => setDocs(data));
    }, []);

    // Initial load
    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    // Fetch doc types from JSON results for ready/approved documents
    // Always fetch from JSON to get the actual DocType from OCR results
    useEffect(() => {
        const docsNeedingType = docs.filter(
            (d: DocumentListItem) => (d.status === "ready" || d.status === "approved") && 
                 d.has_json && 
                 !jsonDocTypes[d.id]
        );

        docsNeedingType.forEach(async (doc: DocumentListItem) => {
            try {
                const jsonData = await apiClient.getProcessedDocument(doc.id);
                const docType = extractDocType(jsonData);
                if (docType) {
                    setJsonDocTypes((prev: Record<string, string>) => ({ ...prev, [doc.id]: docType }));
                }
            } catch (e) {
                console.warn(`Could not fetch doc type for ${doc.id}:`, e);
            }
        });
    }, [docs, jsonDocTypes]);

    // Subscribe to global SSE events for real-time updates
    useEffect(() => {
        const eventSource = new EventSource(API_CONFIG.events.global);

        eventSource.onopen = () => {
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("SSE event received:", data);

                // Reload document list when any document status changes
                if (data.event === "result-ready" || 
                    data.event === "processing-started" || 
                    data.event === "error") {
                    loadDocuments();
                }
            } catch (e) {
                console.error("Failed to parse SSE event:", e);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
        };
    }, [loadDocuments]);

    // Get unique values for filter dropdowns - include types from JSON results
    const uniqueDocTypes = useMemo(() => {
        const types = new Set<string>();
        docs.forEach((d: DocumentListItem) => {
            // Prefer JSON doc type over database type
            const docType = jsonDocTypes[d.id] || d.type;
            if (docType) types.add(docType);
        });
        return Array.from(types).sort();
    }, [docs, jsonDocTypes]);

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(docs.map((d: DocumentListItem) => d.status));
        return Array.from(statuses).sort();
    }, [docs]);

    // Helper to get doc type - prefer JSON result over database value
    const getDocType = useCallback((doc: DocumentListItem): string => {
        return jsonDocTypes[doc.id] || doc.type || "";
    }, [jsonDocTypes]);

    // Filtered documents
    const filteredDocs = useMemo(() => {
        return docs.filter((d: DocumentListItem) => {
            const dateStr = formatDateTime(d.upload_time).toLowerCase();
            const fileName = d.original_name.toLowerCase();
            const docType = getDocType(d).toLowerCase();
            const status = d.status.toLowerCase();

            if (filters.date && !dateStr.includes(filters.date.toLowerCase())) return false;
            if (filters.file && !fileName.includes(filters.file.toLowerCase())) return false;
            if (filters.docType && docType !== filters.docType.toLowerCase()) return false;
            if (filters.status && status !== filters.status.toLowerCase()) return false;

            return true;
        });
    }, [docs, filters, getDocType]);

    // --- Compute counters (from filtered docs) ---
    const counts = {
        queued: filteredDocs.filter((d: DocumentListItem) => d.status === "queued").length,
        processing: filteredDocs.filter((d: DocumentListItem) => d.status === "processing").length,
        ready: filteredDocs.filter((d: DocumentListItem) => d.status === "ready").length,
        approved: filteredDocs.filter((d: DocumentListItem) => d.status === "approved").length,
        error: filteredDocs.filter((d: DocumentListItem) => d.status === "error").length,
    };

    const statusClass = (status: string) => {
        switch (status) {
            case "ready":
                return "bg-green-100 text-green-700";
            case "approved":
                return "bg-purple-100 text-purple-700";
            case "processing":
                return "bg-yellow-100 text-yellow-700";
            case "queued":
                return "bg-blue-100 text-blue-700";
            case "error":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const clearFilters = () => {
        setFilters({ date: "", file: "", docType: "", status: "" });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== "");

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-semibold">Documents</h1>
                        {isConnected && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors ${
                                showFilters || hasActiveFilters
                                    ? "bg-blue-50 border-blue-300 text-blue-700"
                                    : "bg-white hover:bg-gray-50"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {hasActiveFilters && (
                                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {Object.values(filters).filter(v => v !== "").length}
                                </span>
                            )}
                        </button>
                        <Link to="/upload">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Upload
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date/Time</label>
                                <input
                                    type="text"
                                    placeholder="Search date..."
                                    value={filters.date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">File Name</label>
                                <input
                                    type="text"
                                    placeholder="Search file..."
                                    value={filters.file}
                                    onChange={(e) => setFilters(prev => ({ ...prev, file: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Doc Type</label>
                                <select
                                    value={filters.docType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, docType: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="">All Types</option>
                                    {uniqueDocTypes.map(type => (
                                        <option key={type} value={type.toLowerCase()}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="">All Statuses</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status.toLowerCase()}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Bubbles */}
                <div className="flex gap-2 sm:gap-4 mb-6 flex-wrap">
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                        Queued: {counts.queued}
                    </div>
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm">
                        Processing: {counts.processing}
                    </div>
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm">
                        Ready: {counts.ready}
                    </div>
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-purple-100 text-purple-700 font-medium text-sm">
                        Approved: {counts.approved}
                    </div>
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-red-100 text-red-700 font-medium text-sm">
                        Error: {counts.error}
                    </div>
                </div>

                {/* Results count */}
                {hasActiveFilters && (
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {filteredDocs.length} of {docs.length} documents
                    </div>
                )}

                {/* Documents Table - Desktop */}
                <div className="hidden md:block overflow-hidden border rounded-lg shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date/Time</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">File</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Doc Type</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDocs.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDateTime(d.upload_time)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[250px]" title={d.original_name}>
                                                    {d.original_name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono" title={d.id}>
                                                    {d.id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {getDocType(d) || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(d.status)}`}
                                            >
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(d.status === "ready" || d.status === "approved") ? (
                                                <Link
                                                    to={`/documents/${d.id}`}
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {d.status === "approved" ? (
                                                        <>View <span className="text-green-600">✓</span></>
                                                    ) : (
                                                        <>View <span>→</span></>
                                                    )}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {filteredDocs.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-12 text-center text-gray-500" colSpan={5}>
                                            {hasActiveFilters ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>No documents match your filters</span>
                                                    <button
                                                        onClick={clearFilters}
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        Clear filters
                                                    </button>
                                                </div>
                                            ) : (
                                                "No documents uploaded yet."
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Documents Cards - Mobile */}
                <div className="md:hidden space-y-3">
                    {filteredDocs.map((d) => (
                        <div key={d.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{d.original_name}</p>
                                    <p className="text-[10px] text-gray-400 font-mono break-all">{d.id}</p>
                                </div>
                                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(d.status)}`}>
                                    {d.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                    <span className="text-gray-500">Date:</span>
                                    <span className="ml-1 text-gray-900">{formatDateTime(d.upload_time)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Type:</span>
                                    <span className="ml-1 text-gray-900">{getDocType(d) || "—"}</span>
                                </div>
                            </div>
                            {(d.status === "ready" || d.status === "approved") && (
                                <Link
                                    to={`/documents/${d.id}`}
                                    className="block w-full text-center py-2 bg-blue-50 text-blue-600 rounded-md font-medium text-sm hover:bg-blue-100 transition-colors"
                                >
                                    {d.status === "approved" ? "View Document ✓" : "View Document →"}
                                </Link>
                            )}
                        </div>
                    ))}

                    {filteredDocs.length === 0 && (
                        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                            {hasActiveFilters ? (
                                <div className="flex flex-col items-center gap-2">
                                    <span>No documents match your filters</span>
                                    <button
                                        onClick={clearFilters}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                "No documents uploaded yet."
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}