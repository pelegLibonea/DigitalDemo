import sqlite3
from pathlib import Path
from datetime import datetime

from .config import DB_PATH


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # enables dict-like row access
    return conn


def init_db():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            original_name TEXT NOT NULL,
            type TEXT,
            status TEXT NOT NULL,
            upload_time TEXT NOT NULL,
            result_pdf_path TEXT,
            result_json_path TEXT
        )
    """)

    conn.commit()
    conn.close()
