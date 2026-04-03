 const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Marks = require("../models/Marks");

// ✅ Get Student Profile (with populated courses)
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("-password")
      .populate("courses", "name code department");

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
      .populate("course", "name code department")
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
      .populate("course", "name code department");

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Student Marks (used in marksRoutes)
exports.getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.user.id })
      .populate("course", "name code department");

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get My Assigned Courses
exports.getMyCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("courses department name")
      .populate("courses", "name code department");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ success: true, courses: student.courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};