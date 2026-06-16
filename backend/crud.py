# HTTPException is used to send proper error responses to frontend
from fastapi import HTTPException

# Session is the database session type from SQLAlchemy
from sqlalchemy.orm import Session

# TaskModel is the database table model
from models import TaskModel

# TaskCreate and TaskUpdate define the valid task data shape
from schemas import TaskCreate, TaskUpdate


def get_all_tasks(db: Session):
    # Get all tasks from database and order them by id
    return db.query(TaskModel).order_by(TaskModel.id).all()


def create_task(db: Session, task: TaskCreate):
    # Remove extra spaces from title before saving
    cleaned_title = task.title.strip()

    # Extra backend safety check.
    # Even though frontend validates, backend must also validate.
    if cleaned_title == "":
        raise HTTPException(status_code=400, detail="Task title is required")

    # Create a new database task object
    new_task = TaskModel(
        title=cleaned_title,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
    )

    # Add task to database
    db.add(new_task)

    # Save changes permanently
    db.commit()

    # Refresh gets the generated id from database
    db.refresh(new_task)

    # Return newly created task
    return new_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate):
    # Find the task by id
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    # If task does not exist, return 404 error
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update title only if frontend sends title
    if task_update.title is not None:
        cleaned_title = task_update.title.strip()

        if cleaned_title == "":
            raise HTTPException(status_code=400, detail="Task title cannot be empty")

        task.title = cleaned_title

    # Update deadline only if frontend sends deadline
    if task_update.deadline is not None:
        task.deadline = task_update.deadline

    # Update priority only if frontend sends priority
    if task_update.priority is not None:
        task.priority = task_update.priority

    # Update status only if frontend sends status
    if task_update.status is not None:
        task.status = task_update.status

    # Save changes to database
    db.commit()

    # Refresh task after update
    db.refresh(task)

    # Return updated task
    return task


def delete_task(db: Session, task_id: int):
    # Find the task by id
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    # If task is not found, return 404 error
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete task from database
    db.delete(task)

    # Save delete operation
    db.commit()

    # Return success message
    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }