 
// const express  = require("express");
// const router   = express.Router();
// const protect  = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");

// const {
//   getAllStudents,
//   getCourses,
//   searchStudent,
//   markAttendance,
//   postNotice,
//   getNotices,
//   // ← addMarks REMOVED from here — it lives in marksRoutes.js
// } = require("../controllers/teacherController");

// router.use(protect);
// router.use(authorize("teacher"));

// router.get("/students",        getAllStudents);
// router.get("/students/search", searchStudent);
// router.get("/courses",         getCourses);
// router.post("/attendance",     markAttendance);
// router.post("/notices",        postNotice);
// router.get("/notices",         getNotices);

// module.exports = router;


const express  = require("express");
const router   = express.Router();
const protect  = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getAllStudents,
  getCourses,
  searchStudent,
  markAttendance,
  addMarks,        // ← re-added: was wrongly removed, POST /teacher/marks was broken
  postNotice,
  getNotices,
} = require("../controllers/teacherController");

router.use(protect);
router.use(authorize("teacher"));

// Students
router.get("/students",        getAllStudents);   // ?semester=3 optional
router.get("/students/search", searchStudent);    // ?q=name&semester=3

// Courses (teacher's assignedCourses only)
router.get("/courses", getCourses);

// Attendance
router.post("/attendance", markAttendance);

// ── Marks ─────────────────────────────────────────────────────────────────────
// POST /teacher/marks  — add/update a student's marks for a course
// This was removed by mistake; AddMarks.jsx calls this endpoint
router.post("/marks", addMarks);

// Notices
router.post("/notices", postNotice);
router.get("/notices",  getNotices);

module.exports = router;