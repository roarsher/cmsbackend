 const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getAllStudents,
  markAttendance,
  addMarks,
  getCourses,
  searchStudent,
  postNotice,
  getNotices,
} = require("../controllers/teacherController");

// 🔓 All routes protected — teacher only
router.use(protect);
router.use(authorize("teacher"));

// Students
router.get("/students", getAllStudents);
router.get("/students/search", searchStudent);

// Attendance
router.post("/attendance", markAttendance);

// Marks
router.post("/marks", addMarks);

// Courses
router.get("/courses", getCourses);

// Notices
router.post("/notices", postNotice);
router.get("/notices", getNotices);

module.exports = router;