 const Student  = require("../models/Student");
const Teacher  = require("../models/Teacher");
const Course   = require("../models/Course");
const Attendance = require("../models/Attendance");
const bcrypt   = require("bcryptjs");

// ✅ Get All Students (with attendancePct)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select("-password");

    const enriched = await Promise.all(
      students.map(async (s) => {
        const att = await Attendance.find({ student: s._id });
        const total   = att.length;
        const present = att.filter((a) => a.status === "Present").length;
        const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { ...s.toObject(), attendancePct };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select("-password");
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    // Also clean up attendance and marks
    const Marks = require("../models/Marks");
    await Attendance.deleteMany({ student: req.params.id });
    await Marks.deleteMany({ student: req.params.id });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create Course
exports.createCourse = async (req, res) => {
  try {
    const { name, code, department } = req.body;
    if (!name || !code || !department)
      return res.status(400).json({ message: "All fields required" });

    const course = await Course.create({ name, code, department });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const Course = require("../models/Course");
    const courses = await Course.find().select("name code department");

    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};