import os
import io
import zipfile
import logging
from typing import Optional, Tuple
import boto3
from botocore.exceptions import ClientError
# change3
from app.config import settings

logger = logging.getLogger("anywhere_door.s3")

class S3Manager:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.is_connected = False
        self.s3_client = None
        
        # Local fallback directory if S3 is unavailable locally
        self.local_fallback_dir = os.path.join(settings.BASE_DIR, "uploads")
        os.makedirs(self.local_fallback_dir, exist_ok=True)

    def initialize(self):
        try:
            logger.info("Initializing Amazon S3 client...")
            kwargs = {"region_name": settings.AWS_REGION}
            
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
                
            if settings.AWS_ENDPOINT_URL:
                kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL

            self.s3_client = boto3.client("s3", **kwargs)
            
            # Check or create bucket
            try:
                self.s3_client.head_bucket(Bucket=self.bucket_name)
                self.is_connected = True
                logger.info(f"Connected to Amazon S3 bucket '{self.bucket_name}'.")
            except ClientError as ce:
                error_code = ce.response.get("Error", {}).get("Code")
                if error_code in ("404", "NoSuchBucket"):
                    logger.info(f"Bucket '{self.bucket_name}' not found. Creating S3 bucket...")
                    if settings.AWS_REGION == "us-east-1":
                        self.s3_client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION}
                        )
                    self.is_connected = True
                    logger.info(f"Amazon S3 bucket '{self.bucket_name}' created successfully.")
                else:
                    raise ce

        except Exception as e:
            logger.warning(f"Amazon S3 connection unavailable: {e}. Falling back to local storage path ({self.local_fallback_dir}).")
            self.is_connected = False

    def upload_file(self, code: str, file_id: str, original_name: str, file_content: bytes, content_type: str) -> dict:
        """Uploads file content to Amazon S3 or local fallback."""
        s3_key = f"shares/{code}/{file_id}/{original_name}"
        
        if self.is_connected and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=content_type or "application/octet-stream"
                )
                return {
                    "s3_key": s3_key,
                    "storage_type": "s3",
                    "bucket": self.bucket_name
                }
            except Exception as e:
                logger.error(f"S3 PutObject error for key '{s3_key}': {e}")

        # Local fallback file saving
        share_dir = os.path.join(self.local_fallback_dir, code)
        os.makedirs(share_dir, exist_ok=True)
        local_filename = f"{file_id}_{original_name}"
        local_path = os.path.join(share_dir, local_filename)

        with open(local_path, "wb") as f:
            f.write(file_content)

        return {
            "s3_key": s3_key,
            "local_path": local_path,
            "storage_type": "local"
        }
# cha
    #hiiiiii
    #hiiiiii
    #hiiiiii

    def get_file_content(self, file_meta: dict) -> Tuple[bytes, str]:
        """Retrieves raw file bytes and content_type from S3 or local path."""
        s3_key = file_meta.get("s3_key")
        content_type = file_meta.get("content_type", "application/octet-stream")

        if self.is_connected and self.s3_client and s3_key:
            try:
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
                file_bytes = response["Body"].read()
                return file_bytes, content_type
            except Exception as e:
                logger.error(f"S3 GetObject error for key '{s3_key}': {e}")

        # Fallback to local file read
        local_path = file_meta.get("upload_path") or file_meta.get("local_path")
        if local_path and os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read(), content_type

        raise FileNotFoundError(f"File not found in S3 or local storage for file_id {file_meta.get('file_id')}")

    def generate_presigned_url(self, s3_key: str, expires_in: int = 3600) -> Optional[str]:
        """Generates a presigned S3 download URL if connected to AWS."""
        if self.is_connected and self.s3_client and s3_key:
            try:
                return self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket_name, "Key": s3_key},
                    ExpiresIn=expires_in
                )
            except Exception as e:
                logger.error(f"Presigned URL generation error: {e}")
        return None

    def create_zip_archive(self, files_list: list) -> io.BytesIO:
        """Bundles files into an in-memory ZIP buffer."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for f in files_list:
                try:
                    file_bytes, _ = self.get_file_content(f)
                    zip_file.writestr(f["original_name"], file_bytes)
                except Exception as e:
                    logger.warning(f"Could not add file '{f.get('original_name')}' to ZIP: {e}")

        zip_buffer.seek(0)
        return zip_buffer

s3_manager = S3Manager()
