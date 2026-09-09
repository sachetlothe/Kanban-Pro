import { useDrag } from "react-dnd";
import { ItemTypes } from "../utils/dnd";

export const BacklogPanel = ({ cards, backlogBoardId, sprints, onAddCard, onEditCard, onAssignSprint, onPrioritize }) => (
  <section className="panel backlog-panel">
    <div className="section-head">
      <div>
        <p className="eyebrow">Backlog</p>
        <h3>Unassigned tasks</h3>
      </div>
      <button onClick={onAddCard}>+ Add backlog task</button>
    </div>

    <div className="backlog-list">
      {cards.map((card, index) => (
        <BacklogRow
          key={card._id}
          card={card}
          index={index}
          backlogBoardId={backlogBoardId}
          sprints={sprints}
          onEditCard={onEditCard}
          onAssignSprint={onAssignSprint}
          onPrioritize={onPrioritize}
        />
      ))}
      {cards.length === 0 ? <p className="muted">No backlog items match the current filters.</p> : null}
    </div>
  </section>
);

const BacklogRow = ({ card, index, backlogBoardId, sprints, onEditCard, onAssignSprint, onPrioritize }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    canDrag: Boolean(backlogBoardId),
    item: {
      cardId: card._id,
      boardId: backlogBoardId,
      index,
      sprintId: null,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <article ref={drag} className="backlog-row" style={{ opacity: isDragging ? 0.45 : 1 }}>
      <button type="button" className="ghost backlog-main" onClick={() => onEditCard(card)}>
        <strong>{card.title}</strong>
        <span className="muted">{card.description || "No description added yet."}</span>
      </button>
      <div className="backlog-row-meta">
        <span>{card.assignedTo?.name || "Unassigned"}</span>
        <span>{card.deadline ? new Date(card.deadline).toLocaleDateString() : "No deadline"}</span>
      </div>
      <div className="backlog-actions">
        <select value="" onChange={(event) => onAssignSprint(card, event.target.value)}>
          <option value="" disabled>
            Move to sprint
          </option>
          {sprints.map((sprint) => (
            <option key={sprint._id} value={sprint._id}>
              {sprint.name}
            </option>
          ))}
        </select>
        <button type="button" className="secondary" onClick={() => onPrioritize(card, -1)}>
          Up
        </button>
        <button type="button" className="secondary" onClick={() => onPrioritize(card, 1)}>
          Down
        </button>
      </div>
    </article>
  );
};
