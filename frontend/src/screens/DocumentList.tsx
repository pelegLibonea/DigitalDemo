import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

interface Doc {
    id: string;
    original_name: string;
    status: string;
}

export default function DocumentList() {
    const [docs, setDocs] = useState<Doc[]>([]);

    useEffect(() => {
        fetch("http://localhost:8808/api/documents")
            .then((res) => res.json())
            .then((data) => setDocs(data));
    }, []);

    // --- Compute counters ---
    const counts = {
        queued: docs.filter((d) => d.status === "queued").length,
        processing: docs.filter((d) => d.status === "processing").length,
        ready: docs.filter((d) => d.status === "ready").length,
        error: docs.filter((d) => d.status === "error").length,
    };

    const statusClass = (status: string) => {
        switch (status) {
            case "ready":
                return "bg-green-100 text-green-700";
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

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Title + Upload button */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-semibold">Uploaded Documents</h1>

                    <Link to="/upload">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            + Upload
                        </button>
                    </Link>
                </div>

                {/* Summary Bubbles */}
                <div className="flex gap-4 mb-6">
                    <div className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Queued: {counts.queued}
                    </div>
                    <div className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        Processing: {counts.processing}
                    </div>
                    <div className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                        Ready: {counts.ready}
                    </div>
                    <div className="px-4 py-2 rounded-full bg-red-100 text-red-700 font-medium">
                        Error: {counts.error}
                    </div>
                </div>

                {/* Documents Table */}
                <div className="overflow-hidden border rounded-lg shadow">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">File</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((d) => (
                                <tr key={d.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-mono text-sm">{d.id}</td>
                                    <td className="p-3">{d.original_name}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded-md text-sm font-medium ${statusClass(
                                                d.status
                                            )}`}
                                        >
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {d.status === "ready" ? (
                                            <Link
                                                to={`/documents/${d.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View →
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 italic">
                                                Not ready
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {docs.length === 0 && (
                                <tr>
                                    <td
                                        className="p-6 text-center text-gray-500"
                                        colSpan={4}
                                    >
                                        No documents uploaded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
