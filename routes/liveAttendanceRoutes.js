// const express = require("express");
// const router  = express.Router();
// const protect = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");
// const {
//   startSession, stopSession, getSession, getSessions,
//   getActiveSession, submitAttendance,
// } = require("../controllers/liveAttendanceController");

// // Teacher
// router.post("/start",           protect, authorize("teacher"), startSession);
// router.put("/stop/:id",         protect, authorize("teacher"), stopSession);
// router.get("/session/:id",      protect, authorize("teacher"), getSession);
// router.get("/sessions",         protect, authorize("teacher"), getSessions);

// // Student
// router.get("/active",           protect, authorize("student"), getActiveSession);
// router.post("/submit",          protect, authorize("student"), submitAttendance);

// module.exports = router;
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

// Admin
router.get("/all-sessions",    protect, authorize("admin"),   async (req, res) => {
  try {
    const AttendanceSession = require("../models/AttendanceSession");
    const { department, date } = req.query;
    let filter = {};
    if (department) filter.department = department;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      filter.startTime = { $gte: d, $lte: e };
    }
    const sessions = await AttendanceSession.find(filter)
      .populate("course", "name code")
      .populate("teacher", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Student
router.get("/active",           protect, authorize("student"), getActiveSession);
router.post("/submit",          protect, authorize("student"), submitAttendance);

module.exports = router;