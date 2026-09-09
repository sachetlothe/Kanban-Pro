import { useDrop } from "react-dnd";
import { ItemTypes } from "../utils/dnd";
import { CardItem } from "./CardItem.jsx";

export const BoardColumn = ({
  board,
  onCreateCard,
  onMoveCard,
  onRenameBoard,
  onEditCard,
  sprintScope,
  dragDisabled = false,
}) => {
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      if (dragDisabled) {
        return;
      }

      if (board.cards.length !== 0) {
        return;
      }
      onMoveCard(item.cardId, {
        sourceBoardId: item.boardId,
        destinationBoardId: board._id,
        sourceIndex: item.index,
        destinationIndex: 0,
        sprintId: sprintScope === undefined ? item.sprintId : sprintScope,
        status: getStatusFromBoard(),
      });
    },
  });

  const getStatusFromBoard = () =>
    board.name.toLowerCase().includes("done")
      ? "completed"
      : board.name.toLowerCase().includes("review")
        ? "code-review"
      : board.name.toLowerCase().includes("progress")
        ? "in-progress"
        : "pending";

  return (
    <section ref={drop} className="board-column panel">
      <div className="section-head">
        <input
          className="board-title-input"
          defaultValue={board.name}
          onBlur={(event) => onRenameBoard(board._id, { name: event.target.value })}
        />
      </div>

      <div className="card-stack">
        <DropSlot
          board={board}
          index={0}
          onMoveCard={onMoveCard}
          getStatusFromBoard={getStatusFromBoard}
          sprintScope={sprintScope}
          dragDisabled={dragDisabled}
        />
        {board.cards.map((card, index) => (
          <div key={card._id}>
            <CardItem card={card} boardId={board._id} index={index} onEdit={onEditCard} dragDisabled={dragDisabled} />
            <DropSlot
              board={board}
              index={index + 1}
              onMoveCard={onMoveCard}
              getStatusFromBoard={getStatusFromBoard}
              sprintScope={sprintScope}
              dragDisabled={dragDisabled}
            />
          </div>
        ))}
      </div>

      <button className="secondary" onClick={() => onCreateCard(board._id, sprintScope)}>
        + Add card
      </button>
    </section>
  );
};

const DropSlot = ({ board, index, onMoveCard, getStatusFromBoard, sprintScope, dragDisabled }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      if (dragDisabled) {
        return;
      }

      if (item.boardId === board._id && item.index === index) {
        return;
      }

      onMoveCard(item.cardId, {
        sourceBoardId: item.boardId,
        destinationBoardId: board._id,
        sourceIndex: item.index,
        destinationIndex: index,
        sprintId: sprintScope === undefined ? item.sprintId : sprintScope,
        status: getStatusFromBoard(),
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return <div ref={drop} className={`drop-slot ${isOver ? "active" : ""}`} />;
};
