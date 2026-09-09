import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { Project } from "../models/Project.js";
import { logActivity } from "../services/activityService.js";
import { ensureProjectMember, getProjectSnapshot } from "../services/projectService.js";
import { emitProjectUpdate } from "../socket/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorResponse } from "../utils/errorResponse.js";

export const createCard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId);

  if (!board) {
    throw new ErrorResponse("Board not found", 404);
  }

  await ensureProjectMember(board.project, req.user._id);
  const payload = await normalizeCardPayload(req.body, board.project);
  const order = await Card.countDocuments({
    board: board._id,
    ...(payload.sprintId ? {} : { sprintId: null }),
  });

  const card = await Card.create({
    ...payload,
    project: board.project,
    board: board._id,
    order,
  });

  await logActivity({
    project: board.project,
    user: req.user._id,
    action: "created_card",
    meta: { title: card.title },
  });

  emitProjectUpdate(req.app.get("io"), board.project, await getProjectSnapshot(board.project));
  res.status(201).json({ card });
});

export const updateCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.cardId);

  if (!card) {
    throw new ErrorResponse("Card not found", 404);
  }

  await ensureProjectMember(card.project, req.user._id);
  const payload = await normalizeCardPayload(req.body, card.project);
  Object.assign(card, payload);
  await card.save();

  const populated = await card.populate("assignedTo", "name email role avatar");
  emitProjectUpdate(req.app.get("io"), card.project, await getProjectSnapshot(card.project));

  res.json({ card: populated });
});

export const deleteCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.cardId);

  if (!card) {
    throw new ErrorResponse("Card not found", 404);
  }

  await ensureProjectMember(card.project, req.user._id);
  await card.deleteOne();

  emitProjectUpdate(req.app.get("io"), card.project, await getProjectSnapshot(card.project));
  res.json({ message: "Card deleted" });
});

export const moveCard = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const { sourceBoardId, destinationBoardId, sourceIndex, destinationIndex, status, sprintId } = req.body;

  const card = await Card.findById(cardId);

  if (!card) {
    throw new ErrorResponse("Card not found", 404);
  }

  await ensureProjectMember(card.project, req.user._id);

  const normalizedSprintId = sprintId === "" ? null : sprintId;
  await validateSprint(card.project, normalizedSprintId);

  const sourceCards = await Card.find({
    board: sourceBoardId,
    ...(card.sprintId ? { sprintId: card.sprintId } : { sprintId: null }),
  }).sort({ order: 1 });
  const destinationCards =
    sourceBoardId === destinationBoardId
      && `${card.sprintId || ""}` === `${normalizedSprintId || ""}`
      ? sourceCards
      : await Card.find({
          board: destinationBoardId,
          ...(normalizedSprintId ? { sprintId: normalizedSprintId } : { sprintId: null }),
        }).sort({ order: 1 });

  const movingCard = sourceCards.find((item) => item._id.toString() === cardId);

  if (!movingCard) {
    throw new ErrorResponse("Card is not present in the source board", 400);
  }

  sourceCards.splice(sourceIndex, 1);
  sourceCards.forEach((item, index) => {
    item.order = index;
  });

  const targetList =
    sourceBoardId === destinationBoardId && `${card.sprintId || ""}` === `${normalizedSprintId || ""}`
      ? sourceCards
      : destinationCards.filter((item) => item._id.toString() !== cardId);
  movingCard.board = destinationBoardId;
  movingCard.order = destinationIndex;
  movingCard.status = status || movingCard.status;
  movingCard.sprintId = normalizedSprintId;
  targetList.splice(destinationIndex, 0, movingCard);
  targetList.forEach((item, index) => {
    item.order = index;
  });

  await Promise.all([
    ...sourceCards.map((item) => item.save()),
    ...targetList.map((item) => item.save()),
  ]);

  await logActivity({
    project: card.project,
    user: req.user._id,
    action: "moved_card",
    meta: { title: movingCard.title, destinationBoardId, destinationIndex },
  });

  const snapshot = await getProjectSnapshot(card.project);
  emitProjectUpdate(req.app.get("io"), card.project, snapshot);
  res.json(snapshot);
});

export const addComment = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.cardId);

  if (!card) {
    throw new ErrorResponse("Card not found", 404);
  }

  await ensureProjectMember(card.project, req.user._id);

  if (!req.body.message) {
    throw new ErrorResponse("Comment message is required", 400);
  }

  card.comments.push({
    author: req.user._id,
    message: req.body.message,
  });
  await card.save();

  const populated = await card.populate("comments.author", "name email avatar");
  emitProjectUpdate(req.app.get("io"), card.project, await getProjectSnapshot(card.project));
  res.status(201).json({ card: populated });
});

const normalizeCardPayload = async (payload, projectId) => {
  const normalized = { ...payload };

  if (Object.prototype.hasOwnProperty.call(normalized, "assignedTo") && !normalized.assignedTo) {
    normalized.assignedTo = null;
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "deadline") && !normalized.deadline) {
    normalized.deadline = null;
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "sprintId") && normalized.sprintId === "") {
    normalized.sprintId = null;
  }

  await validateSprint(projectId, normalized.sprintId);
  return normalized;
};

const validateSprint = async (projectId, sprintId) => {
  if (!sprintId) {
    return;
  }

  const project = await Project.findById(projectId);
  
  if (!project) {
    throw new ErrorResponse("Project not found", 404);
  }

  const sprint = project.sprints.id(sprintId);

  if (!sprint) {
    throw new ErrorResponse("Sprint not found", 404);
  }
};
