//  const express = require("express");
// const router = express.Router();
// const protect = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");
// const { addMarks } = require("../controllers/teacherController");
// const { getStudentMarks } = require("../controllers/studentController");

// // Teacher adds marks
// router.post("/", protect, authorize("teacher"), addMarks);

// // Student views their own marks
// router.get("/my-marks", protect, authorize("student"), getStudentMarks);

// module.exports = router;

// const express  = require("express");
// const router   = express.Router();
// const protect  = require("../middleware/authMiddleware");
// const { authorize } = require("../middleware/roleMiddleware");
// const { addMarks }       = require("../controllers/teacherController");
// const { getStudentMarks } = require("../controllers/studentController");
// const Marks  = require("../models/Marks");
// const Teacher = require("../models/Teacher");

// // ── Teacher adds / updates marks ──────────────────────────────────────────────
// router.post("/", protect, authorize("teacher"), addMarks);

// // ── GET /marks/course/:courseId ───────────────────────────────────────────────
// // Returns all marks for a specific course — used by AddMarks page to pre-fill
// // Teacher must own the course
// router.get("/course/:courseId", protect, authorize("teacher"), async (req, res) => {
//   try {
//     const teacher = await Teacher.findById(req.user.id);
//     if (!teacher) return res.status(404).json({ message: "Teacher not found" });

//     // Verify teacher owns this course
//     const owns = (teacher.assignedCourses || []).some(
//       (id) => id.toString() === req.params.courseId
//     );
//     if (!owns)
//       return res.status(403).json({ message: "You are not assigned to this course" });

//     const marks = await Marks.find({ course: req.params.courseId })
//       .populate("student", "name email rollNumber department semester enrollmentYear");

//     res.json({ success: true, marks });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── Student views their own marks ─────────────────────────────────────────────
// router.get("/my-marks", protect, authorize("student"), getStudentMarks);

// module.exports = router;




const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Marks   = require("../models/Marks");
const { getStudentMarks } = require("../controllers/studentController");

// ✅ Student: get my marks
router.get("/my-marks", protect, authorize("student"), getStudentMarks);

// ✅ Teacher: get all marks for a specific course
router.get("/course/:courseId", protect, authorize("teacher"), async (req, res) => {
  try {
    const marks = await Marks.find({ course: req.params.courseId })
      .populate("student", "name rollNumber email department semester")
      .populate("course",  "name code semester department");
    res.json({ success: true, marks });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Admin: get marks for any course
router.get("/admin/course/:courseId", protect, authorize("admin"), async (req, res) => {
  try {
    const marks = await Marks.find({ course: req.params.courseId })
      .populate("student", "name rollNumber department semester")
      .populate("course",  "name code");
    res.json({ success: true, marks });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;