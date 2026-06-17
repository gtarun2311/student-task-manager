import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import "./App.css";

/*
  Task type describes one complete task coming from backend.
*/
type Task = {
  id: number;
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

/*
  TaskCreate type is used when sending task data to backend.
*/
type TaskCreate = {
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
};

/*
  AuthMode controls whether user sees Login form or Register form.
*/
type AuthMode = "login" | "register";

/*
  Filter options for tasks.
*/
type TaskFilter = "All" | "Pending" | "In Progress" | "Completed";

/*
  Sorting options for tasks.
*/
type SortOption = "Newest" | "Deadline" | "Priority High" | "Priority Low";

function App() {
  /*
    Auth token is saved in localStorage so user stays logged in after refresh.
  */
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || ""
  );

  /*
    We store email only to show who is logged in.
    Day 17 will improve this with real user-specific tasks.
  */
  const [loggedInEmail, setLoggedInEmail] = useState(
    localStorage.getItem("loggedInEmail") || ""
  );

  /*
    authMode decides whether login form or register form is visible.
  */
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  /*
    Login form states.
  */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /*
    Register form states.
  */
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  /*
    Backend connection message.
  */
  const [apiMessage, setApiMessage] = useState("");

  /*
    tasks stores all tasks loaded from backend.
  */
  const [tasks, setTasks] = useState<Task[]>([]);

  /*
    loading becomes true while tasks are loading.
  */
  const [loading, setLoading] = useState(false);

  /*
    Task form input states.
  */
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [status, setStatus] = useState<Task["status"]>("Pending");

  /*
    editingTaskId tells whether we are editing a task.
    null means we are adding a new task.
  */
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  /*
    Filter, search, and sort states.
  */
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("Newest");

  /*
    Error and success messages shown inside the app.
  */
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    This checks whether user is logged in.
  */
  const isAuthenticated = authToken !== "";

  /*
    Priority values help sorting by priority.
  */
  const priorityValue = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  /*
    Convert deadline to time number for sorting.
    If deadline is empty, task goes to the bottom.
  */
  function getDeadlineTime(taskDeadline: string) {
    if (!taskDeadline) {
      return Number.MAX_SAFE_INTEGER;
    }

    return new Date(taskDeadline).getTime();
  }

  /*
    Dashboard counts.
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
    First filter tasks by status.
  */
  const filteredTasks =
    activeFilter === "All"
      ? tasks
      : tasks.filter((task) => task.status === activeFilter);

  /*
    Then filter tasks by search text.
  */
  const searchedTasks = filteredTasks.filter((task) =>
    task.title.toLowerCase().includes(searchText.toLowerCase())
  );

  /*
    Then sort the visible tasks.
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
    This runs when page opens.
    It checks backend status.
    If user is logged in, it also loads tasks.
  */
  useEffect(() => {
    fetchBackendStatus();

    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  /*
    Show success message and clear error message.
  */
  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  /*
    Show error message and clear success message.
  */
  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
  }

  /*
    This helper reads backend error response.
    It makes error messages more useful.
  */
  async function getBackendErrorMessage(response: Response) {
    try {
      const data = await response.json();

      if (typeof data.detail === "string") {
        return data.detail;
      }

      return "Something went wrong.";
    } catch {
      return "Something went wrong.";
    }
  }

  /*
    Validate login form before calling backend.
  */
  function validateLoginForm() {
    if (loginEmail.trim() === "") {
      showError("Email is required.");
      return false;
    }

    if (loginPassword.trim() === "") {
      showError("Password is required.");
      return false;
    }

    return true;
  }

  /*
    Validate register form before calling backend.
  */
  function validateRegisterForm() {
    if (registerName.trim() === "") {
      showError("Name is required.");
      return false;
    }

    if (!registerEmail.includes("@")) {
      showError("Please enter a valid email.");
      return false;
    }

    if (registerPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  }

  /*
    Register user using POST /auth/register.
  */
  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim().toLowerCase(),
          password: registerPassword,
        }),
      });

      if (!response.ok) {
        const message = await getBackendErrorMessage(response);
        throw new Error(message);
      }

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");

      setAuthMode("login");
      showSuccess("Account created successfully. Please login now.");
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Could not create account.");
      }
    }
  }

  /*
    Login user using POST /auth/login.
    FastAPI OAuth2PasswordRequestForm expects form data,
    not JSON. That is why we use URLSearchParams.
  */
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    try {
      const loginFormData = new URLSearchParams();

      /*
        Backend expects username field.
        We are using username as email.
      */
      loginFormData.append("username", loginEmail.trim().toLowerCase());
      loginFormData.append("password", loginPassword);

      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: loginFormData,
      });

      if (!response.ok) {
        const message = await getBackendErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json();

      /*
        Save token and email in browser localStorage.
      */
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("loggedInEmail", loginEmail.trim().toLowerCase());

      setAuthToken(data.access_token);
      setLoggedInEmail(loginEmail.trim().toLowerCase());

      setLoginEmail("");
      setLoginPassword("");

      showSuccess("Logged in successfully.");
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Could not login.");
      }
    }
  }

  /*
    Logout clears token from state and localStorage.
  */
  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInEmail");

    setAuthToken("");
    setLoggedInEmail("");
    setTasks([]);

    showSuccess("Logged out successfully.");
  }

  /*
    Get backend status from root route.
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
    Load tasks from backend.
    Day 17 will send auth token and load only current user's tasks.
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
    Validate task form.
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
    Clear task form and exit edit mode.
  */
  function resetForm() {
    setTitle("");
    setDeadline("");
    setPriority("Medium");
    setStatus("Pending");
    setEditingTaskId(null);
  }

  /*
    Submit task form.
    It decides whether to add or edit task.
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
    Add new task using backend API.
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
    Start edit mode by filling form with task details.
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
    Save edited task using PUT API.
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
    Update only task status from task card dropdown.
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
    Delete task using DELETE API.
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

  /*
    If user is not logged in, show login/register page.
  */
  if (!isAuthenticated) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Student Task Manager</h1>
          <p className="subtitle">
            Login or create an account to manage your study tasks.
          </p>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "auth-tab active-auth-tab" : "auth-tab"}
              onClick={() => {
                setAuthMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Login
            </button>

            <button
              className={
                authMode === "register" ? "auth-tab active-auth-tab" : "auth-tab"
              }
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Register
            </button>
          </div>

          {authMode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>

              <button type="submit">Login</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                Name
                <input
                  type="text"
                  placeholder="Sunny"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                />
              </label>

              <button type="submit">Create Account</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  /*
    If user is logged in, show task manager app.
  */
  return (
    <main className="app-container">
      <header className="app-header">
        <div>
          <h1>Student Task Manager</h1>
          <p className="subtitle">
            Plan your coursework, track deadlines, and stay organized in one place.
          </p>
          <p className="logged-in-text">Logged in as {loggedInEmail}</p>
        </div>

        <section className="status-card">
          <h2>Backend Status</h2>
          <p>{apiMessage}</p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
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