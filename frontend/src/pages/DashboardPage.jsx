import { useEffect, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ActivityFeed } from "../components/ActivityFeed.jsx";
import { BacklogPanel } from "../components/BacklogPanel.jsx";
import { BoardColumn } from "../components/BoardColumn.jsx";
import { CardModal } from "../components/CardModal.jsx";
import { InvitePanel } from "../components/InvitePanel.jsx";
import { MetricsBar } from "../components/MetricsBar.jsx";
import { SprintPanel } from "../components/SprintPanel.jsx";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";

export const DashboardPage = () => {
  const { user } = useAuth();
  const {
    projectView,
    activities,
    deleteProject,
    createBoard,
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    renameBoard,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    inviteMember,
    addComment,
  } = useProjects();
  const [modalState, setModalState] = useState({ open: false, boardId: "", card: null, defaultSprintId: "" });
  const [sprintFilter, setSprintFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const members = useMemo(() => {
    if (!projectView?.project) {
      return [];
    }
    return projectView.project.members || [];
  }, [projectView]);

  const sprints = projectView?.sprints || [];
  const sprintMap = useMemo(() => Object.fromEntries(sprints.map((sprint) => [sprint._id, sprint])), [sprints]);
  const activeSprint = useMemo(() => sprints.find((sprint) => sprint.status === "active"), [sprints]);
  const backlogBoard = useMemo(
    () => projectView?.boards.find((board) => board.name.toLowerCase().includes("backlog")),
    [projectView]
  );
  const canDeleteProject = projectView?.project?.owner?._id === user?._id;

  useEffect(() => {
    if (!projectView?.project) {
      setSprintFilter("");
      return;
    }

    const nextSprintFilter = activeSprint?._id || sprints[0]?._id || "";
    const sprintStillExists =
      sprintFilter === "active" || sprints.some((sprint) => sprint._id === sprintFilter);

    if (!sprintStillExists && nextSprintFilter !== sprintFilter) {
      setSprintFilter(nextSprintFilter);
    }
  }, [projectView, sprints, activeSprint, sprintFilter]);

  if (!projectView) {
    return <div className="empty-state">Create a project from the sidebar to get started.</div>;
  }

  const resolveSprintScope = () => {
    if (sprintFilter === "active") {
      return activeSprint?._id || "";
    }

    return sprintFilter;
  };

  const sprintScope = resolveSprintScope();
  const selectedSprint = sprints.find((sprint) => sprint._id === sprintScope) || activeSprint || null;
  const boardDragDisabled = memberFilter !== "all" || !sprintScope;

  const applyFilters = (cards) =>
    cards
      .filter((card) => {
        if (memberFilter !== "all" && card.assignedTo?._id !== memberFilter) {
          return false;
        }

        return true;
      })
      .map((card) => ({
        ...card,
        sprintName: card.sprintId ? sprintMap[card.sprintId]?.name : "",
      }));

  const boardCardsForSprint = (cards) =>
    applyFilters(cards).filter((card) => sprintScope && card.sprintId === sprintScope);

  const backlogCards = applyFilters(projectView.backlog || []).filter((card) => !card.sprintId);

  const filteredBoards = projectView.boards
    .filter((board) => board._id !== backlogBoard?._id)
    .filter((board, index, boards) => {
      const normalizedName = normalizeBoardName(board.name);
      return boards.findIndex((item) => normalizeBoardName(item.name) === normalizedName) === index;
    })
    .map((board) => ({
      ...board,
      cards: boardCardsForSprint(board.cards || []),
    }))
    .sort((left, right) => getBoardRank(left.name) - getBoardRank(right.name));
  const inProgressBoard = filteredBoards.find((board) => board.name.toLowerCase().includes("progress")) || filteredBoards[0];

  const openCreateCard = (boardId, defaultSprintId = "") =>
    setModalState({ open: true, boardId, card: null, defaultSprintId: defaultSprintId || "" });
  const openEditCard = (card) =>
    setModalState({ open: true, boardId: card.board, card, defaultSprintId: card.sprintId || "" });
  const closeModal = () => setModalState({ open: false, boardId: "", card: null, defaultSprintId: "" });

  const saveCard = async (payload) => {
    if (modalState.card?._id) {
      await updateCard(modalState.card._id, payload);
    } else {
      const targetBoardId =
        modalState.boardId === backlogBoard?._id && payload.sprintId && inProgressBoard?._id
          ? inProgressBoard._id
          : modalState.boardId;
      const nextPayload =
        targetBoardId === inProgressBoard?._id && payload.sprintId
          ? { ...payload, status: "in-progress" }
          : payload;

      await createCard(targetBoardId, nextPayload);
    }
    closeModal();
  };

  const assignBacklogCardToSprint = async (card, nextSprintId) => {
    if (!backlogBoard?._id || !inProgressBoard?._id) {
      await updateCard(card._id, { sprintId: nextSprintId });
      return;
    }

    const backlogCardsByOrder = (backlogBoard.cards || [])
      .filter((item) => !item.sprintId)
      .sort((left, right) => left.order - right.order);
    const sourceIndex = backlogCardsByOrder.findIndex((item) => item._id === card._id);
    const destinationIndex = (inProgressBoard.cards || []).length;

    if (sourceIndex < 0) {
      await updateCard(card._id, { sprintId: nextSprintId, status: "in-progress" });
      return;
    }

    await moveCard(card._id, {
      sourceBoardId: backlogBoard._id,
      destinationBoardId: inProgressBoard._id,
      sourceIndex,
      destinationIndex,
      sprintId: nextSprintId,
      status: "in-progress",
    });
  };

  const reprioritizeBacklogCard = async (card, direction) => {
    const board = backlogBoard;

    if (!board) {
      return;
    }

    const unsprintedBoardCards = (board.cards || [])
      .filter((item) => !item.sprintId)
      .sort((left, right) => left.order - right.order);
    const sourceIndex = unsprintedBoardCards.findIndex((item) => item._id === card._id);
    const destinationIndex = sourceIndex + direction;

    if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= unsprintedBoardCards.length) {
      return;
    }

    await moveCard(card._id, {
      sourceBoardId: board._id,
      destinationBoardId: board._id,
      sourceIndex,
      destinationIndex,
      sprintId: null,
      status: card.status,
    });
  };

  const handleDeleteProject = async () => {
    const projectName = projectView.project.name;
    const shouldDelete = window.confirm(`Delete "${projectName}" and all of its boards, cards, and activity?`);

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeletingProject(true);
      await deleteProject(projectView.project._id);
    } catch (error) {
      window.alert(error.response?.data?.message || "Could not delete the project.");
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard">
        <header className="hero panel">
          <div>
            <p className="eyebrow">Project hub</p>
            <h2>{projectView.project.name}</h2>
            <p>{projectView.project.description || "No description yet."}</p>
            {selectedSprint ? (
              <p className="muted">Board sprint: {selectedSprint.name}</p>
            ) : (
              <p className="muted">Create or select a sprint to start moving backlog work into the board.</p>
            )}
          </div>
          <div className="hero-actions">
            <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
              <option value="all">All team members</option>
              {members.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.name}
                </option>
              ))}
            </select>
            <button className="secondary" onClick={() => setMemberFilter("all")}>
              Reset filter
            </button>
            <button onClick={() => createBoard({ name: "New Board" })}>+ New board</button>
            {canDeleteProject ? (
              <button className="danger-button" type="button" onClick={handleDeleteProject} disabled={isDeletingProject}>
                {isDeletingProject ? "Deleting..." : "Delete project"}
              </button>
            ) : null}
          </div>
        </header>

        <MetricsBar metrics={projectView.metrics} />

        <SprintPanel
          sprints={sprints}
          sprintFilter={sprintFilter}
          onSelectFilter={setSprintFilter}
          onCreateSprint={createSprint}
          onUpdateSprint={updateSprint}
          onStartSprint={startSprint}
          onCompleteSprint={completeSprint}
        />

        <section className="content-grid">
          <div className="board-area board-layout">
            <BacklogPanel
              cards={backlogCards}
              backlogBoardId={backlogBoard?._id || ""}
              sprints={sprints.filter((sprint) => sprint.status !== "completed")}
              onAddCard={() => openCreateCard(backlogBoard?._id || projectView.boards[0]?._id || "", "")}
              onEditCard={openEditCard}
              onAssignSprint={assignBacklogCardToSprint}
              onPrioritize={reprioritizeBacklogCard}
            />

            <div className="boards-scroll">
              {filteredBoards.map((board) => (
                <BoardColumn
                  key={board._id}
                  board={board}
                  onCreateCard={openCreateCard}
                  onMoveCard={moveCard}
                  onRenameBoard={renameBoard}
                  onEditCard={openEditCard}
                  sprintScope={sprintScope}
                  dragDisabled={boardDragDisabled}
                />
              ))}
            </div>
          </div>

          <div className="side-area">
            <InvitePanel onInvite={inviteMember} />
            <section className="panel">
              <div className="section-head">
                <h3>Team</h3>
              </div>
              <div className="member-list">
                {projectView.project.members.map((member) => (
                  <div key={member.user._id} className="member-row">
                    <div>
                      <strong>{member.user.name}</strong>
                      <p className="muted">{member.user.email}</p>
                    </div>
                    <span className="badge neutral">{member.role}</span>
                  </div>
                ))}
              </div>
            </section>
            <ActivityFeed activities={activities} />
          </div>
        </section>

        <CardModal
          open={modalState.open}
          card={modalState.card}
          members={members}
          sprints={sprints.filter((sprint) => sprint.status !== "completed")}
          defaultSprintId={modalState.defaultSprintId}
          onClose={closeModal}
          onSave={saveCard}
          onDelete={async (cardId) => {
            await deleteCard(cardId);
            closeModal();
          }}
          onComment={addComment}
        />
      </div>
    </DndProvider>
  );
};

const getBoardRank = (boardName) => {
  const name = normalizeBoardName(boardName);

  if (name.includes("progress")) {
    return 1;
  }

  if (name.includes("review")) {
    return 2;
  }

  if (name.includes("done")) {
    return 3;
  }

  return 4;
};

const normalizeBoardName = (boardName) => boardName.toLowerCase().replace(/\s+/g, " ").trim();
