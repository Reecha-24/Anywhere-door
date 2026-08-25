import uuid
import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import List, Optional

from app.storage.dynamodb import dynamodb_manager
from app.storage.s3 import s3_manager
from app.utils.security import verify_password
#change1
router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/upload/{code}")
async def upload_files_to_share(
    code: str, 
    files: List[UploadFile] = File(...),
    password: Optional[str] = Form(None)
):
    code = code.upper()
    share_record = dynamodb_manager.get_share(code)

    if not share_record:
        raise HTTPException(status_code=404, detail="Share room not found.")

    if share_record.get("hashed_password"):
        if not password or not verify_password(password, share_record["hashed_password"]):
            raise HTTPException(status_code=401, detail="Password required or incorrect.")

    uploaded_meta_list = []
    for upload_file in files:
        file_id = str(uuid.uuid4())
        original_name = upload_file.filename or "unnamed_file"
        file_content = await upload_file.read()
        content_type = upload_file.content_type or "application/octet-stream"

        # Upload file content to Amazon S3
        s3_res = s3_manager.upload_file(
            code=code,
            file_id=file_id,
            original_name=original_name,
            file_content=file_content,
            content_type=content_type
        )

        file_meta = {
            "file_id": file_id,
            "original_name": original_name,
            "filename": original_name,
            "file_size": len(file_content),
            "content_type": content_type,
            "s3_key": s3_res.get("s3_key"),
            "storage_type": s3_res.get("storage_type"),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        if s3_res.get("local_path"):
            file_meta["upload_path"] = s3_res["local_path"]

        uploaded_meta_list.append(file_meta)

    # Persist updated files in AWS DynamoDB
    dynamodb_manager.add_files_to_share(code, uploaded_meta_list)

    return {
        "success": True,
        "message": f"Successfully uploaded {len(uploaded_meta_list)} file(s) to Amazon S3 & DynamoDB.",
        "uploaded_files": [
            {
                "file_id": f["file_id"],
                "filename": f["original_name"],
                "file_size": f["file_size"],
                "content_type": f["content_type"],
                "download_url": f"/api/v1/files/download/{code}/{f['file_id']}"
            }
            for f in uploaded_meta_list
        ]
    }

@router.get("/download/{code}/{file_id}")
async def download_file(code: str, file_id: str, password: Optional[str] = None):
    code = code.upper()
    share_record = dynamodb_manager.get_share(code)

    if not share_record:
        raise HTTPException(status_code=404, detail="Share room not found.")

    if share_record.get("hashed_password"):
        if not password or not verify_password(password, share_record["hashed_password"]):
            raise HTTPException(status_code=401, detail="Password protected share.")

    # Find file metadata
    target_file = None
    for f in share_record.get("files", []):
        if f["file_id"] == file_id:
            target_file = f
            break

    if not target_file:
        raise HTTPException(status_code=404, detail="File metadata not found.")

    try:
        file_bytes, content_type = s3_manager.get_file_content(target_file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File object not found in Amazon S3 storage.")

    # Increment download counter in DynamoDB
    dynamodb_manager.increment_downloads(code)

    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename=\"{target_file['original_name']}\""}
    )

@router.get("/preview/{code}/{file_id}")
async def preview_file(code: str, file_id: str, password: Optional[str] = None):
    code = code.upper()
    share_record = dynamodb_manager.get_share(code)

    if not share_record:
        raise HTTPException(status_code=404, detail="Share room not found.")

    if share_record.get("hashed_password"):
        if not password or not verify_password(password, share_record["hashed_password"]):
            raise HTTPException(status_code=401, detail="Password protected share.")

    target_file = None
    for f in share_record.get("files", []):
        if f["file_id"] == file_id:
            target_file = f
            break

    if not target_file:
        raise HTTPException(status_code=404, detail="File metadata not found.")

    try:
        file_bytes, content_type = s3_manager.get_file_content(target_file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File object not found in Amazon S3 storage.")

    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename=\"{target_file['original_name']}\""}
    )

@router.get("/zip/{code}")
async def download_all_zip(code: str, password: Optional[str] = None):
    code = code.upper()
    share_record = dynamodb_manager.get_share(code)

    if not share_record or not share_record.get("files"):
        raise HTTPException(status_code=404, detail="No files available for ZIP download.")

    if share_record.get("hashed_password"):
        if not password or not verify_password(password, share_record["hashed_password"]):
            raise HTTPException(status_code=401, detail="Password protected share.")

    # Create ZIP archive directly from S3 files
    zip_buffer = s3_manager.create_zip_archive(share_record["files"])

    # Increment download counter in DynamoDB
    dynamodb_manager.increment_downloads(code)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=\"AnywhereDoor_{code}.zip\""}
    )
