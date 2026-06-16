import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import "./App.css";

type Task = {
  id: number;
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

type TaskCreate = {
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

type TaskFilter = "All" | "Pending" | "In Progress" | "Completed";

function App() {
  const [apiMessage, setApiMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [status, setStatus] = useState<Task["status"]>("Pending");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");

  const filteredTasks =
    activeFilter === "All"
      ? tasks
      : tasks.filter((task) => task.status === activeFilter);

  useEffect(() => {
    fetchBackendStatus();
    fetchTasks();
  }, []);

  async function fetchBackendStatus() {
    try {
      const response = await fetch("http://127.0.0.1:8000/");
      const data = await response.json();
      setApiMessage(data.message);
    } catch {
      setApiMessage("Backend not connected");
    }
  }

  async function fetchTasks() {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/tasks");
      const data = await response.json();
      setTasks(data);
    } catch {
      alert("Could not load tasks from backend");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDeadline("");
    setPriority("Medium");
    setStatus("Pending");
    setEditingTaskId(null);
  }

  async function handleSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim() === "") {
      alert("Please enter a task title");
      return;
    }

    if (editingTaskId === null) {
      await handleAddTask();
    } else {
      await handleSaveEditedTask();
    }
  }

  async function handleAddTask() {
    const newTask: TaskCreate = {
      title,
      deadline,
      priority,
      status,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const createdTask = await response.json();
      setTasks([...tasks, createdTask]);
      resetForm();
    } catch {
      alert("Could not add task");
    }
  }

  function handleStartEditing(task: Task) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDeadline(task.deadline);
    setPriority(task.priority);
    setStatus(task.status);
  }

  async function handleSaveEditedTask() {
    if (editingTaskId === null) {
      return;
    }

    const updatedTaskData: TaskCreate = {
      title,
      deadline,
      priority,
      status,
    };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/tasks/${editingTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTaskData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      const updatedTasks = tasks.map((task) =>
        task.id === editingTaskId ? updatedTask : task
      );

      setTasks(updatedTasks);
      resetForm();
    } catch {
      alert("Could not update task");
    }
  }

  async function handleUpdateTaskStatus(
    taskId: number,
    newStatus: Task["status"]
  ) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const updatedTask = await response.json();

      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? updatedTask : task
      );

      setTasks(updatedTasks);
    } catch {
      alert("Could not update task status");
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);

      if (editingTaskId === taskId) {
        resetForm();
      }
    } catch {
      alert("Could not delete task");
    }
  }

  return (
    <main className="app-container">
      <header className="app-header">
        <div>
          <h1>Student Task Manager</h1>
          <p className="subtitle">
            Manage your study tasks, deadlines, priorities, and progress.
          </p>
        </div>

        <section className="status-card">
          <h2>Backend Status</h2>
          <p>{apiMessage}</p>
        </section>
      </header>

      <section className="task-section">
        <form className="task-form" onSubmit={handleSubmitTask}>
          <h2>{editingTaskId === null ? "Add New Task" : "Edit Task"}</h2>

          <label>
            Task Title
            <input
              type="text"
              placeholder="Example: Complete software assignment"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label>
            Deadline
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Task["priority"])
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Task["status"])
              }
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <button type="submit">
            {editingTaskId === null ? "Add Task" : "Save Changes"}
          </button>

          {editingTaskId !== null && (
            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <div className="task-list">
          <h2>Your Tasks</h2>

          <div className="filter-bar">
            <button
              className={
                activeFilter === "All" ? "filter-button active-filter" : "filter-button"
              }
              onClick={() => setActiveFilter("All")}
            >
              All
            </button>

            <button
              className={
                activeFilter === "Pending"
                  ? "filter-button active-filter"
                  : "filter-button"
              }
              onClick={() => setActiveFilter("Pending")}
            >
              Pending
            </button>

            <button
              className={
                activeFilter === "In Progress"
                  ? "filter-button active-filter"
                  : "filter-button"
              }
              onClick={() => setActiveFilter("In Progress")}
            >
              In Progress
            </button>

            <button
              className={
                activeFilter === "Completed"
                  ? "filter-button active-filter"
                  : "filter-button"
              }
              onClick={() => setActiveFilter("Completed")}
            >
              Completed
            </button>
          </div>

          <p className="filter-summary">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>

          {loading ? (
            <p className="empty-message">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-message">No tasks added yet.</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-message">No tasks found for this filter.</p>
          ) : (
            filteredTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>Deadline: {task.deadline || "No deadline selected"}</p>
                  <p>Priority: {task.priority}</p>

                  <label className="task-status-control">
                    Status
                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(event) =>
                        handleUpdateTaskStatus(
                          task.id,
                          event.target.value as Task["status"]
                        )
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>
                </div>

                <div className="task-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleStartEditing(task)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default App;