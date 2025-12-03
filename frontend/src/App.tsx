import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DocumentList from "./screens/DocumentList";
import UploadScreen from "./screens/UploadScreen";
import DocumentDetails from "./screens/DocumentDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/documents" />} />
        <Route path="/documents" element={<DocumentList />} />
        <Route path="/documents/:docId" element={<DocumentDetails />} />
        <Route path="/upload" element={<UploadScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
