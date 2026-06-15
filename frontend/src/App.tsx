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

function App() {
  const [apiMessage, setApiMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [status, setStatus] = useState<Task["status"]>("Pending");

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

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim() === "") {
      alert("Please enter a task title");
      return;
    }

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

      setTitle("");
      setDeadline("");
      setPriority("Medium");
      setStatus("Pending");
    } catch {
      alert("Could not add task");
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
        <form className="task-form" onSubmit={handleAddTask}>
          <h2>Add New Task</h2>

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

          <button type="submit">Add Task</button>
        </form>

        <div className="task-list">
          <h2>Your Tasks</h2>

          {loading ? (
            <p className="empty-message">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-message">No tasks added yet.</p>
          ) : (
            tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>Deadline: {task.deadline || "No deadline selected"}</p>
                  <p>Priority: {task.priority}</p>
                  <p>Status: {task.status}</p>
                </div>

                <button
                  className="delete-button"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default App;