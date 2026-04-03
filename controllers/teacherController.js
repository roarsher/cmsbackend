 const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Marks = require("../models/Marks");
const Notice = require("../models/Notice");
const Course = require("../models/Course");

// ✅ Get students filtered by teacher's department
exports.getAllStudents = async (req, res) => {
  try {
    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findById(req.user.id).select("department");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // Only fetch students from teacher's own department
    const students = await Student.find({ department: teacher.department }).select("-password");

    // For each student, calculate attendance % and avg marks
    const enriched = await Promise.all(
      students.map(async (s) => {
        const attendanceRecords = await Attendance.find({ student: s._id });
        const totalClasses = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(
          (a) => a.status === "Present"
        ).length;
        const attendancePct =
          totalClasses > 0
            ? Math.round((presentCount / totalClasses) * 100)
            : 0;

        const marksRecords = await Marks.find({ student: s._id });
        const avgMarks =
          marksRecords.length > 0
            ? Math.round(
                marksRecords.reduce((sum, m) => sum + m.marks, 0) /
                  marksRecords.length
              )
            : null;

        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          department: s.department,
          year: s.year,
          attendance: attendancePct,
          avgMarks,
        };
      })
    );

    res.status(200).json({ success: true, students: enriched });
  } catch (error) {
    console.error("getAllStudents error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status } = req.body;

    if (!studentId || !courseId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      status,
      date: new Date(),
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Add Marks (by studentId OR rollNumber/name search)
exports.addMarks = async (req, res) => {
  try {
    const { studentId, rollNumber, courseId, marks, subject } = req.body;

    if (marks == null || (!studentId && !rollNumber)) {
      return res.status(400).json({
        success: false,
        message: "Provide studentId or rollNumber, courseId, and marks",
      });
    }

    // Find student by rollNumber if studentId not provided
    let resolvedStudentId = studentId;
    if (!studentId && rollNumber) {
      const student = await Student.findOne({ rollNumber });
      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      resolvedStudentId = student._id;
    }

    // Check if marks already exist for this student+course, update if so
    const existing = await Marks.findOne({
      student: resolvedStudentId,
      course: courseId,
    });

    let result;
    if (existing) {
      existing.marks = marks;
      result = await existing.save();
    } else {
      result = await Marks.create({
        student: resolvedStudentId,
        course: courseId,
        marks,
      });
    }

    const populated = await Marks.findById(result._id)
      .populate("student", "name rollNumber email department")
      .populate("course", "name");

    res.status(201).json({ success: true, marks: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all courses (for dropdowns)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().select("name code department");
    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Search student by name / roll / email — filtered by teacher's department
exports.searchStudent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res.status(400).json({ success: false, message: "Query required" });

    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findById(req.user.id).select("department");

    const students = await Student.find({
      department: teacher?.department,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { rollNumber: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    }).select("-password");

    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Post Notice
exports.postNotice = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message)
      return res
        .status(400)
        .json({ success: false, message: "Title and message required" });

    const notice = await Notice.create({ title, message });
    res.status(201).json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all notices
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};