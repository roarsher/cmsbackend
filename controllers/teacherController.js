 const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Attendance = require("../models/Attendance");
const Marks      = require("../models/Marks");
const Notice     = require("../models/Notice");
const Course     = require("../models/Course");

// ── Helper: get teacher + validate ───────────────────────────────────────────
const getTeacher = async (userId) => {
  const teacher = await Teacher.findById(userId).populate("assignedCourses", "name code department semester");
  if (!teacher) throw new Error("Teacher not found");
  return teacher;
};

// ✅ GET /teacher/students
// Returns students enrolled in ANY of the teacher's assignedCourses
// Optional query: ?semester=3
exports.getAllStudents = async (req, res) => {
  try {
    const teacher = await getTeacher(req.user.id);

    if (!teacher.assignedCourses?.length)
      return res.json({ success: true, students: [] });

    const courseIds = teacher.assignedCourses.map((c) => c._id);

    const filter = { courses: { $in: courseIds } };
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const students = await Student.find(filter)
      .select("-password")
      .populate("courses", "name code semester department");

    // Enrich with attendance % and avg marks — scoped to teacher's courses only
    const enriched = await Promise.all(
      students.map(async (s) => {
        const [attendanceRecords, marksRecords] = await Promise.all([
          Attendance.find({ student: s._id, course: { $in: courseIds } }),
          Marks.find({ student: s._id, course: { $in: courseIds } }),
        ]);

        const attendancePct = attendanceRecords.length
          ? Math.round(
              (attendanceRecords.filter((a) => a.status === "Present").length /
                attendanceRecords.length) * 100
            )
          : null;

        const avgMarks = marksRecords.length
          ? Math.round(
              marksRecords.reduce((sum, m) => sum + m.marks, 0) /
                marksRecords.length
            )
          : null;

        return {
          _id:        s._id,
          name:       s.name,
          email:      s.email,
          rollNumber: s.rollNumber,
          registrationNumber: s.registrationNumber,
          department: s.department,
          semester:   s.semester,
          year:       s.year,
          courses:    s.courses,
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

// ✅ GET /teacher/courses
// Returns only courses assigned to this teacher
exports.getCourses = async (req, res) => {
  try {
    const teacher = await getTeacher(req.user.id);
    res.status(200).json({ success: true, courses: teacher.assignedCourses || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET /teacher/students/search?q=ritesh&semester=3
// Search students within teacher's assigned courses
exports.searchStudent = async (req, res) => {
  try {
    const { q, semester } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Query required" });

    const teacher   = await getTeacher(req.user.id);
    const courseIds = teacher.assignedCourses.map((c) => c._id);

    const filter = {
      courses: { $in: courseIds },
      $or: [
        { name:       { $regex: q, $options: "i" } },
        { rollNumber: { $regex: q, $options: "i" } },
        { email:      { $regex: q, $options: "i" } },
      ],
    };
    if (semester) filter.semester = Number(semester);

    const students = await Student.find(filter).select("-password").limit(10);
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ POST /attendance/mark
// Mark attendance — teacher can only mark for their assigned courses
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status } = req.body;

    if (!studentId || !courseId || !status)
      return res.status(400).json({ success: false, message: "studentId, courseId, status required" });

    // Verify teacher owns this course
    const teacher = await getTeacher(req.user.id);
    const owns    = teacher.assignedCourses.some((c) => c._id.toString() === courseId);
    if (!owns)
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });

    const attendance = await Attendance.create({
      student: studentId,
      course:  courseId,
      status,
      date:    new Date(),
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ POST /teacher/marks
// Add or update marks — teacher can only mark for their assigned courses
exports.addMarks = async (req, res) => {
  try {
    const { studentId, rollNumber, courseId, marks } = req.body;

    if (marks == null || (!studentId && !rollNumber))
      return res.status(400).json({
        success: false,
        message: "Provide studentId or rollNumber, courseId, and marks",
      });

    if (Number(marks) < 0 || Number(marks) > 100)
      return res.status(400).json({ success: false, message: "Marks must be 0–100" });

    // Verify teacher owns this course
    const teacher = await getTeacher(req.user.id);
    const owns    = teacher.assignedCourses.some((c) => c._id.toString() === courseId);
    if (!owns)
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });

    // Resolve student
    let resolvedStudentId = studentId;
    if (!studentId && rollNumber) {
      const student = await Student.findOne({ rollNumber });
      if (!student)
        return res.status(404).json({ success: false, message: "Student not found" });
      resolvedStudentId = student._id;
    }

    // Upsert marks
    const existing = await Marks.findOne({ student: resolvedStudentId, course: courseId });
    let result;
    if (existing) {
      existing.marks = Number(marks);
      result = await existing.save();
    } else {
      result = await Marks.create({
        student: resolvedStudentId,
        course:  courseId,
        marks:   Number(marks),
      });
    }

    const populated = await Marks.findById(result._id)
      .populate("student", "name rollNumber email department semester")
      .populate("course",  "name code semester");

    res.status(201).json({ success: true, marks: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ POST /teacher/notices
exports.postNotice = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: "Title and message required" });

    const notice = await Notice.create({ title, message });
    res.status(201).json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET /teacher/notices
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};