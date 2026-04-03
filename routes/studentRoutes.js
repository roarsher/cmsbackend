 const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getProfile,
  getMyAttendance,
  getMyMarks,
  getMyCourses,
} = require("../controllers/studentController");

router.get("/profile",    protect, authorize("student"), getProfile);
router.get("/attendance", protect, authorize("student"), getMyAttendance);
router.get("/marks",      protect, authorize("student"), getMyMarks);
router.get("/courses",    protect, authorize("student"), getMyCourses);

module.exports = router;