# Depends is used for database and auth dependencies.
from fastapi import Depends, FastAPI, HTTPException

# OAuth2PasswordRequestForm is used for login form data.
from fastapi.security import OAuth2PasswordRequestForm

# CORS allows frontend to call backend.
from fastapi.middleware.cors import CORSMiddleware

# Session is SQLAlchemy database session type.
from sqlalchemy.orm import Session

# CRUD functions.
import crud

# Auth helpers.
from auth import create_access_token, get_current_user, verify_password

# Database setup.
from database import Base, engine, get_db

# Database user model.
from models import UserModel

# Request/response schemas.
from schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TokenResponse,
    UserCreate,
    UserResponse,
)


app = FastAPI(title="Student Task Manager API")


# Allow React frontend to call backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables.
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    # Backend status route.
    return {"message": "Student Task Manager API is running"}


@app.get("/health")
def health_check():
    # Health check route.
    return {"status": "ok"}


@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Register new user.
    return crud.create_user(db, user)


@app.post("/auth/login", response_model=TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2PasswordRequestForm uses username field.
    # In our app, username means email.
    email = form_data.username.strip().lower()

    # Find user by email.
    user = crud.get_user_by_email(db, email)

    # If user does not exist, login fails.
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password.
    password_is_correct = verify_password(form_data.password, user.hashed_password)

    # If password is wrong, login fails.
    if not password_is_correct:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token with email and user id.
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
        }
    )

    # Return token to frontend.
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.get("/auth/me", response_model=UserResponse)
def get_logged_in_user(current_user: UserModel = Depends(get_current_user)):
    # Return currently logged-in user from token.
    return current_user


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Return only tasks that belong to current logged-in user.
    return crud.get_all_tasks(db, current_user.id)


@app.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Create task for current logged-in user.
    return crud.create_task(db, task, current_user.id)


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Update only current user's task.
    return crud.update_task(db, task_id, task_update, current_user.id)


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Delete only current user's task.
    return crud.delete_task(db, task_id, current_user.id)