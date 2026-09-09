import { useEffect, useState } from "react";

export const CardModal = ({
  open,
  card,
  members,
  sprints,
  defaultSprintId,
  onClose,
  onSave,
  onDelete,
  onComment,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    status: "pending",
    sprintId: "",
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!card) {
      setForm({
        title: "",
        description: "",
        assignedTo: "",
        deadline: "",
        status: "pending",
        sprintId: defaultSprintId || "",
      });
      return;
    }

    setForm({
      title: card.title || "",
      description: card.description || "",
      assignedTo: card.assignedTo?._id || "",
      deadline: card.deadline ? card.deadline.slice(0, 10) : "",
      status: card.status || "pending",
      sprintId: card.sprintId || defaultSprintId || "",
    });
  }, [card, defaultSprintId]);

  if (!open) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();
    await onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal panel" onClick={(event) => event.stopPropagation()}>
        <div className="section-head">
          <h3>{card?._id ? "Edit task" : "New task"}</h3>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Title"
            required
          />
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            rows="4"
          />
          <select
            value={form.assignedTo}
            onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user._id} value={member.user._id}>
                {member.user.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
          />
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="code-review">In Code Review</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={form.sprintId}
            onChange={(event) => setForm((current) => ({ ...current, sprintId: event.target.value }))}
          >
            <option value="">Backlog / No sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint._id} value={sprint._id}>
                {sprint.name}
              </option>
            ))}
          </select>
          <button type="submit">Save</button>
          {card?._id ? (
            <button type="button" className="secondary" onClick={() => onDelete(card._id)}>
              Delete
            </button>
          ) : null}
        </form>

        {card?._id ? (
          <div className="comments">
            <h4>Comments</h4>
            <div className="comment-list">
              {(card.comments || []).map((item) => (
                <div key={item._id} className="comment-item">
                  <strong>{item.author?.name || "Teammate"}</strong>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
            <form
              className="comment-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!comment.trim()) {
                  return;
                }
                await onComment(card._id, { message: comment });
                setComment("");
              }}
            >
              <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" />
              <button type="submit">Post</button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};
