import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PDFViewer from "../components/PDFViewer";
import Layout from "../components/Layout";
import { apiClient } from "../services/apiClient";
import type { ProcessedDocument, ExtractedField } from "../services/apiClient";

export default function DocumentDetails() {
    const { docId } = useParams<{ docId: string }>();
    const [job, setJob] = useState<ProcessedDocument | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Hooks must be declared before any conditional returns
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!docId) {
            setError("No docId from router");
            return;
        }

        async function load() {
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
            } catch (err: any) {
                setError(err.message ?? "Unknown error");
            }
        }

        load();
    }, [docId]);

    // Derive data only after validating job/pages, but keep hooks above
    const isJobReady = job && Array.isArray(job.pages) && job.pages.length >= 2;
    const dataPage = isJobReady ? job!.pages[1] : null;
    const visibleFields = dataPage ? (dataPage.fields || []).filter((f) => f.visible) : [];
    const headerFields = visibleFields.filter((f) => f.array_index === -1 || f.array_index === 0);
    const tableFields = visibleFields.filter((f) => (f.array_index ?? -1) > 0);

    const columnsMeta = Array.from(
        new Map(
            tableFields
                .slice()
                .sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0))
                .map((f) => [f.field_name, f])
        ).values()
    );
    const columns: string[] = columnsMeta.map((f) => f.field_name);
    const columnLabels: Record<string, string> = {};
    columnsMeta.forEach((f) => (columnLabels[f.field_name] = f.description || f.field_name));

    const rowsMap = new Map<number, Record<string, string>>();
    tableFields.forEach((f) => {
        const idx = f.array_index ?? 0;
        const row = rowsMap.get(idx) || {};
        row[f.field_name] = f.field_value ?? "";
        rowsMap.set(idx, row);
    });
    const rows = Array.from(rowsMap.entries()).sort((a, b) => a[0] - b[0]).map(([index, values]) => ({ index, values }));

    // Initialize editable state when job becomes ready
    useEffect(() => {
        if (isJobReady) {
            const s: Record<string, string> = {};
            headerFields.forEach((f) => (s[f.field_name] = f.field_value ?? ""));
            tableFields.forEach((f) => {
                const key = `${f.array_index}__${f.field_name}`;
                s[key] = f.field_value ?? "";
            });
            setFieldValues(s);
        }
    }, [isJobReady, job]);

    const setValue = (key: string, value: string) => setFieldValues((prev) => ({ ...prev, [key]: value }));

    const handleReset = () => {
        const s: Record<string, string> = {};
        headerFields.forEach((f) => (s[f.field_name] = f.field_value ?? ""));
        tableFields.forEach((f) => {
            const key = `${f.array_index}__${f.field_name}`;
            s[key] = f.field_value ?? "";
        });
        setFieldValues(s);
    };

    const handleSave = async () => {
        if (!isJobReady) return;
        const updated: ProcessedDocument = JSON.parse(JSON.stringify(job));
        const page = updated.pages[1];
        page.fields = page.fields.map((f: ExtractedField) => {
            if (f.array_index === -1) {
                if (fieldValues.hasOwnProperty(f.field_name)) f.field_value = fieldValues[f.field_name];
            } else {
                const key = `${f.array_index}__${f.field_name}`;
                if (fieldValues.hasOwnProperty(key)) f.field_value = fieldValues[key];
            }
            return f;
        });
        // Mark document approved in backend
            const confirmed = window.confirm("Save changes to the original JSON file?");
            if (!confirmed) return;

            try {
                if (docId) {
                    await apiClient.saveProcessedDocument(docId, updated);
                    await apiClient.approveDocument(docId);
                }
                setSaveStatus("Saved to original JSON and approved");
            } catch (err: any) {
                setSaveStatus(`Failed to save/approve: ${err.message}`);
            }
        try {
            if (docId) {
                await apiClient.approveDocument(docId);
            }
            setSaveStatus("Saved and approved");
        } catch (err: any) {
            setSaveStatus(`Saved (local), but failed to mark approved: ${err.message}`);
        }
    };

    // Conditional rendering without affecting hook order
    if (error) {
        return <div className="p-4 text-red-600">❌ {error}</div>;
    }
    if (!job) {
        return <div className="p-4">Loading document…</div>;
    }
    if (!Array.isArray(job.pages)) {
        return <div className="p-4 text-red-600">❌ job.pages is NOT an array</div>;
    }
    if (!isJobReady) {
        return (
            <div className="p-4 text-red-600">
                ❌ only {job.pages.length} page(s). No data page found.
            </div>
        );
    }

    return (
        <Layout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Link to="/documents" className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 text-sm">← Back to Documents</Link>
                        <h2 className="text-lg font-semibold">Document</h2>
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
                                <button onClick={handleReset} className="px-3 py-1 bg-gray-100 rounded">Reset</button>
                                <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </div>

                        {saveStatus && <div className="mb-2 text-sm text-green-700">{saveStatus}</div>}

                        <div className="mb-4">
                            {headerFields.map((f) => (
                                <div key={f.field_name} className="border p-3 rounded mb-2">
                                    <div className="font-semibold mb-1">{f.description}</div>
                                    <input type="text" value={fieldValues[f.field_name] ?? ""} onChange={(e) => setValue(f.field_name, e.target.value)} className="border rounded w-full p-1" />
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
