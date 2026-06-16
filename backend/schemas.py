from typing import Literal

from pydantic import BaseModel


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