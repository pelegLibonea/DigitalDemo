from pathlib import Path

# Base directory = backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Storage dirs
STORAGE_DIR = BASE_DIR / "storage"
INCOMING_ROOT = STORAGE_DIR / "incoming"
RESULTS_ROOT = STORAGE_DIR / "results"

# SQLite database file
DB_PATH = STORAGE_DIR / "documents.db"

# Ensure required folders exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
INCOMING_ROOT.mkdir(parents=True, exist_ok=True)
RESULTS_ROOT.mkdir(parents=True, exist_ok=True)
