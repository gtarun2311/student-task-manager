# Depends is used for database dependency injection
from fastapi import Depends, FastAPI, HTTPException

# OAuth2PasswordRequestForm is used for login form in FastAPI docs
from fastapi.security import OAuth2PasswordRequestForm

# CORS allows frontend to call backend
from fastapi.middleware.cors import CORSMiddleware

# Session is SQLAlchemy database session type
from sqlalchemy.orm import Session

# CRUD functions
import crud

# Password verification and token creation helpers
from auth import create_access_token, verify_password

# Database setup
from database import Base, engine, get_db

# Request/response schemas
from schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TokenResponse,
    UserCreate,
    UserResponse,
)


app = FastAPI(title="Student Task Manager API")


# Allows React frontend to access FastAPI backend
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


# Creates database tables if they do not already exist
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    # Simple backend status route
    return {"message": "Student Task Manager API is running"}


@app.get("/health")
def health_check():
    # Health check route
    return {"status": "ok"}


@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Register a new user
    return crud.create_user(db, user)


@app.post("/auth/login", response_model=TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):


    # Convert entered email to lowercase
    email = form_data.username.strip().lower()

    # Find user by email
    user = crud.get_user_by_email(db, email)

    # If user does not exist, login should fail
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check password
    password_is_correct = verify_password(form_data.password, user.hashed_password)

    # If password is wrong, login should fail
    if not password_is_correct:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token with user id and email
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
        }
    )

    # Return token to frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    # Get all tasks from database
    return crud.get_all_tasks(db)


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    # Create a new task
    return crud.create_task(db, task)


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
):
    # Update existing task
    return crud.update_task(db, task_id, task_update)


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    # Delete existing task
    return crud.delete_task(db, task_id)