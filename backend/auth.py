# datetime is used to set token expiry time
from datetime import datetime, timedelta, timezone

# jwt is used to create login tokens
from jose import jwt

# CryptContext is used to hash and verify passwords
from passlib.context import CryptContext


# Secret key is used to sign JWT tokens.
# For real deployment, this should be stored in .env file, not directly in code.
SECRET_KEY = "student-task-manager-secret-key-change-later"

# Algorithm used for JWT token
ALGORITHM = "HS256"

# Token expiry time in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# Password hashing configuration.
# bcrypt is a strong hashing algorithm for passwords.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    # Converts normal password into hashed password
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    # Compares normal password with stored hashed password
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    # Copy data so original data is not changed
    to_encode = data.copy()

    # Token expiry time
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiry to token data
    to_encode.update({"exp": expire})

    # Create and return JWT token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt