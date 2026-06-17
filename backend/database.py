# os is used to read environment variables.
# Environment variables help us change database location inside Docker.
import os

# create_engine creates the connection between SQLAlchemy and SQLite.
from sqlalchemy import create_engine

# declarative_base is used to create database models.
from sqlalchemy.orm import declarative_base

# sessionmaker is used to create database sessions.
from sqlalchemy.orm import sessionmaker


# DATABASE_URL decides where the database is stored.
# Normal local run uses student_tasks.db in backend folder.
# Docker run can use a different database path using environment variable.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./student_tasks.db")


# SQLite needs this special setting when used with FastAPI.
connect_args = {}

# If we are using SQLite, add check_same_thread=False.
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}


# Create database engine.
engine = create_engine(DATABASE_URL, connect_args=connect_args)


# Create database session class.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base is used by models.py to create database tables.
Base = declarative_base()


def get_db():
    # Create a new database session.
    db = SessionLocal()

    try:
        # Give database session to the API route.
        yield db
    finally:
        # Close database session after request is finished.
        db.close()