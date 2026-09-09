import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { projects, activeProjectId, setActiveProjectId, createProject } = useProjects();
  const [form, setForm] = useState({ name: "", description: "", color: "#2563eb" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    await createProject(form);
    setForm({ name: "", description: "", color: "#2563eb" });
  };

  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">Workspace</p>
        <h1>Kanban Pro</h1>
        <p className="muted">Visual planning with live collaboration.</p>
      </div>

      <section>
        <div className="section-head">
          <h2>Projects</h2>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <button
              key={project._id}
              className={`project-item ${activeProjectId === project._id ? "active" : ""}`}
              onClick={() => setActiveProjectId(project._id)}
            >
              <span className="swatch" style={{ background: project.color }} />
              <span>{project.name}</span>
            </button>
          ))}
        </div>
      </section>

      <form className="panel compact" onSubmit={handleSubmit}>
        <h3>Create project</h3>
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Project name"
        />
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description"
          rows="3"
        />
        <input
          type="color"
          value={form.color}
          onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
        />
        <button type="submit">Create</button>
      </form>

      <div className="panel compact">
        <h3>{user?.name}</h3>
        <p className="muted">{user?.email}</p>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
};
