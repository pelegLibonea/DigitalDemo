import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const { doc_id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:8808/api/documents/${doc_id}`)
      .then(r => r.json())
      .then(setData);
  }, [doc_id]);

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Document Result</h1>

      <pre className="bg-gray-900 text-white p-4 rounded text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
