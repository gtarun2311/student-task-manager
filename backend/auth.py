# datetime is used to set token expiry time.
from datetime import datetime, timedelta, timezone

# Depends and HTTPException are used for protected routes.
from fastapi import Depends, HTTPException, status

# OAuth2PasswordBearer reads token from Authorization header.
from fastapi.security import OAuth2PasswordBearer

# JWTError handles invalid token errors.
from jose import JWTError, jwt

# CryptContext is used for password hashing.
from passlib.context import CryptContext

# Session is SQLAlchemy database session type.
from sqlalchemy.orm import Session

# Database dependency.
from database import get_db

# User database model.
from models import UserModel


# Secret key signs JWT tokens.
# Later we will move this to .env file.
SECRET_KEY = "student-task-manager-secret-key-change-later"

# JWT algorithm.
ALGORITHM = "HS256"

# Token expiry time.
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# This tells FastAPI where login happens.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing setup.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    # Converts normal password into hashed password.
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    # Checks normal password against stored hashed password.
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    # Copy token data so original data is not changed.
    to_encode = data.copy()

    # Set token expiry time.
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiry time inside token.
    to_encode.update({"exp": expire})

    # Create JWT token.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    # This error is used when token is missing, wrong, or expired.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode token using secret key.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # We stored user email inside "sub".
        email: str | None = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Find logged-in user from database.
    user = db.query(UserModel).filter(UserModel.email == email).first()

    if user is None:
        raise credentials_exception

    # Return current logged-in user.
    return user