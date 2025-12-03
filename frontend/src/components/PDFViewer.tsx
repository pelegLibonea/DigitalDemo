import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
// Import viewer styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function PDFViewer({ docId }: { docId: string }) {
    const defaultLayout = defaultLayoutPlugin();

    const pdfUrl = `http://localhost:8808/api/results/pdf/${docId}`;

    return (
        <div className="h-[85vh] border rounded bg-gray-50">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={pdfUrl}
                    plugins={[defaultLayout]}
                />
            </Worker>
        </div>
    );
}
