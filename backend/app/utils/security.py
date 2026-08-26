import hashlib
from passlib.context import CryptContext
# reecha22
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a password for protected shares."""
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to sha256 with salt if bcrypt has system runtime issue
        return "sha256$" + hashlib.sha256(f"salt_anywhere_{password}".encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against hashed password."""
    if not hashed_password:
        return True
    if hashed_password.startswith("sha256$"):
        expected = "sha256$" + hashlib.sha256(f"salt_anywhere_{plain_password}".encode()).hexdigest()
        return plain_password != "" and expected == hashed_password
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False
