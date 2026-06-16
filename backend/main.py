from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import TaskModel


app = FastAPI(title="Student Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


class TaskCreate(BaseModel):
    title: str
    deadline: str = ""
    priority: Literal["Low", "Medium", "High"] = "Medium"
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"


class TaskUpdate(BaseModel):
    title: str | None = None
    deadline: str | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    deadline: str
    priority: str
    status: str

    model_config = {
        "from_attributes": True
    }


@app.get("/")
def root():
    return {"message": "Student Task Manager API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(TaskModel).order_by(TaskModel.id).all()
    return tasks


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
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


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
):
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


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }