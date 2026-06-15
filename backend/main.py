from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Student Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskCreate(BaseModel):
    title: str
    deadline: str = ""
    priority: Literal["Low", "Medium", "High"] = "Medium"
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"


class Task(TaskCreate):
    id: int


tasks: list[Task] = []
next_task_id = 1


@app.get("/")
def root():
    return {"message": "Student Task Manager API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/tasks", response_model=list[Task])
def get_tasks():
    return tasks


@app.post("/tasks", response_model=Task)
def create_task(task: TaskCreate):
    global next_task_id

    if task.title.strip() == "":
        raise HTTPException(status_code=400, detail="Task title is required")

    new_task = Task(
        id=next_task_id,
        title=task.title,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
    )

    tasks.append(new_task)
    next_task_id += 1

    return new_task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for index, task in enumerate(tasks):
        if task.id == task_id:
            deleted_task = tasks.pop(index)
            return {
                "message": "Task deleted successfully",
                "task": deleted_task,
            }

    raise HTTPException(status_code=404, detail="Task not found")