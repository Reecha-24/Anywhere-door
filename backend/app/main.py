import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.storage.dynamodb import dynamodb_manager
from app.storage.s3 import s3_manager
from app.routers import shares, files
# diff --git a/{filename} b/{filename}\n--- a/{filename}\n+++ b/{filename}\n
# Not so important chhange 891012
# aws_secret = aws7865t5667t6y8o987@34!7
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize AWS Services (DynamoDB & S3)
    dynamodb_manager.initialize()
    s3_manager.initialize()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Anywhere Door - AWS DynamoDB & Amazon S3 File & Clipboard API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(shares.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "storage_layer": {
            "database": "AWS DynamoDB",
            "file_store": "Amazon S3",
            "dynamodb_table": settings.DYNAMODB_TABLE_NAME,
            "s3_bucket": settings.S3_BUCKET_NAME
        },
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# different posotion

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Anywhere Door API",
        "aws_dynamodb_connected": dynamodb_manager.is_connected,
        "aws_s3_connected": s3_manager.is_connected
    }
