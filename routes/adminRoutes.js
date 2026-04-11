//  const express = require("express");
// const router  = express.Router();

// const {
//   getAllStudents,
//   getAllTeachers,
//   deleteStudent,
//   deleteTeacher,
//   createCourse,
// } = require("../controllers/adminController");

// const {
//   createNotice,
//   getAllNotices,
//   deleteNotice,
// } = require("../controllers/noticeController");

// // Students
// router.get("/students",        getAllStudents);
// router.delete("/students/:id", deleteStudent);

// // Teachers
// router.get("/teachers",        getAllTeachers);
// router.delete("/teachers/:id", deleteTeacher);

// // Courses
// router.post("/create-course",  createCourse);

// // Notices
// router.post("/notices",        createNotice);
// router.get("/notices",         getAllNotices);
// router.delete("/notices/:id",  deleteNotice);

// // Courses (for admin use)
// router.get("/courses", async (req, res) => {
//   try {
//     const Course = require("../models/Course");
//     const courses = await Course.find().select("name code department");
//     res.json({ success: true, courses });
//   } catch (e) { res.status(500).json({ message: e.message }); }
// });

// module.exports = router;
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
router.delete("/notices/:id", protect, authorize("admin"), deleteNotice);

module.exports = router;