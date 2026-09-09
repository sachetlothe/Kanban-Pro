import express from "express";
import {
  addComment,
  createCard,
  deleteCard,
  moveCard,
  updateCard,
} from "../controllers/cardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/boards/:boardId", createCard);
router.patch("/:cardId", updateCard);
router.delete("/:cardId", deleteCard);
router.patch("/:cardId/move", moveCard);
router.post("/:cardId/comments", addComment);

export default router;
