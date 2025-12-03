import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation bar */}
      <header className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/charactell-logo.png" alt="Charactell" className="h-10 w-auto" />
          <Link to="/" className="text-xl font-semibold text-gray-700 hover:text-blue-600">
            Digital Demo Portal
          </Link>
        </div>

        <nav className="space-x-6">
          <Link to="/documents" className="text-gray-700 hover:text-blue-600">
            Documents
          </Link>
          <Link to="/upload" className="text-gray-700 hover:text-blue-600">
            Upload
          </Link>
        </nav>
      </header>

      <main className="p-8">{children}</main>
    </div>
  );
}
