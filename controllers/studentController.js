//  const Student = require("../models/Student");
// const Attendance = require("../models/Attendance");
// const Marks = require("../models/Marks");

// // ✅ Get Student Profile (with populated courses)
// exports.getProfile = async (req, res) => {
//   try {
//     const student = await Student.findById(req.user.id)
//       .select("-password")
//       .populate("courses", "name code department");

//     if (!student) return res.status(404).json({ message: "Student not found" });

//     res.json(student);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get My Attendance
// exports.getMyAttendance = async (req, res) => {
//   try {
//     const attendance = await Attendance.find({ student: req.user.id })
//       .populate("course", "name code department")
//       .sort({ date: -1 });

//     res.json(attendance);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get My Marks
// exports.getMyMarks = async (req, res) => {
//   try {
//     const marks = await Marks.find({ student: req.user.id })
//       .populate("course", "name code department");

//     res.json(marks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get Student Marks (used in marksRoutes)
// exports.getStudentMarks = async (req, res) => {
//   try {
//     const marks = await Marks.find({ student: req.user.id })
//       .populate("course", "name code department");

//     res.json(marks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get My Assigned Courses
// exports.getMyCourses = async (req, res) => {
//   try {
//     const student = await Student.findById(req.user.id)
//       .select("courses department name")
//       .populate("courses", "name code department");

//     if (!student) return res.status(404).json({ message: "Student not found" });

//     res.json({ success: true, courses: student.courses });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Marks = require("../models/Marks");
const Course = require("../models/Course");

// ✅ Get Student Profile (with populated courses)
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("-password")
      .populate("courses", "name code department semester");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get My Attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user.id })
      .populate("course", "name code department semester")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get My Marks
exports.getMyMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.user.id })
      .populate("course", "name code department semester");

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Student Marks (used in marksRoutes)
exports.getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.user.id })
      .populate("course", "name code department semester");

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get My Assigned Courses
exports.getMyCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("courses department semester name")
      .populate("courses", "name code department semester");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ success: true, courses: student.courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Semester and/or Department → auto re-assign courses
// PUT /api/students/update-semester
// Access: student only (protected route)
exports.updateSemesterOrDepartment = async (req, res) => {
  try {
    const { semester, department } = req.body;

    if (!semester && !department)
      return res.status(400).json({
        success: false,
        message: "Provide at least semester or department to update",
      });

    const student = await Student.findById(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    // ── Apply updates ───────────────────────────────────────────────
    if (semester)   student.semester   = Number(semester);
    if (department) student.department = department;
    // year is auto-derived from semester via pre("validate") hook in Student model

    // ── Re-assign courses based on new dept + semester ──────────────
    const newCourses = await Course.find({
      department: student.department,
      semester:   student.semester,
    }).select("_id");

    student.courses = newCourses.map((c) => c._id);

    await student.save();

    // ── Return fully populated updated student ──────────────────────
    const updated = await Student.findById(req.user.id)
      .select("-password")
      .populate("courses", "name code department semester");

    return res.status(200).json({
      success: true,
      message: `Updated to ${student.department} Semester ${student.semester}. ${newCourses.length} courses assigned.`,
      user: updated,
    });

  } catch (error) {
    console.error("Update Semester/Dept Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};