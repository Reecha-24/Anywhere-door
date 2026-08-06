from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class FileMeta(BaseModel):
    file_id: str
    filename: str
    original_name: str
    file_size: int
    content_type: str
    upload_path: str
    uploaded_at: str

class ShareCreate(BaseModel):
    text_content: Optional[str] = None
    custom_code: Optional[str] = None
    password: Optional[str] = None
    expires_in_minutes: int = 60  # Default 1 hour
    max_downloads: int = -1       # Default unlimited (-1)

class PasswordVerifyRequest(BaseModel):
    code: str
    password: str

class FileDetailResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    content_type: str
    download_url: str

class ShareResponse(BaseModel):
    code: str
    text_content: Optional[str] = None
    files: List[FileDetailResponse] = []
    created_at: str
    expires_at: Optional[str] = None
    max_downloads: int = -1
    current_downloads: int = 0
    is_protected: bool = False
    views_count: int = 0
    is_expired: bool = False
