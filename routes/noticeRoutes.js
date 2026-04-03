import express from "express";
import {
  createNotice,
  getAllNotices,
  deleteNotice,
} from "../controllers/noticeController.js";

const router = express.Router();

// Notice Routes
router.post("/notices", createNotice);
router.get("/notices", getAllNotices);
router.delete("/notices/:id", deleteNotice);

export default router;
