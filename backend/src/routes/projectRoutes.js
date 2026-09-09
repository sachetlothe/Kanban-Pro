import express from "express";
import {
  createBoard,
  createProject,
  createSprint,
  deleteProject,
  deleteBoard,
  completeSprint,
  getProjectDetails,
  getProjects,
  inviteMember,
  startSprint,
  updateBoard,
  updateSprint,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(getProjects).post(createProject);
router.route("/:projectId").get(getProjectDetails).delete(deleteProject);
router.post("/:projectId/invite", inviteMember);
router.post("/:projectId/boards", createBoard);
router.post("/:projectId/sprints", createSprint);
router.patch("/:projectId/sprints/:sprintId", updateSprint);
router.patch("/:projectId/sprints/:sprintId/start", startSprint);
router.patch("/:projectId/sprints/:sprintId/complete", completeSprint);
router.patch("/boards/:boardId", updateBoard);
router.delete("/boards/:boardId", deleteBoard);

export default router;
