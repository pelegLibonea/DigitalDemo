import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import PDFViewer from "../components/PDFViewer";
import Layout from "../components/Layout";
import { apiClient } from "../services/apiClient";
import { API_CONFIG } from "../config/api";
import type { ProcessedDocument, ExtractedField } from "../services/apiClient";

export default function DocumentDetails() {
    const { docId } = useParams<{ docId: string }>();
    const [job, setJob] = useState<ProcessedDocument | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Hooks must be declared before any conditional returns
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadDocument = useCallback(async () => {
        if (!docId) return;
        
        setIsLoading(true);
        try {
            const data = await apiClient.getProcessedDocument(docId);
            console.log("DETAIL RESPONSE:", data);

            if (!data || !data.pages) {
                setError("Backend returned object without pages");
                return;
            }

            if (!Array.isArray(data.pages)) {
                setError("Backend pages is not an array");
                return;
            }

            setJob(data);
            setError(null);
        } catch (err: any) {
            // Don't set error for 404 - document may still be processing
            if (!err.message?.includes("404")) {
                setError(err.message ?? "Unknown error");
            }
        } finally {
            setIsLoading(false);
        }
    }, [docId]);

    // Initial load
    useEffect(() => {
        if (!docId) {
            setError("No docId from router");
            return;
        }
        loadDocument();
    }, [docId, loadDocument]);

    // Subscribe to SSE for real-time updates
    useEffect(() => {
        if (!docId) return;

        const eventSource = new EventSource(API_CONFIG.events.document(docId));

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("SSE event received:", data);

                if (data.event === "result-ready") {
                    // Reload document data when results are ready
                    console.log("Results ready, reloading document...");
                    loadDocument();
                } else if (data.event === "processing-started") {
                    console.log("Processing started for document");
                } else if (data.event === "error") {
                    setError(`Processing error: ${data.error_message || "Unknown error"}`);
                }
            } catch (e) {
                console.error("Failed to parse SSE event:", e);
            }
        };

        eventSource.onerror = (e) => {
            console.warn("SSE connection error, will auto-reconnect:", e);
        };

        return () => {
            eventSource.close();
        };
    }, [docId, loadDocument]);

    // Derive data only after validating job/pages, but keep hooks above
    const isJobReady = job && Array.isArray(job.pages) && job.pages.length >= 1;
    const dataPage = isJobReady ? job!.pages[0] : null;
    // Show all fields (ignore visible flag since backend may set all fields as visible=false)
    const allFields: ExtractedField[] = dataPage ? (dataPage.fields || []) : [];
    const headerFields = allFields.filter((f: ExtractedField) => f.array_index === -1 || f.array_index === 0);
    const tableFields = allFields.filter((f: ExtractedField) => (f.array_index ?? -1) > 0);

    const columnsMeta: ExtractedField[] = Array.from(
        new Map<string, ExtractedField>(
            tableFields
                .slice()
                .sort((a: ExtractedField, b: ExtractedField) => (a.field_order ?? 0) - (b.field_order ?? 0))
                .map((f: ExtractedField): [string, ExtractedField] => [f.field_name, f])
        ).values()
    );
    const columns: string[] = columnsMeta.map((f: ExtractedField) => f.field_name);
    const columnLabels: Record<string, string> = {};
    columnsMeta.forEach((f: ExtractedField) => (columnLabels[f.field_name] = f.description || f.field_name));

    const rowsMap = new Map<number, Record<string, string>>();
    tableFields.forEach((f: ExtractedField) => {
        const idx = f.array_index ?? 0;
        const row = rowsMap.get(idx) || {};
        // Prefer typist_content over field_value for display
        row[f.field_name] = f.typist_content ?? f.field_value ?? "";
        rowsMap.set(idx, row);
    });
    const rows = Array.from(rowsMap.entries()).sort((a, b) => a[0] - b[0]).map(([index, values]) => ({ index, values }));

    // Initialize editable state when job becomes ready
    // Show typist_content if available, otherwise fall back to field_value
    useEffect(() => {
        if (isJobReady) {
            const s: Record<string, string> = {};
            headerFields.forEach((f: ExtractedField) => {
                s[f.field_name] = f.typist_content ?? f.field_value ?? "";
            });
            tableFields.forEach((f: ExtractedField) => {
                const key = `${f.array_index}__${f.field_name}`;
                s[key] = f.typist_content ?? f.field_value ?? "";
            });
            setFieldValues(s);
        }
    }, [isJobReady, job]);

    const setValue = (key: string, value: string) => setFieldValues((prev: Record<string, string>) => ({ ...prev, [key]: value }));

    const handleReset = () => {
        const s: Record<string, string> = {};
        headerFields.forEach((f: ExtractedField) => {
            s[f.field_name] = f.typist_content ?? f.field_value ?? "";
        });
        tableFields.forEach((f: ExtractedField) => {
            const key = `${f.array_index}__${f.field_name}`;
            s[key] = f.typist_content ?? f.field_value ?? "";
        });
        setFieldValues(s);
    };

    const handleSave = async () => {
        if (!isJobReady) return;
        
        const confirmed = window.confirm("Save changes and approve this document?");
        if (!confirmed) return;
        
        const updated: ProcessedDocument = JSON.parse(JSON.stringify(job));
        const page = updated.pages[0];
        page.fields = page.fields.map((f: ExtractedField) => {
            // Header fields: array_index is -1, 0, or undefined
            if (f.array_index === -1 || f.array_index === 0 || f.array_index === undefined) {
                if (fieldValues.hasOwnProperty(f.field_name)) {
                    // Save human corrections to typist_content
                    f.typist_content = fieldValues[f.field_name];
                }
            } else {
                // Table fields: array_index > 0
                const key = `${f.array_index}__${f.field_name}`;
                if (fieldValues.hasOwnProperty(key)) {
                    // Save human corrections to typist_content
                    f.typist_content = fieldValues[key];
                }
            }
            return f;
        });

        try {
            if (docId) {
                await apiClient.saveProcessedDocument(docId, updated);
                await apiClient.approveDocument(docId);
                // Update local state with saved values
                setJob(updated);
            }
            setSaveStatus("✓ Saved and approved successfully");
        } catch (err: any) {
            setSaveStatus(`Failed to save/approve: ${err.message}`);
        }
    };

    // Conditional rendering without affecting hook order
    if (error) {
        return <div className="p-4 text-red-600">❌ {error}</div>;
    }
    if (!job) {
        return (
            <Layout>
                <div className="p-4 flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span>Waiting for document data...</span>
                    <span className="text-gray-500 text-sm">(listening for updates)</span>
                </div>
            </Layout>
        );
    }
    if (!Array.isArray(job.pages)) {
        return <div className="p-4 text-red-600">❌ job.pages is NOT an array</div>;
    }
    if (!isJobReady) {
        return (
            <Layout>
                <div className="p-4 flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span>Document processing... ({job.pages.length} page(s) so far)</span>
                    <span className="text-gray-500 text-sm">(listening for updates)</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Link to="/documents" className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 text-sm">← Back to Documents</Link>
                        <h2 className="text-lg font-semibold">Document</h2>
                        {isLoading && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">ID: <span className="font-mono">{docId}</span></span>
                    </div>
                </div>

                <div className="flex h-full">
                    <div className="w-2/3 border-r p-4">
                        <PDFViewer docId={docId!} />
                    </div>

                    <div className="w-1/3 p-4 overflow-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold">Extracted Fields</h2>
                            <div className="flex gap-2">
                                <button onClick={handleReset} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Reset</button>
                                <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save & Approve</button>
                            </div>
                        </div>

                        {saveStatus && (
                            <div className={`mb-3 p-2 rounded text-sm ${saveStatus.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {saveStatus}
                            </div>
                        )}

                        <div className="mb-4">
                            {headerFields.map((f: ExtractedField) => (
                                <div key={f.field_name} className="border p-3 rounded mb-2">
                                    <div className="font-semibold mb-1">{f.description || f.field_name}</div>
                                    <input 
                                        type="text" 
                                        value={fieldValues[f.field_name] ?? ""} 
                                        onChange={(e) => setValue(f.field_name, e.target.value)} 
                                        className="border rounded w-full p-1"
                                        placeholder="(empty)"
                                    />
                                </div>
                            ))}
                        </div>

                        {rows.length === 0 ? (
                            <div className="text-gray-500">No table rows found.</div>
                        ) : (
                            <div className="overflow-auto">
                                <table className="w-full table-auto border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border px-2 py-1">#</th>
                                            {columns.map((col) => (
                                                <th key={col} className="border px-2 py-1 text-left">{columnLabels[col] ?? col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r) => (
                                            <tr key={r.index} className="border-b">
                                                <td className="border px-2 py-1 font-mono text-sm">{r.index}</td>
                                                {columns.map((col) => {
                                                    const key = `${r.index}__${col}`;
                                                    return (
                                                        <td key={key} className="border px-2 py-1">
                                                            <input type="text" value={fieldValues[key] ?? ""} onChange={(e) => setValue(key, e.target.value)} className="w-full p-1 border rounded" />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
