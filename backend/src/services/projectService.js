import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { Project } from "../models/Project.js";
import { ErrorResponse } from "../utils/errorResponse.js";

export const ensureProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate("members.user", "name email role avatar")
    .populate("owner", "name email role avatar");

  if (!project) {
    throw new ErrorResponse("Project not found", 404);
  }

  const isOwner = project.owner._id.toString() === userId.toString();
  const isMember = project.members.some(
    (member) => member.user._id.toString() === userId.toString()
  );

  if (!isOwner && !isMember) {
    throw new ErrorResponse("Access denied for this project", 403);
  }

  return project;
};

export const getProjectSnapshot = async (projectId) => {
  await ensureDefaultBoards(projectId);

  const [project, boards, cards] = await Promise.all([
    Project.findById(projectId)
      .populate("owner", "name email role avatar")
      .populate("members.user", "name email role avatar"),
    Board.find({ project: projectId }).sort({ order: 1 }),
    Card.find({ project: projectId })
      .sort({ order: 1 })
      .populate("assignedTo", "name email role avatar")
      .populate("comments.author", "name email avatar"),
  ]);

  if (!project) {
    throw new ErrorResponse("Project not found", 404);
  }

  const backlogBoard = boards.find((board) => board.name.toLowerCase().includes("backlog"));

  return {
    project,
    sprints: buildSprintSummary(project.sprints || [], cards),
    backlog: buildBacklog(cards, backlogBoard?._id),
    boards: boards.map((board) => ({
      ...board.toObject(),
      cards: cards.filter((card) => card.board.toString() === board._id.toString()),
    })),
    metrics: buildMetrics(cards, boards, backlogBoard?._id),
  };
};

const ensureDefaultBoards = async (projectId) => {
  const requiredBoards = ["Backlog", "In Progress", "In Code Review", "Done"];
  const boards = await Board.find({ project: projectId }).sort({ order: 1 });
  const boardNames = new Set(boards.map((board) => board.name.toLowerCase()));
  const missingBoards = requiredBoards.filter((boardName) => !boardNames.has(boardName.toLowerCase()));

  if (missingBoards.length === 0) {
    return;
  }

  const existingCount = boards.length;
  await Board.insertMany(
    missingBoards.map((boardName, index) => ({
      name: boardName,
      project: projectId,
      order: existingCount + index,
    }))
  );
};

const buildMetrics = (cards, boards, backlogBoardId) => {
  const total = cards.length;
  const completed = cards.filter((card) => card.status === "completed").length;
  const overdue = cards.filter(
    (card) => card.deadline && new Date(card.deadline) < new Date() && card.status !== "completed"
  ).length;
  const activeSprintCards = cards.filter((card) => card.sprintId).length;
  const backlogCards = cards.filter(
    (card) => !card.sprintId && backlogBoardId && card.board.toString() === backlogBoardId.toString()
  ).length;

  return {
    totalCards: total,
    completedCards: completed,
    overdueCards: overdue,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    boardCount: boards.length,
    activeSprintCards,
    backlogCards,
  };
};

const buildSprintSummary = (sprints, cards) =>
  sprints
    .map((sprint) => ({
      ...sprint.toObject(),
      cardCount: cards.filter((card) => card.sprintId?.toString() === sprint._id.toString()).length,
    }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const buildBacklog = (cards, backlogBoardId) =>
  cards
    .filter((card) => !card.sprintId && backlogBoardId && card.board.toString() === backlogBoardId.toString())
    .sort((left, right) => left.order - right.order);
