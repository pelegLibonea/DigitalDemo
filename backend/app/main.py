import uuid
import json
from pathlib import Path
from datetime import datetime
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .schemas import DocumentListItem, DocumentDetail, NotifyResultReadyPayload
from .db import get_connection, init_db
from .config import INCOMING_ROOT, RESULTS_ROOT


app = FastAPI(title="Doc Portal Backend", version="0.1.0")

# Initialize DB
init_db()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Allow everything for POC
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def validate_extension(filename):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/upload", response_model=DocumentDetail)
async def upload_document(
    file: UploadFile = File(...),
    type: str = Form(None),
):
    validate_extension(file.filename)

    doc_id = str(uuid.uuid4())
    upload_time = datetime.utcnow().isoformat()

    # Create folder for the document
    doc_folder = INCOMING_ROOT / doc_id
    doc_folder.mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    original_name = file.filename
    original_path = doc_folder / original_name

    content = await file.read()
    with original_path.open("wb") as f:
        f.write(content)

    # Create meta.json
    meta = {
        "doc_id": doc_id,
        "type": type or "document"
    }
    with (doc_folder / "meta.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    # Insert record to DB
    conn = get_connection()
    conn.execute("""
        INSERT INTO documents (id, original_name, type, status, upload_time)
        VALUES (?, ?, ?, ?, ?)
    """, (doc_id, original_name, type, "queued", upload_time))
    conn.commit()
    conn.close()

    return DocumentDetail(
        id=doc_id,
        original_name=original_name,
        type=type,
        status="queued",
        upload_time=upload_time,
        has_pdf=False,
        has_json=False,
        result_pdf_url=None,
        result_json_url=None
    )


@app.get("/api/documents", response_model=List[DocumentListItem])
def list_documents():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM documents ORDER BY upload_time DESC").fetchall()
    conn.close()

    docs = []
    for r in rows:
        docs.append(DocumentListItem(
            id=r["id"],
            original_name=r["original_name"],
            type=r["type"],
            status=r["status"],
            upload_time=r["upload_time"],
            has_pdf=r["result_pdf_path"] is not None,
            has_json=r["result_json_path"] is not None,
        ))

    return docs


@app.get("/api/documents/{doc_id}", response_model=DocumentDetail)
def get_document(doc_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    pdf_url = f"/api/results/pdf/{doc_id}" if row["result_pdf_path"] else None
    json_url = f"/api/results/json/{doc_id}" if row["result_json_path"] else None

    return DocumentDetail(
        id=row["id"],
        original_name=row["original_name"],
        type=row["type"],
        status=row["status"],
        upload_time=row["upload_time"],
        has_pdf=row["result_pdf_path"] is not None,
        has_json=row["result_json_path"] is not None,
        result_pdf_url=pdf_url,
        result_json_url=json_url
    )


@app.get("/api/results/pdf/{doc_id}")
def get_pdf(doc_id: str):
    conn = get_connection()
    row = conn.execute("SELECT result_pdf_path FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()

    if not row or not row["result_pdf_path"]:
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(row["result_pdf_path"], media_type="application/pdf")


@app.get("/api/results/json/{doc_id}")
def get_json(doc_id: str):
    conn = get_connection()
    row = conn.execute("SELECT result_json_path FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()

    if not row or not row["result_json_path"]:
        raise HTTPException(status_code=404, detail="JSON not found")

    return FileResponse(row["result_json_path"], media_type="application/json")


@app.post("/api/notify/result-ready")
def notify_result_ready(payload: NotifyResultReadyPayload):
    conn = get_connection()

    # Ensure document exists
    exists = conn.execute("SELECT 1 FROM documents WHERE id = ?", (payload.doc_id,)).fetchone()
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    # Validate provided paths
    if payload.pdf_path and not Path(payload.pdf_path).exists():
        conn.close()
        raise HTTPException(status_code=400, detail="pdf_path does not exist")

    if payload.json_path and not Path(payload.json_path).exists():
        conn.close()
        raise HTTPException(status_code=400, detail="json_path does not exist")

    # Update db
    conn.execute("""
        UPDATE documents
        SET result_pdf_path = ?, result_json_path = ?, status = 'ready'
        WHERE id = ?
    """, (payload.pdf_path, payload.json_path, payload.doc_id))
    conn.commit()
    conn.close()

    return {"status": "ok"}


from fastapi import Body

@app.post("/api/notify/processing-started")
def notify_processing_started(payload: dict = Body(...)):
    doc_id = payload.get("doc_id")
    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id missing")

    conn = get_connection()

    exists = conn.execute("SELECT 1 FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    conn.execute("""
        UPDATE documents
        SET status = 'processing'
        WHERE id = ?
    """, (doc_id,))
    conn.commit()
    conn.close()

    return {"status": "ok"}

@app.post("/api/notify/error")
def notify_error(payload: dict = Body(...)):
    doc_id = payload.get("doc_id")
    error_message = payload.get("error_message")

    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id is required")

    if not error_message:
        raise HTTPException(status_code=400, detail="error_message is required")

    conn = get_connection()

    exists = conn.execute(
        "SELECT 1 FROM documents WHERE id = ?", (doc_id,)
    ).fetchone()
    
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    conn.execute("""
        UPDATE documents
        SET status = 'error',
            result_json_path = NULL,
            result_pdf_path = NULL
        WHERE id = ?
    """, (doc_id,))

    conn.commit()
    conn.close()

    return {"status": "ok"}
