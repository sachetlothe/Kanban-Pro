import { useMemo, useState } from "react";

const emptyForm = {
  name: "",
  goal: "",
  startDate: "",
  endDate: "",
  status: "planned",
};

export const SprintPanel = ({
  sprints,
  sprintFilter,
  onSelectFilter,
  onCreateSprint,
  onUpdateSprint,
  onStartSprint,
  onCompleteSprint,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const activeSprint = useMemo(() => sprints.find((sprint) => sprint.status === "active"), [sprints]);

  const beginCreate = () => {
    setEditingSprintId("");
    setForm({
      ...emptyForm,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setIsCreating(true);
  };

  const beginEdit = (sprint) => {
    setIsCreating(false);
    setEditingSprintId(sprint._id);
    setForm({
      name: sprint.name || "",
      goal: sprint.goal || "",
      startDate: sprint.startDate ? sprint.startDate.slice(0, 10) : "",
      endDate: sprint.endDate ? sprint.endDate.slice(0, 10) : "",
      status: sprint.status || "planned",
    });
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingSprintId("");
    setForm(emptyForm);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editingSprintId) {
      await onUpdateSprint(editingSprintId, form);
    } else {
      await onCreateSprint(form);
    }
    resetForm();
  };

  return (
    <section className="panel sprint-panel">
      <div className="section-head sprint-head">
        <div>
          <p className="eyebrow">Sprint Management</p>
          <h3>Sprints</h3>
          <p className="muted sprint-copy">
            {activeSprint ? `Active sprint: ${activeSprint.name}` : "No sprint is currently active."}
          </p>
        </div>
        <div className="sprint-actions">
          <select value={sprintFilter} onChange={(event) => onSelectFilter(event.target.value)}>
            <option value="" disabled>
              Select sprint board
            </option>
            <option value="active">Active sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint._id} value={sprint._id}>
                {sprint.name}
              </option>
            ))}
          </select>
          <button onClick={beginCreate}>+ New sprint</button>
        </div>
      </div>

      {(isCreating || editingSprintId) ? (
        <form className="sprint-form" onSubmit={submit}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Sprint name"
            required
          />
          <input
            value={form.goal}
            onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
            placeholder="Sprint goal"
          />
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
          />
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <div className="inline-actions">
            <button type="submit">{editingSprintId ? "Save sprint" : "Create sprint"}</button>
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="sprint-list">
        {sprints.map((sprint) => (
          <article key={sprint._id} className="sprint-card">
            <div className="section-head">
              <div>
                <strong>{sprint.name}</strong>
                <p className="muted">{sprint.goal || "No sprint goal defined."}</p>
              </div>
              <span className={`badge ${sprint.status === "active" ? "in-progress" : sprint.status}`}>
                {sprint.status}
              </span>
            </div>
            <div className="sprint-meta">
              <span>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : "No start date"}</span>
              <span>{sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "No end date"}</span>
              <span>{sprint.cardCount || 0} tasks</span>
            </div>
            <div className="inline-actions">
              <button type="button" className="secondary" onClick={() => beginEdit(sprint)}>
                Edit
              </button>
              {sprint.status !== "active" ? (
                <button type="button" className="secondary" onClick={() => onStartSprint(sprint._id)}>
                  Start
                </button>
              ) : null}
              {sprint.status !== "completed" ? (
                <button type="button" className="secondary" onClick={() => onCompleteSprint(sprint._id)}>
                  Complete
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {sprints.length === 0 ? <p className="muted">Create your first sprint to start planning work.</p> : null}
      </div>
    </section>
  );
};
