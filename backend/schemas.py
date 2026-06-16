# Literal is used to allow only fixed values like "Low", "Medium", "High"
from typing import Literal

# BaseModel is used by FastAPI/Pydantic to validate request and response data
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    # Task title is required and should not be too long
    title: str = Field(min_length=1, max_length=100)

    # Deadline is optional
    deadline: str = Field(default="", max_length=50)

    # Priority can only be one of these three values
    priority: Literal["Low", "Medium", "High"] = "Medium"

    # Status can only be one of these three values
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"


class TaskUpdate(BaseModel):
    # All fields are optional because user may update only one field
    title: str | None = Field(default=None, min_length=1, max_length=100)
    deadline: str | None = Field(default=None, max_length=50)
    priority: Literal["Low", "Medium", "High"] | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None


class TaskResponse(BaseModel):
    # This is the response structure for tasks
    id: int
    title: str
    deadline: str
    priority: str
    status: str

    # Allows Pydantic to convert database objects into response objects
    model_config = {
        "from_attributes": True
    }


class UserCreate(BaseModel):
    # User name required during registration
    name: str = Field(min_length=1, max_length=100)

    # Email required during registration
    email: str = Field(min_length=5, max_length=150)

    # Password should have at least 6 characters
    password: str = Field(min_length=6, max_length=100)


class UserResponse(BaseModel):
    # This is the user data we safely return to frontend
    # Notice: password is NOT returned
    id: int
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class TokenResponse(BaseModel):
    # Access token is used by frontend after login
    access_token: str

    # Token type is normally "bearer"
    token_type: str