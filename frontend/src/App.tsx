import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import "./App.css";

/*
  Task type describes one complete task coming from backend.
  This includes id because database creates id for each task.
*/
type Task = {
  id: number;
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

/*
  TaskCreate type describes task data we send to backend
  when adding or editing a task.
*/
type TaskCreate = {
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

/*
  These are the filter options available in the app.
*/
type TaskFilter = "All" | "Pending" | "In Progress" | "Completed";

/*
  These are the sorting options available in the app.
*/
type SortOption = "Newest" | "Deadline" | "Priority High" | "Priority Low";

function App() {
  /*
    Backend connection message.
    Example: "Student Task Manager API is running"
  */
  const [apiMessage, setApiMessage] = useState("");

  /*
    tasks stores all tasks loaded from backend.
  */
  const [tasks, setTasks] = useState<Task[]>([]);

  /*
    loading becomes true while tasks are being fetched from backend.
  */
  const [loading, setLoading] = useState(false);

  /*
    These states store form input values.
  */
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [status, setStatus] = useState<Task["status"]>("Pending");

  /*
    editingTaskId tells us whether user is adding a new task or editing an existing task.
    null means add mode.
    number means edit mode.
  */
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  /*
    activeFilter controls which status filter is selected.
  */
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");

  /*
    searchText stores what user types in search box.
  */
  const [searchText, setSearchText] = useState("");

  /*
    sortOption stores selected sorting option.
  */
  const [sortOption, setSortOption] = useState<SortOption>("Newest");

  /*
    errorMessage is shown when something goes wrong.
    successMessage is shown when an action works.
  */
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Priority values help us sort High, Medium, Low.
    High should have highest value.
  */
  const priorityValue = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  /*
    This function converts deadline string into time number for sorting.
    If no deadline is selected, we push that task to the bottom.
  */
  function getDeadlineTime(taskDeadline: string) {
    if (!taskDeadline) {
      return Number.MAX_SAFE_INTEGER;
    }

    return new Date(taskDeadline).getTime();
  }

  /*
    Count values for dashboard cards.
  */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  /*
    First apply status filter.
  */
  const filteredTasks =
    activeFilter === "All"
      ? tasks
      : tasks.filter((task) => task.status === activeFilter);

  /*
    Then apply search filter.
    Search is case-insensitive because we use toLowerCase().
  */
  const searchedTasks = filteredTasks.filter((task) =>
    task.title.toLowerCase().includes(searchText.toLowerCase())
  );

  /*
    Then apply sorting.
    We copy searchedTasks using [...] so original tasks array is not modified directly.
  */
  const visibleTasks = [...searchedTasks].sort((taskA, taskB) => {
    if (sortOption === "Newest") {
      return taskB.id - taskA.id;
    }

    if (sortOption === "Deadline") {
      return getDeadlineTime(taskA.deadline) - getDeadlineTime(taskB.deadline);
    }

    if (sortOption === "Priority High") {
      return priorityValue[taskB.priority] - priorityValue[taskA.priority];
    }

    if (sortOption === "Priority Low") {
      return priorityValue[taskA.priority] - priorityValue[taskB.priority];
    }

    return 0;
  });

  /*
    useEffect runs once when page opens.
    It checks backend status and loads tasks.
  */
  useEffect(() => {
    fetchBackendStatus();
    fetchTasks();
  }, []);

  /*
    This function shows success message and clears error message.
  */
  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  /*
    This function shows error message and clears success message.
  */
  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
  }

  /*
    This function validates the task form before sending data to backend.
    It returns true if form is valid.
    It returns false if form has error.
  */
  function validateTaskForm() {
    const cleanedTitle = title.trim();

    if (cleanedTitle === "") {
      showError("Task title is required.");
      return false;
    }

    if (cleanedTitle.length > 100) {
      showError("Task title must be 100 characters or less.");
      return false;
    }

    if (deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(deadline);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        showError("Deadline cannot be in the past.");
        return false;
      }
    }

    return true;
  }

  /*
    This function gets backend status from FastAPI root route.
  */
  async function fetchBackendStatus() {
    try {
      const response = await fetch("http://127.0.0.1:8000/");
      const data = await response.json();
      setApiMessage(data.message);
    } catch {
      setApiMessage("Backend not connected");
    }
  }

  /*
    This function loads all tasks from backend database.
  */
  async function fetchTasks() {
    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:8000/tasks");

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch {
      showError("Could not load tasks from backend.");
    } finally {
      setLoading(false);
    }
  }

  /*
    This function clears the form and exits edit mode.
  */
  function resetForm() {
    setTitle("");
    setDeadline("");
    setPriority("Medium");
    setStatus("Pending");
    setEditingTaskId(null);
  }

  /*
    This function runs when user submits the form.
    It decides whether to add new task or save edited task.
  */
  async function handleSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateTaskForm()) {
      return;
    }

    if (editingTaskId === null) {
      await handleAddTask();
    } else {
      await handleSaveEditedTask();
    }
  }

  /*
    This function sends POST request to backend to create a new task.
  */
  async function handleAddTask() {
    const newTask: TaskCreate = {
      title: title.trim(),
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
      showSuccess("Task added successfully.");
    } catch {
      showError("Could not add task. Please try again.");
    }
  }

  /*
    This function starts edit mode.
    It fills the form with selected task details.
  */
  function handleStartEditing(task: Task) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDeadline(task.deadline);
    setPriority(task.priority);
    setStatus(task.status);
    setErrorMessage("");
    setSuccessMessage("");
  }

  /*
    This function sends PUT request to backend to update full task details.
  */
  async function handleSaveEditedTask() {
    if (editingTaskId === null) {
      return;
    }

    const updatedTaskData: TaskCreate = {
      title: title.trim(),
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
      showSuccess("Task updated successfully.");
    } catch {
      showError("Could not update task. Please try again.");
    }
  }

  /*
    This function updates only task status from the task card dropdown.
  */
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
      showSuccess("Task status updated.");
    } catch {
      showError("Could not update task status.");
    }
  }

  /*
    This function deletes a task from backend and frontend state.
  */
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

      showSuccess("Task deleted successfully.");
    } catch {
      showError("Could not delete task. Please try again.");
    }
  }

  return (
    <main className="app-container">
      <header className="app-header">
        <div>
          <h1>Student Task Manager</h1>
          <p className="subtitle">
            Plan your coursework, track deadlines, and stay organized in one place.
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

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

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

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span className="dashboard-number">{totalTasks}</span>
              <span className="dashboard-label">Total Tasks</span>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-number">{pendingTasks}</span>
              <span className="dashboard-label">Pending</span>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-number">{inProgressTasks}</span>
              <span className="dashboard-label">In Progress</span>
            </div>

            <div className="dashboard-card">
              <span className="dashboard-number">{completedTasks}</span>
              <span className="dashboard-label">Completed</span>
            </div>
          </div>

          <div className="search-box">
            <label>
              Search Tasks
              <input
                type="text"
                placeholder="Search by task title..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>
          </div>

          <div className="sort-box">
            <label>
              Sort Tasks
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                <option value="Newest">Newest first</option>
                <option value="Deadline">Deadline nearest first</option>
                <option value="Priority High">Priority high to low</option>
                <option value="Priority Low">Priority low to high</option>
              </select>
            </label>
          </div>

          <div className="filter-bar">
            <button
              className={
                activeFilter === "All"
                  ? "filter-button active-filter"
                  : "filter-button"
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
            Showing {visibleTasks.length} of {tasks.length} tasks
          </p>

          {loading ? (
            <p className="empty-message">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-message">No tasks added yet.</p>
          ) : visibleTasks.length === 0 ? (
            <p className="empty-message">No tasks found.</p>
          ) : (
            visibleTasks.map((task) => (
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