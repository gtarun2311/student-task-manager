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

function App() {
  const [apiMessage, setApiMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [status, setStatus] = useState<Task["status"]>("Pending");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("Backend not connected"));
  }, []);

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim() === "") {
      alert("Please enter a task title");
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title,
      deadline,
      priority,
      status,
    };

    setTasks([...tasks, newTask]);

    setTitle("");
    setDeadline("");
    setPriority("Medium");
    setStatus("Pending");
  }

  function handleDeleteTask(taskId: number) {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
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

          {tasks.length === 0 ? (
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