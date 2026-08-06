import os
from dotenv import load_dotenv
from typing import Optional
from pydantic_settings import BaseSettings
load_dotenv()

print(f"os : {os.getenv("AWS_REGION", "us-east-1")}")



class Settings(BaseSettings):
    PROJECT_NAME: str = "Anywhere Door - File & Text Sharing"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # AWS Setup
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_ENDPOINT_URL: Optional[str] = os.getenv("AWS_ENDPOINT_URL", None)
    
    # DynamoDB & S3
    DYNAMODB_TABLE_NAME: str = os.getenv("DYNAMODB_TABLE_NAME", "AnywhereDoorShares")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "anywhere-door-uploads")
    
    # Security & Limits
    MAX_FILE_SIZE_MB: int = 500
    DEFAULT_EXPIRATION_MINUTES: int = 60
    
    class Config:
        env_file = ".env"

settings = Settings()
