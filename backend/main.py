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


class TaskUpdate(BaseModel):
    title: str | None = None
    deadline: str | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None


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


@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate):
    for index, task in enumerate(tasks):
        if task.id == task_id:
            updated_title = task_update.title if task_update.title is not None else task.title
            updated_deadline = task_update.deadline if task_update.deadline is not None else task.deadline
            updated_priority = task_update.priority if task_update.priority is not None else task.priority
            updated_status = task_update.status if task_update.status is not None else task.status

            if updated_title.strip() == "":
                raise HTTPException(status_code=400, detail="Task title cannot be empty")

            updated_task = Task(
                id=task.id,
                title=updated_title,
                deadline=updated_deadline,
                priority=updated_priority,
                status=updated_status,
            )

            tasks[index] = updated_task
            return updated_task

    raise HTTPException(status_code=404, detail="Task not found")


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