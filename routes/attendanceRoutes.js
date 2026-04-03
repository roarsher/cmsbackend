 const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { markAttendance, getStudentAttendance } = require("../controllers/attendanceController");

// ✅ Teacher marks attendance — POST /api/attendance/mark
router.post(
  "/mark",
  protect,
  authorize("teacher"),
  markAttendance
);

// ✅ Student views their attendance — GET /api/attendance/my
router.get(
  "/my",
  protect,
  authorize("student"),
  getStudentAttendance
);

module.exports = router;