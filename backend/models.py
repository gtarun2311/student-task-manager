from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class TaskModel(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    deadline: Mapped[str] = mapped_column(String(50), default="")
    priority: Mapped[str] = mapped_column(String(20), default="Medium")
    status: Mapped[str] = mapped_column(String(30), default="Pending")