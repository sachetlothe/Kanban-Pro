import { useDrag } from "react-dnd";
import { ItemTypes } from "../utils/dnd";

export const CardItem = ({ card, boardId, index, onEdit, dragDisabled = false }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    canDrag: !dragDisabled,
    item: {
      cardId: card._id,
      boardId,
      index,
      sprintId: card.sprintId || null,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <article
      ref={drag}
      className="card-item"
      style={{ opacity: isDragging ? 0.45 : 1, cursor: dragDisabled ? "pointer" : "grab" }}
      onClick={() => onEdit(card)}
    >
      <div className="card-header">
        <h4>{card.title}</h4>
        <span className={`badge ${card.status}`}>{card.status}</span>
      </div>
      <p>{card.description || "No description added yet."}</p>
      {card.sprintName ? (
        <div className="card-tags">
          <span className="badge neutral">{card.sprintName}</span>
        </div>
      ) : null}
      <div className="card-meta">
        <span>{card.assignedTo?.name || "Unassigned"}</span>
        <span>{card.deadline ? new Date(card.deadline).toLocaleDateString() : "No deadline"}</span>
      </div>
    </article>
  );
};
