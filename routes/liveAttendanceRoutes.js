const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  startSession, stopSession, getSession, getSessions,
  getActiveSession, submitAttendance,
} = require("../controllers/liveAttendanceController");

// Teacher
router.post("/start",           protect, authorize("teacher"), startSession);
router.put("/stop/:id",         protect, authorize("teacher"), stopSession);
router.get("/session/:id",      protect, authorize("teacher"), getSession);
router.get("/sessions",         protect, authorize("teacher"), getSessions);

// Student
router.get("/active",           protect, authorize("student"), getActiveSession);
router.post("/submit",          protect, authorize("student"), submitAttendance);

module.exports = router;