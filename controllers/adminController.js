//  const Student  = require("../models/Student");
// const Teacher  = require("../models/Teacher");
// const Course   = require("../models/Course");
// const Attendance = require("../models/Attendance");
// const bcrypt   = require("bcryptjs");

// // ✅ Get All Students (with attendancePct)
// exports.getAllStudents = async (req, res) => {
//   try {
//     const students = await Student.find().select("-password");

//     const enriched = await Promise.all(
//       students.map(async (s) => {
//         const att = await Attendance.find({ student: s._id });
//         const total   = att.length;
//         const present = att.filter((a) => a.status === "Present").length;
//         const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
//         return { ...s.toObject(), attendancePct };
//       })
//     );

//     res.json(enriched);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get All Teachers
// exports.getAllTeachers = async (req, res) => {
//   try {
//     const teachers = await Teacher.find().select("-password");
//     res.json(teachers);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Delete Student
// exports.deleteStudent = async (req, res) => {
//   try {
//     await Student.findByIdAndDelete(req.params.id);
//     // Also clean up attendance and marks
//     const Marks = require("../models/Marks");
//     await Attendance.deleteMany({ student: req.params.id });
//     await Marks.deleteMany({ student: req.params.id });
//     res.json({ success: true, message: "Student deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Delete Teacher
// exports.deleteTeacher = async (req, res) => {
//   try {
//     await Teacher.findByIdAndDelete(req.params.id);
//     res.json({ success: true, message: "Teacher deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Create Course
// exports.createCourse = async (req, res) => {
//   try {
//     const { name, code, department } = req.body;
//     if (!name || !code || !department)
//       return res.status(400).json({ message: "All fields required" });

//     const course = await Course.create({ name, code, department });
//     res.status(201).json(course);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getCourses = async (req, res) => {
//   try {
//     const Course = require("../models/Course");
//     const courses = await Course.find().select("name code department");

//     res.json({
//       success: true,
//       courses,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Course     = require("../models/Course");
const Attendance = require("../models/Attendance");
const Marks      = require("../models/Marks");

// ── GET /admin/students  (optional ?department=CSE&semester=3) ────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester)   filter.semester   = Number(req.query.semester);

    const students = await Student.find(filter)
      .select("-password")
      .populate("courses", "name code semester department");

    const enriched = await Promise.all(
      students.map(async (s) => {
        const att     = await Attendance.find({ student: s._id });
        const present = att.filter((a) => a.status === "Present").length;
        const attendancePct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

        const marks    = await Marks.find({ student: s._id });
        const avgMarks = marks.length
          ? Math.round(marks.reduce((sum, m) => sum + m.marks, 0) / marks.length)
          : null;

        return { ...s.toObject(), attendancePct, avgMarks };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /admin/teachers  (optional ?department=CSE) ───────────────────────────
exports.getAllTeachers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.departments = req.query.department; // array field

    const teachers = await Teacher.find(filter)
      .select("-password")
      .populate("assignedCourses", "name code department semester");

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /admin/students/:id ────────────────────────────────────────────────
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ student: req.params.id });
    await Marks.deleteMany({ student: req.params.id });
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /admin/teachers/:id ────────────────────────────────────────────────
exports.deleteTeacher = async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Teacher deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /admin/courses  (optional ?department=CSE&semester=3) ─────────────────
exports.getCourses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester)   filter.semester   = Number(req.query.semester);

    const courses = await Course.find(filter)
      .populate("teacher", "name email TeacherIdNumber")
      .sort({ department: 1, semester: 1 });

    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /admin/courses ───────────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const { name, code, department, semester } = req.body;
    if (!name || !code || !department || !semester)
      return res.status(400).json({ message: "name, code, department, semester required" });

    const existing = await Course.findOne({ code });
    if (existing)
      return res.status(400).json({ message: "Course code already exists" });

    const course = await Course.create({ name, code, department, semester: Number(semester) });
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /admin/teachers/:id/assign-courses ────────────────────────────────────
// Body: { courseIds: ["id1", "id2"], mode: "add" | "replace" }
exports.assignCoursesToTeacher = async (req, res) => {
  try {
    const { courseIds, mode = "add" } = req.body;

    if (!courseIds?.length)
      return res.status(400).json({ success: false, message: "Provide at least one courseId" });

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher)
      return res.status(404).json({ success: false, message: "Teacher not found" });

    if (mode === "replace") {
      teacher.assignedCourses = courseIds;
    } else {
      // add mode — avoid duplicates
      const existing = teacher.assignedCourses.map((id) => id.toString());
      const toAdd    = courseIds.filter((id) => !existing.includes(id));
      teacher.assignedCourses.push(...toAdd);
    }

    // Sync departments from assigned courses
    const assignedCourses = await Course.find({ _id: { $in: teacher.assignedCourses } });
    const depts = [...new Set(assignedCourses.map((c) => c.department))].slice(0, 5);
    teacher.departments = depts.length ? depts : teacher.departments;

    await teacher.save();

    const updated = await Teacher.findById(req.params.id)
      .select("-password")
      .populate("assignedCourses", "name code department semester");

    res.json({ success: true, message: "Courses assigned successfully", teacher: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /admin/teachers/:id/courses/:courseId ──────────────────────────────
exports.removeCourseFromTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.assignedCourses = teacher.assignedCourses.filter(
      (id) => id.toString() !== req.params.courseId
    );

    // Re-sync departments
    const assignedCourses = await Course.find({ _id: { $in: teacher.assignedCourses } });
    teacher.departments = [...new Set(assignedCourses.map((c) => c.department))].slice(0, 5);
    if (!teacher.departments.length) teacher.departments = ["CSE"]; // fallback

    await teacher.save();
    res.json({ success: true, message: "Course removed from teacher" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /admin/stats ──────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "EE"];

    const [totalStudents, totalTeachers, totalCourses] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
    ]);

    // Per-department breakdown
    const deptStats = await Promise.all(
      DEPARTMENTS.map(async (dept) => {
        const [students, teachers] = await Promise.all([
          Student.countDocuments({ department: dept }),
          Teacher.countDocuments({ departments: dept }),
        ]);
        // Per semester count
        const semCounts = await Promise.all(
          [1,2,3,4,5,6,7,8].map(async (sem) => ({
            semester: sem,
            count: await Student.countDocuments({ department: dept, semester: sem }),
          }))
        );
        return { dept, students, teachers, semCounts };
      })
    );

    res.json({ success: true, totalStudents, totalTeachers, totalCourses, deptStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};