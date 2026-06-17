# HTTPException sends proper backend errors.
from fastapi import HTTPException

# Session is database session type.
from sqlalchemy.orm import Session

# Database models.
from models import TaskModel, UserModel

# Data validation schemas.
from schemas import TaskCreate, TaskUpdate, UserCreate

# Password helper.
from auth import hash_password


def get_all_tasks(db: Session, user_id: int):
    # Get only tasks that belong to the logged-in user.
    return (
        db.query(TaskModel)
        .filter(TaskModel.user_id == user_id)
        .order_by(TaskModel.id)
        .all()
    )


def create_task(db: Session, task: TaskCreate, user_id: int):
    # Clean task title.
    cleaned_title = task.title.strip()

    # Backend validation.
    if cleaned_title == "":
        raise HTTPException(status_code=400, detail="Task title is required")

    # Create task and attach it to logged-in user using user_id.
    new_task = TaskModel(
        title=cleaned_title,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
        user_id=user_id,
    )

    # Save task in database.
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate, user_id: int):
    # Find task only if it belongs to current user.
    task = (
        db.query(TaskModel)
        .filter(TaskModel.id == task_id, TaskModel.user_id == user_id)
        .first()
    )

    # If task is not found, either it does not exist or belongs to another user.
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update title if provided.
    if task_update.title is not None:
        cleaned_title = task_update.title.strip()

        if cleaned_title == "":
            raise HTTPException(status_code=400, detail="Task title cannot be empty")

        task.title = cleaned_title

    # Update deadline if provided.
    if task_update.deadline is not None:
        task.deadline = task_update.deadline

    # Update priority if provided.
    if task_update.priority is not None:
        task.priority = task_update.priority

    # Update status if provided.
    if task_update.status is not None:
        task.status = task_update.status

    # Save update.
    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task_id: int, user_id: int):
    # Find task only if it belongs to current user.
    task = (
        db.query(TaskModel)
        .filter(TaskModel.id == task_id, TaskModel.user_id == user_id)
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete task.
    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }


def get_user_by_email(db: Session, email: str):
    # Search user by email.
    return db.query(UserModel).filter(UserModel.email == email).first()


def create_user(db: Session, user: UserCreate):
    # Clean name and email.
    cleaned_name = user.name.strip()
    cleaned_email = user.email.strip().lower()

    # Validate name.
    if cleaned_name == "":
        raise HTTPException(status_code=400, detail="Name is required")

    # Simple email validation.
    if "@" not in cleaned_email:
        raise HTTPException(status_code=400, detail="Enter a valid email")

    # Check duplicate email.
    existing_user = get_user_by_email(db, cleaned_email)

    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password before saving.
    hashed_password = hash_password(user.password)

    # Create user.
    new_user = UserModel(
        name=cleaned_name,
        email=cleaned_email,
        hashed_password=hashed_password,
    )

    # Save user.
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user