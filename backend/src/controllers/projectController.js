import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { Activity } from "../models/Activity.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { logActivity } from "../services/activityService.js";
import { ensureProjectMember, getProjectSnapshot } from "../services/projectService.js";
import { emitProjectUpdate } from "../socket/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorResponse } from "../utils/errorResponse.js";

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
  })
    .populate("owner", "name email role avatar")
    .populate("members.user", "name email role avatar")
    .sort({ updatedAt: -1 });

  res.json({ projects });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    throw new ErrorResponse("Project name is required", 400);
  }

  const project = await Project.create({
    name,
    description,
    color,
    owner: req.user._id,
    members: [{ user: req.user._id, role: "admin" }],
  });

  const defaultBoards = ["Backlog", "In Progress", "In Code Review", "Done"];
  await Board.insertMany(
    defaultBoards.map((boardName, index) => ({
      name: boardName,
      project: project._id,
      order: index,
    }))
  );

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "created_project",
    meta: { projectName: name },
  });

  res.status(201).json(await getProjectSnapshot(project._id));
});

export const getProjectDetails = asyncHandler(async (req, res) => {
  await ensureProjectMember(req.params.projectId, req.user._id);
  res.json(await getProjectSnapshot(req.params.projectId));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);

  if (project.owner._id.toString() !== req.user._id.toString()) {
    throw new ErrorResponse("Only the project owner can delete this project", 403);
  }

  await Card.deleteMany({ project: project._id });
  await Board.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await Project.deleteOne({ _id: project._id });

  res.json({ message: "Project deleted" });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const requester = project.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = project.owner._id.toString() === req.user._id.toString() || requester?.role === "admin";

  if (!isAdmin) {
    throw new ErrorResponse("Only project admins can invite members", 403);
  }

  const { email, role } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ErrorResponse("User with that email was not found", 404);
  }

  const alreadyMember = project.members.some(
    (member) => member.user._id.toString() === user._id.toString()
  );

  if (alreadyMember) {
    throw new ErrorResponse("User is already a project member", 409);
  }

  project.members.push({ user: user._id, role: role === "admin" ? "admin" : "member" });
  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "invited_member",
    meta: { invitedEmail: user.email, role: role === "admin" ? "admin" : "member" },
  });

  const snapshot = await getProjectSnapshot(project._id);
  emitProjectUpdate(req.app.get("io"), project._id, snapshot);
  res.status(201).json(snapshot);
});

export const createSprint = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const requester = project.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = project.owner._id.toString() === req.user._id.toString() || requester?.role === "admin";

  if (!isAdmin) {
    throw new ErrorResponse("Only project admins can manage sprints", 403);
  }

  const { name, goal, startDate, endDate, status } = req.body;

  if (!name) {
    throw new ErrorResponse("Sprint name is required", 400);
  }

  if (status === "active") {
    project.sprints.forEach((sprint) => {
      if (sprint.status === "active") {
        sprint.status = "planned";
      }
    });
  }

  project.sprints.push({
    name,
    goal,
    startDate,
    endDate,
    status: status === "completed" ? "completed" : status === "active" ? "active" : "planned",
    completedAt: status === "completed" ? new Date() : null,
  });

  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "created_sprint",
    meta: { sprintName: name },
  });

  const snapshot = await getProjectSnapshot(project._id);
  emitProjectUpdate(req.app.get("io"), project._id, snapshot);
  res.status(201).json(snapshot);
});

export const updateSprint = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const requester = project.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = project.owner._id.toString() === req.user._id.toString() || requester?.role === "admin";

  if (!isAdmin) {
    throw new ErrorResponse("Only project admins can manage sprints", 403);
  }

  const sprint = project.sprints.id(req.params.sprintId);

  if (!sprint) {
    throw new ErrorResponse("Sprint not found", 404);
  }

  const { name, goal, startDate, endDate, status } = req.body;

  if (status === "active") {
    project.sprints.forEach((item) => {
      if (item._id.toString() !== sprint._id.toString() && item.status === "active") {
        item.status = "planned";
      }
    });
  }

  sprint.name = name || sprint.name;
  sprint.goal = goal ?? sprint.goal;
  sprint.startDate = startDate ?? sprint.startDate;
  sprint.endDate = endDate ?? sprint.endDate;
  sprint.status = status || sprint.status;
  sprint.completedAt = sprint.status === "completed" ? sprint.completedAt || new Date() : null;

  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "updated_sprint",
    meta: { sprintName: sprint.name },
  });

  const snapshot = await getProjectSnapshot(project._id);
  emitProjectUpdate(req.app.get("io"), project._id, snapshot);
  res.json(snapshot);
});

export const startSprint = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const requester = project.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = project.owner._id.toString() === req.user._id.toString() || requester?.role === "admin";

  if (!isAdmin) {
    throw new ErrorResponse("Only project admins can manage sprints", 403);
  }

  const sprint = project.sprints.id(req.params.sprintId);

  if (!sprint) {
    throw new ErrorResponse("Sprint not found", 404);
  }

  project.sprints.forEach((item) => {
    if (item.status === "active") {
      item.status = "planned";
    }
  });

  sprint.status = "active";
  if (!sprint.startDate) {
    sprint.startDate = new Date();
  }
  sprint.completedAt = null;
  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "started_sprint",
    meta: { sprintName: sprint.name },
  });

  const snapshot = await getProjectSnapshot(project._id);
  emitProjectUpdate(req.app.get("io"), project._id, snapshot);
  res.json(snapshot);
});

export const completeSprint = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const requester = project.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  const isAdmin = project.owner._id.toString() === req.user._id.toString() || requester?.role === "admin";

  if (!isAdmin) {
    throw new ErrorResponse("Only project admins can manage sprints", 403);
  }

  const sprint = project.sprints.id(req.params.sprintId);

  if (!sprint) {
    throw new ErrorResponse("Sprint not found", 404);
  }

  sprint.status = "completed";
  sprint.completedAt = new Date();
  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "completed_sprint",
    meta: { sprintName: sprint.name },
  });

  const snapshot = await getProjectSnapshot(project._id);
  emitProjectUpdate(req.app.get("io"), project._id, snapshot);
  res.json(snapshot);
});

export const createBoard = asyncHandler(async (req, res) => {
  const project = await ensureProjectMember(req.params.projectId, req.user._id);
  const boardCount = await Board.countDocuments({ project: project._id });
  const board = await Board.create({
    name: req.body.name || "Untitled Board",
    project: project._id,
    order: boardCount,
  });

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "created_board",
    meta: { boardName: board.name },
  });

  emitProjectUpdate(req.app.get("io"), project._id, await getProjectSnapshot(project._id));
  res.status(201).json({ board });
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId);

  if (!board) {
    throw new ErrorResponse("Board not found", 404);
  }

  await ensureProjectMember(board.project, req.user._id);
  board.name = req.body.name || board.name;
  await board.save();

  emitProjectUpdate(req.app.get("io"), board.project, await getProjectSnapshot(board.project));
  res.json({ board });
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId);

  if (!board) {
    throw new ErrorResponse("Board not found", 404);
  }

  await ensureProjectMember(board.project, req.user._id);
  await Card.deleteMany({ board: board._id });
  await board.deleteOne();

  emitProjectUpdate(req.app.get("io"), board.project, await getProjectSnapshot(board.project));
  res.json({ message: "Board deleted" });
});
