from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import TaskModel
from schemas import TaskCreate, TaskUpdate


def get_all_tasks(db: Session):
    return db.query(TaskModel).order_by(TaskModel.id).all()


def create_task(db: Session, task: TaskCreate):
    if task.title.strip() == "":
        raise HTTPException(status_code=400, detail="Task title is required")

    new_task = TaskModel(
        title=task.title,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.title is not None:
        if task_update.title.strip() == "":
            raise HTTPException(status_code=400, detail="Task title cannot be empty")
        task.title = task_update.title

    if task_update.deadline is not None:
        task.deadline = task_update.deadline

    if task_update.priority is not None:
        task.priority = task_update.priority

    if task_update.status is not None:
        task.status = task_update.status

    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task_id: int):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }