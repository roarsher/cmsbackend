//  const express  = require("express");
// const router   = express.Router();
// const protect  = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");

// const {
//   getAllStudents,
//   getCourses,
//   searchStudent,
//   markAttendance,
//   addMarks,
//   postNotice,
//   getNotices,
// } = require("../controllers/teacherController");

// // All routes — teacher only
// router.use(protect);
// router.use(authorize("teacher"));

// // Students
// router.get("/students",        getAllStudents);   // ?semester=3 optional
// router.get("/students/search", searchStudent);    // ?q=name&semester=3

// // Courses (only teacher's assignedCourses)
// router.get("/courses", getCourses);

// // Attendance — POST /teacher/attendance  (or keep /attendance/mark if you prefer)
// router.post("/attendance", markAttendance);

// // Marks
// router.post("/marks", addMarks);

// // Notices
// router.post("/notices", postNotice);
// router.get("/notices",  getNotices);

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
  postNotice,
  getNotices,
  // ← addMarks REMOVED from here — it lives in marksRoutes.js
} = require("../controllers/teacherController");

router.use(protect);
router.use(authorize("teacher"));

router.get("/students",        getAllStudents);
router.get("/students/search", searchStudent);
router.get("/courses",         getCourses);
router.post("/attendance",     markAttendance);
router.post("/notices",        postNotice);
router.get("/notices",         getNotices);

module.exports = router;