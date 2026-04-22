 
const express = require("express");
const router  = express.Router();

// 🔐 Middlewares
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// 📦 Controllers
const {
  getAllStudents,
  getAllTeachers,
  deleteStudent,
  deleteTeacher,
  createCourse,
  getCourses,        // ✅ added (move logic to controller)
} = require("../controllers/adminController");

const {
  createNotice,
  getAllNotices,
  deleteNotice,
} = require("../controllers/noticeController");

// ─────────────────────────────────────────────
// 👨‍🎓 Students (Admin only)
// ─────────────────────────────────────────────
router.get("/students", protect, authorize("admin"), getAllStudents);
router.delete("/students/:id", protect, authorize("admin"), deleteStudent);

// ─────────────────────────────────────────────
// 👨‍🏫 Teachers (Admin only)
// ─────────────────────────────────────────────
router.get("/teachers", protect, authorize("admin"), getAllTeachers);
router.delete("/teachers/:id", protect, authorize("admin"), deleteTeacher);

// ─────────────────────────────────────────────
// 📚 Courses (Admin only)
// ─────────────────────────────────────────────
router.post("/courses", protect, authorize("admin"), createCourse);   // ✅ improved REST
router.get("/courses", protect, authorize("admin"), getCourses);      // ✅ moved to controller

// ─────────────────────────────────────────────
// 📢 Notices (Admin only)
// ─────────────────────────────────────────────
router.post("/notices", protect, authorize("admin"), createNotice);
router.get("/notices", protect, authorize("admin"), getAllNotices);
// Public route (NO auth)
router.get("/public/notices", getAllNotices);
router.delete("/notices/:id", protect, authorize("admin"), deleteNotice);



module.exports = router;