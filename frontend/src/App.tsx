import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("Backend not connected"));
  }, []);

  return (
    <main className="app-container">
      <h1>Student Task Manager</h1>
      <p className="subtitle">Manage your study tasks, deadlines, and priorities.</p>

      <section className="status-card">
        <h2>Backend Status</h2>
        <p>{apiMessage}</p>
      </section>
    </main>
  );
}

export default App;