 
 const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// ✅ Teacher marks attendance (called from teacher dashboard modal)
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status } = req.body;

    if (!studentId || !courseId || !status) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Present or Absent" });
    }

    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      status,
      date: new Date(),
    });

    res.status(201).json({ success: true, attendance });

  } catch (error) {
    console.error("markAttendance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Student views their own attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    // req.user.id is the student's _id directly (new schema)
    const attendance = await Attendance.find({ student: req.user.id })
      .populate("course", "name code department")
      .sort({ date: -1 });

    res.status(200).json(attendance);

  } catch (error) {
    console.error("getStudentAttendance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};