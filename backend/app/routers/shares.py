from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.schemas import ShareCreate, ShareResponse, PasswordVerifyRequest, FileDetailResponse
from app.storage.dynamodb import dynamodb_manager
from app.utils.code_generator import generate_pin_code
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/shares", tags=["Shares"])

def format_share_response(share_data: dict) -> ShareResponse:
    files_res = []
    for f in share_data.get("files", []):
        files_res.append(
            FileDetailResponse(
                file_id=f["file_id"],
                filename=f["original_name"],
                file_size=int(f["file_size"]),
                content_type=f["content_type"],
                download_url=f"/api/v1/files/download/{share_data['code']}/{f['file_id']}"
            )
        )
    
    expires_at_str = share_data.get("expires_at")
    is_expired = False
    if expires_at_str:
        expires_at_dt = datetime.fromisoformat(expires_at_str)
        if datetime.now(timezone.utc) > expires_at_dt:
            is_expired = True
            
    max_d = int(share_data.get("max_downloads", -1))
    curr_d = int(share_data.get("current_downloads", 0))
    if max_d > 0 and curr_d >= max_d:
        is_expired = True

    return ShareResponse(
        code=share_data["code"],
        text_content=share_data.get("text_content"),
        files=files_res,
        created_at=share_data["created_at"],
        expires_at=expires_at_str,
        max_downloads=max_d,
        current_downloads=curr_d,
        is_protected=bool(share_data.get("hashed_password")),
        views_count=int(share_data.get("views_count", 0)),
        is_expired=is_expired
    )

@router.post("", response_model=ShareResponse)
async def create_share(payload: ShareCreate):
    now = datetime.now(timezone.utc)
    
    # Expiration logic
    expires_at = None
    if payload.expires_in_minutes > 0:
        expires_at = (now + timedelta(minutes=payload.expires_in_minutes)).isoformat()
        
    # Code generation logic
    code = payload.custom_code.upper() if payload.custom_code else None
    
    if code:
        existing = dynamodb_manager.get_share(code)
        if existing:
            raise HTTPException(status_code=400, detail="Custom code already taken. Choose another PIN code!")
    else:
        attempts = 0
        while attempts < 10:
            code = generate_pin_code(length=6)
            if not dynamodb_manager.get_share(code):
                break
            attempts += 1

    hashed_pw = hash_password(payload.password) if payload.password else None

    share_record = {
        "code": code,
        "text_content": payload.text_content,
        "files": [],
        "created_at": now.isoformat(),
        "expires_at": expires_at,
        "max_downloads": payload.max_downloads,
        "current_downloads": 0,
        "hashed_password": hashed_pw,
        "views_count": 0
    }

    saved_item = dynamodb_manager.save_share(share_record)
    return format_share_response(saved_item)

@router.get("/{code}", response_model=ShareResponse)
async def get_share(code: str, password: Optional[str] = None):
    code = code.upper()
    share_record = dynamodb_manager.get_share(code)
        
    if not share_record:
        raise HTTPException(status_code=404, detail="Share room not found or code invalid.")

    expires_at_str = share_record.get("expires_at")
    if expires_at_str:
        expires_at_dt = datetime.fromisoformat(expires_at_str)
        if datetime.now(timezone.utc) > expires_at_dt:
            raise HTTPException(status_code=410, detail="This share has expired and self-destructed.")

    max_d = int(share_record.get("max_downloads", -1))
    curr_d = int(share_record.get("current_downloads", 0))
    if max_d > 0 and curr_d >= max_d:
        raise HTTPException(status_code=410, detail="Download limit reached for this share room.")

    # Password check
    if share_record.get("hashed_password"):
        if not password or not verify_password(password, share_record["hashed_password"]):
            return ShareResponse(
                code=code,
                text_content=None,
                files=[],
                created_at=share_record["created_at"],
                expires_at=expires_at_str,
                max_downloads=max_d,
                current_downloads=curr_d,
                is_protected=True,
                views_count=int(share_record.get("views_count", 0)),
                is_expired=False
            )

    # Increment view counter
    dynamodb_manager.increment_views(code)

    return format_share_response(share_record)

@router.post("/verify")
async def verify_share_password(payload: PasswordVerifyRequest):
    code = payload.code.upper()
    share_record = dynamodb_manager.get_share(code)

    if not share_record:
        raise HTTPException(status_code=404, detail="Share room not found.")

    if not share_record.get("hashed_password"):
        return {"success": True, "message": "No password required."}

    if verify_password(payload.password, share_record["hashed_password"]):
        return {"success": True, "message": "Password verified."}
    else:
        raise HTTPException(status_code=401, detail="Incorrect password. Access denied.")
