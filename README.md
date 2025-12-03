# DigitalDemo

Full-stack demo with a FastAPI backend and a React (Vite + TypeScript) frontend. Documents can be uploaded, processed, viewed (PDF/JSON), edited inline, and marked Approved. The edited JSON can be persisted to the original results file.

## Repository Structure
- `backend/` — FastAPI service, SQLite metadata DB, file storage under `backend/storage`
- `frontend/` — React + Vite app with Tailwind CSS

## Prerequisites
- Python 3.10+ (3.12+ recommended)
- Node.js 18+ (LTS) and npm

## Quick Start

1) Clone

```powershell
git clone https://github.com/charactell-vitaly/DigitalDemo.git
cd DigitalDemo
```

2) Backend setup

```powershell
cd backend
# Create and activate virtual env (recommended)
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Environment configuration
# Copy .env.example to .env.local and adjust values
# Typical settings:
# API_HOST=0.0.0.0
# API_PORT=8808
# API_RELOAD=true
# CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Run backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8808
```

3) Frontend setup

```powershell
cd ../frontend
npm install

# Environment configuration
# Copy .env.example to .env.local and set:
# VITE_API_BASE_URL=http://localhost:8808

# Run dev server
npm run dev
# Vite prints the URL (usually http://localhost:5173 or http://localhost:5174)
```

Open the printed frontend URL in a browser.

## Features to Try
- Upload a document (`Upload`)
- View the document list (`Documents`)
- Open a document and preview its PDF
- Edit extracted fields:
  - Header fields on top (array_index === -1 or 0)
  - Table fields below (array_index > 0) with editable cells
- Click `Save`:
  - A confirmation dialog appears
  - On confirm, the updated JSON is saved to the original `result_json_path`
  - Document status is set to `approved`

## Production Notes
- Frontend build:

```powershell
cd frontend
npm run build
# Outputs to frontend/dist
```

- Backend run without reload:

```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8808
```

- Serve `frontend/dist` via any static server (e.g., Nginx) and configure `VITE_API_BASE_URL` to point to the backend.

## Configuration Files
- Backend env: `.env.example`, `.env.local`, `.env.production`
- Frontend env: `.env.example`, `.env.local`, `.env.production`

## Troubleshooting
- Vite port busy: It will auto-fallback to `5174`. Ensure `CORS_ORIGINS` includes both `http://localhost:5173` and `http://localhost:5174`.
- Backend import errors: Ensure `backend/app/__init__.py` exists and run uvicorn from the `backend` directory.
- Approve/save issues:
  - Confirm the document has a `result_json_path` in DB (set via `/api/notify/result-ready`).
  - Backend persists edits to the JSON located at `result_json_path`.

## License
Proprietary demo content. Do not redistribute without permission.