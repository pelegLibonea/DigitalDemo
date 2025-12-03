import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PDFViewer from "../components/PDFViewer";

interface Field {
    field_name: string;
    field_value: string;
    visible: boolean;
    description: string;
    readonly: boolean;
}

interface Page {
    fields: Field[];
}

interface Job {
    pages: Page[];
}

export default function DocumentDetails() {
    const { docId } = useParams<{ docId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!docId) {
            setError("No docId from router");
            return;
        }

        async function load() {
            try {
                const res = await fetch(`http://localhost:8808/api/results/json/${docId}`);
                if (!res.ok) {
                    setError(`Backend error: ${res.status}`);
                    return;
                }

                const data = await res.json();
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

    if (error) {
        return <div className="p-4 text-red-600">❌ {error}</div>;
    }

    if (!job) {
        return <div className="p-4">Loading document…</div>;
    }

    if (!Array.isArray(job.pages)) {
        return <div className="p-4 text-red-600">❌ job.pages is NOT an array</div>;
    }

    if (job.pages.length < 2) {
        return (
            <div className="p-4 text-red-600">
                ❌ only {job.pages.length} page(s). No data page found.
            </div>
        );
    }

    // Skip _JobForm (index 0), use first real page
    const dataPage = job.pages[1];
    const visibleFields = (dataPage.fields || []).filter((f) => f.visible);

    return (
        <div className="flex h-full">
            {/* LEFT: PDF */}
            <div className="w-2/3 border-r p-4">
                <h2 className="text-lg font-semibold mb-2">Document</h2>
                {/* PDF endpoint is still /api/results/pdf/{docId} */}
                <PDFViewer docId={docId!} />
            </div>

            {/* RIGHT: Fields */}
            <div className="w-1/3 p-4 overflow-auto">
                <h2 className="text-lg font-semibold mb-4">Extracted Fields</h2>

                {visibleFields.length === 0 && (
                    <div className="text-gray-500">No visible fields found.</div>
                )}

                <div className="flex flex-col gap-3">
                    {visibleFields.map((f) => (
                        <div key={f.field_name} className="border p-3 rounded">
                            <div className="font-semibold">{f.description}</div>
                            <input
                                type="text"
                                defaultValue={f.field_value}
                                readOnly={f.readonly}
                                className="border rounded w-full p-1 mt-1"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
