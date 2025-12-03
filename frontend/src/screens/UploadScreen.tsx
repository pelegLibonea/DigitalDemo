import { useState } from "react";
import Layout from "../components/layout";
import { useNavigate } from "react-router-dom";

export default function UploadScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("invoice");
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please choose a file.");
      return;
    }

    setIsUploading(true);
    setStatus("");

    const form = new FormData();
    form.append("file", file);
    form.append("type", docType);

    try {
      const res = await fetch("http://localhost:8808/api/upload", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        setStatus("Upload successful!");
        setTimeout(() => navigate("/documents"), 500);
      } else {
        setStatus("Upload failed.");
      }
    } catch (err) {
      setStatus("Upload error: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white border rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6">Upload Document</h1>

        {/* Document Type */}
        <label className="block mb-4 text-gray-700">
          Document Type
          <select
            className="mt-1 p-2 w-full border rounded-lg"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="invoice">Invoice</option>
            <option value="id">ID</option>
            <option value="receipt">Receipt</option>
            <option value="contract">Contract</option>
          </select>
        </label>

        {/* File Picker */}
        <label className="block mb-6 text-gray-700">
          PDF or Image File
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="mt-2 block w-full border rounded-lg p-2"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full py-2 rounded-lg text-white ${
            isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>

        {/* Status */}
        {status && (
          <p className="mt-4 text-center text-gray-700">{status}</p>
        )}
      </div>
    </Layout>
  );
}
