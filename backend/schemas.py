# Literal is used to allow only fixed values like "Low", "Medium", "High"
from typing import Literal

# BaseModel is used by FastAPI/Pydantic to validate request and response data
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    # Task title is required.
    # min_length=1 means at least 1 character is required.
    # max_length=100 prevents very long task titles.
    title: str = Field(min_length=1, max_length=100)

    # Deadline is optional, so default is empty string.
    deadline: str = Field(default="", max_length=50)

    # Priority can only be one of these three values.
    priority: Literal["Low", "Medium", "High"] = "Medium"

    # Status can only be one of these three values.
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"


class TaskUpdate(BaseModel):
    # All fields are optional because user may update only one field.
    title: str | None = Field(default=None, min_length=1, max_length=100)
    deadline: str | None = Field(default=None, max_length=50)
    priority: Literal["Low", "Medium", "High"] | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None


class TaskResponse(BaseModel):
    # This is the response structure that backend sends to frontend.
    id: int
    title: str
    deadline: str
    priority: str
    status: str

    # This allows Pydantic to convert SQLAlchemy database objects into response objects.
    model_config = {
        "from_attributes": True
    }