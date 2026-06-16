from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import crud
from database import Base, engine, get_db
from schemas import TaskCreate, TaskResponse, TaskUpdate


app = FastAPI(title="Student Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Student Task Manager API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return crud.get_all_tasks(db)


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db, task)


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
):
    return crud.update_task(db, task_id, task_update)


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    return crud.delete_task(db, task_id)