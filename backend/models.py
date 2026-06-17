# ForeignKey is used to connect one table with another table.
# Here, each task will belong to one user.
from sqlalchemy import ForeignKey, String

# Mapped and mapped_column are used to define SQLAlchemy columns.
from sqlalchemy.orm import Mapped, mapped_column

# Base is used by SQLAlchemy to create database tables.
from database import Base


class UserModel(Base):
    # This creates a users table.
    __tablename__ = "users"

    # Unique id for every user.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # User's name.
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # User's email must be unique.
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)

    # We store only hashed password, never normal password.
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)


class TaskModel(Base):
    # This creates a tasks table.
    __tablename__ = "tasks"

    # Unique id for every task.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Task title.
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Deadline is stored as text for now.
    deadline: Mapped[str] = mapped_column(String(50), default="")

    # Priority: Low, Medium, High.
    priority: Mapped[str] = mapped_column(String(20), default="Medium")

    # Status: Pending, In Progress, Completed.
    status: Mapped[str] = mapped_column(String(30), default="Pending")

    # user_id connects this task to one user.
    # Example: user_id = 1 means this task belongs to user with id 1.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)