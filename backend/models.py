# String is used for text columns in the database
from sqlalchemy import String

# Mapped and mapped_column are used to define SQLAlchemy table columns
from sqlalchemy.orm import Mapped, mapped_column

# Base comes from database.py and is used to create database models/tables
from database import Base


class TaskModel(Base):
    # This creates a table named "tasks"
    __tablename__ = "tasks"

    # Primary key means unique id for every task
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Task title column
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Deadline column, stored as text for now
    deadline: Mapped[str] = mapped_column(String(50), default="")

    # Priority column: Low, Medium, High
    priority: Mapped[str] = mapped_column(String(20), default="Medium")

    # Status column: Pending, In Progress, Completed
    status: Mapped[str] = mapped_column(String(30), default="Pending")


class UserModel(Base):
    # This creates a table named "users"
    __tablename__ = "users"

    # Unique id for every user
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # User name
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Email should be unique because one email = one account
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)

    # We never store normal password.
    # We only store hashed password.
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)