from pydantic import BaseModel
from typing import Optional


class DocumentBase(BaseModel):
    id: str
    original_name: str
    type: Optional[str] = None
    status: str
    upload_time: str
    has_pdf: bool
    has_json: bool


class DocumentListItem(DocumentBase):
    pass


class DocumentDetail(DocumentBase):
    result_pdf_url: Optional[str] = None
    result_json_url: Optional[str] = None


class NotifyResultReadyPayload(BaseModel):
    doc_id: str
    pdf_path: Optional[str] = None
    json_path: Optional[str] = None
