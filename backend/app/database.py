# Compatibility layer mapping to AWS DynamoDB Manager
from app.storage.dynamodb import dynamodb_manager

def get_database():
    return dynamodb_manager
