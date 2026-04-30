 
// const express = require("express");
// const router  = express.Router();

// // 🔐 Middlewares
// const protect = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");

// // 📦 Controllers
// const {
//   getAllStudents,
//   getAllTeachers,
//   deleteStudent,
//   deleteTeacher,
//   createCourse,
//   getCourses,        // ✅ added (move logic to controller)
// } = require("../controllers/adminController");

// const {
//   createNotice,
//   getAllNotices,
//   deleteNotice,
// } = require("../controllers/noticeController");

// // ─────────────────────────────────────────────
// // 👨‍🎓 Students (Admin only)
// // ─────────────────────────────────────────────
// router.get("/students", protect, authorize("admin"), getAllStudents);
// router.delete("/students/:id", protect, authorize("admin"), deleteStudent);

// // ─────────────────────────────────────────────
// // 👨‍🏫 Teachers (Admin only)
// // ─────────────────────────────────────────────
// router.get("/teachers", protect, authorize("admin"), getAllTeachers);
// router.delete("/teachers/:id", protect, authorize("admin"), deleteTeacher);

// // ─────────────────────────────────────────────
// // 📚 Courses (Admin only)
// // ─────────────────────────────────────────────
// router.post("/courses", protect, authorize("admin"), createCourse);   // ✅ improved REST
// router.get("/courses", protect, authorize("admin"), getCourses);      // ✅ moved to controller

// // ─────────────────────────────────────────────
// // 📢 Notices (Admin only)
// // ─────────────────────────────────────────────
// router.post("/notices", protect, authorize("admin"), createNotice);
// router.get("/notices", protect, authorize("admin"), getAllNotices);
// // Public route (NO auth)
// router.get("/public/notices", getAllNotices);
// router.delete("/notices/:id", protect, authorize("admin"), deleteNotice);



// module.exports = router;


const express  = require("express");
const router   = express.Router();
const protect  = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getAllStudents,
  getAllTeachers,
  deleteStudent,
  deleteTeacher,
  getCourses,
  createCourse,
  assignCoursesToTeacher,
  removeCourseFromTeacher,
  getStats,
} = require("../controllers/adminController");

const {
  createNotice,
  getAllNotices,
  deleteNotice,
} = require("../controllers/noticeController");

// All routes — admin only
router.use(protect);
router.use(authorize("admin"));

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get("/stats", getStats);

// ── Students (?department=CSE&semester=3) ─────────────────────────────────────
router.get("/students",     getAllStudents);
router.delete("/students/:id", deleteStudent);

// ── Teachers (?department=CSE) ────────────────────────────────────────────────
router.get("/teachers",     getAllTeachers);
router.delete("/teachers/:id", deleteTeacher);

// ── Course assignment to teacher ──────────────────────────────────────────────
router.put("/teachers/:id/assign-courses",           assignCoursesToTeacher);
router.delete("/teachers/:id/courses/:courseId",     removeCourseFromTeacher);

// ── Courses (?department=CSE&semester=3) ──────────────────────────────────────
router.get("/courses",  getCourses);
router.post("/courses", createCourse);

// ── Notices ───────────────────────────────────────────────────────────────────
router.post("/notices",   createNotice);
router.get("/notices",    getAllNotices);
router.delete("/notices/:id", deleteNotice);

// Public notices (no auth)
router.get("/public/notices", getAllNotices);

module.exports = router;