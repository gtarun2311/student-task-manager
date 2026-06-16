# HTTPException is used to send proper error responses to frontend
from fastapi import HTTPException

# Session is the database session type from SQLAlchemy
from sqlalchemy.orm import Session

# Database models
from models import TaskModel, UserModel

# Pydantic schemas
from schemas import TaskCreate, TaskUpdate, UserCreate

# Password helper function
from auth import hash_password


def get_all_tasks(db: Session):
    # Get all tasks from database and order them by id
    return db.query(TaskModel).order_by(TaskModel.id).all()


def create_task(db: Session, task: TaskCreate):
    # Remove extra spaces from title before saving
    cleaned_title = task.title.strip()

    # Backend validation
    if cleaned_title == "":
        raise HTTPException(status_code=400, detail="Task title is required")

    # Create new task database object
    new_task = TaskModel(
        title=cleaned_title,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
    )

    # Save task to database
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate):
    # Find task by id
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update title only if frontend sends title
    if task_update.title is not None:
        cleaned_title = task_update.title.strip()

        if cleaned_title == "":
            raise HTTPException(status_code=400, detail="Task title cannot be empty")

        task.title = cleaned_title

    # Update deadline only if sent
    if task_update.deadline is not None:
        task.deadline = task_update.deadline

    # Update priority only if sent
    if task_update.priority is not None:
        task.priority = task_update.priority

    # Update status only if sent
    if task_update.status is not None:
        task.status = task_update.status

    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task_id: int):
    # Find task by id
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }


def get_user_by_email(db: Session, email: str):
    # Search user by email
    return db.query(UserModel).filter(UserModel.email == email).first()


def create_user(db: Session, user: UserCreate):
    # Clean name and email
    cleaned_name = user.name.strip()
    cleaned_email = user.email.strip().lower()

    # Check empty name
    if cleaned_name == "":
        raise HTTPException(status_code=400, detail="Name is required")

    # Basic email check
    if "@" not in cleaned_email:
        raise HTTPException(status_code=400, detail="Enter a valid email")

    # Check if email is already registered
    existing_user = get_user_by_email(db, cleaned_email)

    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password before saving
    hashed_password = hash_password(user.password)

    # Create user database object
    new_user = UserModel(
        name=cleaned_name,
        email=cleaned_email,
        hashed_password=hashed_password,
    )

    # Save user to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user