import logging
import time
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.config import settings

logger = logging.getLogger("anywhere_door.dynamodb")

class DynamoDBManager:
    def __init__(self):
        self.table_name = settings.DYNAMODB_TABLE_NAME
        self.is_connected = False
        self.dynamodb_resource = None
        self.table = None
        
        # High-speed local fallback store if AWS is not configured
        self.memory_store: Dict[str, Dict[str, Any]] = {}

    def initialize(self):
        try:
            logger.info("Initializing AWS DynamoDB client...")
            kwargs = {"region_name": settings.AWS_REGION}
            
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
                
            if settings.AWS_ENDPOINT_URL:
                kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL

            self.dynamodb_resource = boto3.resource("dynamodb", **kwargs)
            self.table = self.dynamodb_resource.Table(self.table_name)
            
            # Check table existence or attempt to create
            try:
                self.table.load()
                self.is_connected = True
                logger.info(f"Connected to DynamoDB table '{self.table_name}'.")
            except ClientError as ce:
                if ce.response["Error"]["Code"] == "ResourceNotFoundException":
                    logger.info(f"Table '{self.table_name}' does not exist. Creating DynamoDB table with Partition Key 'code'...")
                    self.table = self.dynamodb_resource.create_table(
                        TableName=self.table_name,
                        KeySchema=[
                            {"AttributeName": "code", "KeyType": "HASH"}  # Partition Key: code (String)
                        ],
                        AttributeDefinitions=[
                            {"AttributeName": "code", "AttributeType": "S"}
                        ],
                        BillingMode="PAY_PER_REQUEST"
                    )
                    self.table.wait_until_exists()
                    self.is_connected = True
                    logger.info(f"DynamoDB table '{self.table_name}' created successfully.")
                else:
                    raise ce

        except Exception as e:
            logger.warning(f"AWS DynamoDB connection unavailable: {e}. Falling back to high-speed in-memory store.")
            self.is_connected = False

    def save_share(self, share_data: dict) -> dict:
        """Saves a share record to DynamoDB with partition key 'code' and optional TTL."""
        code = share_data["code"]
        
        # Add TTL timestamp if expires_at is present
        item = dict(share_data)
        if item.get("expires_at"):
            try:
                dt = datetime.fromisoformat(item["expires_at"])
                item["ttl_timestamp"] = int(dt.timestamp())
            except Exception:
                pass

        if self.is_connected and self.table:
            try:
                self.table.put_item(Item=item)
                return item
            except Exception as e:
                logger.error(f"DynamoDB PutItem error: {e}")
                
        # Fallback to memory store
        self.memory_store[code] = item
        return item

    def get_share(self, code: str) -> Optional[dict]:
        """Retrieves a share record by partition key 'code'."""
        code = code.upper()
        if self.is_connected and self.table:
            try:
                response = self.table.get_item(Key={"code": code})
                item = response.get("Item")
                if item:
                    # Convert Decimal objects to standard ints/floats if needed
                    return item
            except Exception as e:
                logger.error(f"DynamoDB GetItem error: {e}")

        # Fallback
        return self.memory_store.get(code)

    def add_files_to_share(self, code: str, new_files: list) -> Optional[dict]:
        """Appends new files to an existing share record."""
        code = code.upper()
        item = self.get_share(code)
        if not item:
            return None

        current_files = item.get("files", [])
        current_files.extend(new_files)
        item["files"] = current_files

        if self.is_connected and self.table:
            try:
                self.table.update_item(
                    Key={"code": code},
                    UpdateExpression="SET #files = :f",
                    ExpressionAttributeNames={"#files": "files"},
                    ExpressionAttributeValues={":f": current_files}
                )
            except Exception as e:
                logger.error(f"DynamoDB UpdateItem (files) error: {e}")
        else:
            self.memory_store[code] = item

        return item

    def increment_views(self, code: str):
        """Increments room view counter in DynamoDB."""
        code = code.upper()
        if self.is_connected and self.table:
            try:
                self.table.update_item(
                    Key={"code": code},
                    UpdateExpression="ADD views_count :inc",
                    ExpressionAttributeValues={":inc": 1}
                )
                return
            except Exception as e:
                logger.error(f"DynamoDB increment_views error: {e}")

        if code in self.memory_store:
            self.memory_store[code]["views_count"] = self.memory_store[code].get("views_count", 0) + 1

    def increment_downloads(self, code: str):
        """Increments room download counter in DynamoDB."""
        code = code.upper()
        if self.is_connected and self.table:
            try:
                self.table.update_item(
                    Key={"code": code},
                    UpdateExpression="ADD current_downloads :inc",
                    ExpressionAttributeValues={":inc": 1}
                )
                return
            except Exception as e:
                logger.error(f"DynamoDB increment_downloads error: {e}")

        if code in self.memory_store:
            self.memory_store[code]["current_downloads"] = self.memory_store[code].get("current_downloads", 0) + 1

    def delete_share(self, code: str):
        """Deletes a share item from DynamoDB."""
        code = code.upper()
        if self.is_connected and self.table:
            try:
                self.table.delete_item(Key={"code": code})
            except Exception as e:
                logger.error(f"DynamoDB DeleteItem error: {e}")

        self.memory_store.pop(code, None)

dynamodb_manager = DynamoDBManager()
