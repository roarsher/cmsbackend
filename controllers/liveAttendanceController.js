
const AttendanceSession = require("../models/AttendanceSession");
const Attendance        = require("../models/Attendance");
const Teacher           = require("../models/Teacher");
const Student           = require("../models/Student");
const Course            = require("../models/Course");

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateChallenge = (count = 3) => {
  const nums = Array.from({ length: 9 }, (_, i) => i + 1);
  const picked = nums.sort(() => Math.random() - 0.5).slice(0, count);
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
};

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R    = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─────────────────────────────────────────────────────────────────────────────
// KEY FIX: filter by dept + semester + actually enrolled in this specific course
// ─────────────────────────────────────────────────────────────────────────────
const getEnrolledStudents = async (courseId, department, semester) => {
  return Student.find({
    department,
    semester: Number(semester),
    courses:  { $in: [courseId] },   // ← must be enrolled in this exact course
  }).select("name rollNumber _id");
};

// ── Generate & persist final report ──────────────────────────────────────────
const generateReport = async (session) => {
  try {
    // Pull only students enrolled in the session's course + matching dept/sem
    const enrolled = await getEnrolledStudents(
      session.course,
      session.department,
      session.semester
    );

    const entries = enrolled.map((s) => {
      const sub = session.submissions.find(
        (sub) => sub.student?.toString() === s._id.toString()
      );

      return {
        student:     s._id,
        name:        s.name,
        rollNumber:  s.rollNumber,
        status:      sub ? sub.status : "Absent",   // "Present" | "Rejected" | "Absent"
        submittedAt: sub?.markedAt  || null,
        distance:    sub?.distance  || null,
        gpsValid:    sub?.gpsValid  || null,
      };
    });

    // Sort: Present → Absent → Rejected
    entries.sort((a, b) => {
      const order = { Present: 0, Absent: 1, Rejected: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

    const presentCount  = entries.filter((e) => e.status === "Present").length;
    const absentCount   = entries.filter((e) => e.status === "Absent").length;
    const rejectedCount = entries.filter((e) => e.status === "Rejected").length;

    session.report = {
      generated:     true,
      generatedAt:   new Date(),
      totalStudents: enrolled.length,
      presentCount,
      absentCount,
      rejectedCount,
      entries,
    };
    session.active = false;
    await session.save();

    return session.report;
  } catch (err) {
    console.error("generateReport error:", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER: Start session
// Body: { courseId, semester, lat, lng, duration?, radius? }
// ─────────────────────────────────────────────────────────────────────────────
exports.startSession = async (req, res) => {
  try {
    const { courseId, semester, duration = 60, lat, lng, radius = 5 } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!courseId)           return res.status(400).json({ message: "courseId is required" });
    if (!semester)           return res.status(400).json({ message: "semester is required" });
    if  (lat == null || lng == null)       return res.status(400).json({ message: "lat and lng are required" });
    console.log("🚀 SESSION CREATED:", {
  receivedRadius: radius,
  storedRadius: session?.classroom?.radius
});
    // ── Fetch teacher & verify course is assigned ─────────────────────────────
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher)            return res.status(404).json({ message: "Teacher not found" });

    const owns = teacher.assignedCourses.some((c) => c.toString() === courseId);
    if (!owns)
      return res.status(403).json({ message: "You are not assigned to this course" });

    // ── Fetch course to get the canonical department ──────────────────────────
    // Using course.department (not teacher.departments[0]) so the right branch is set
    const course = await Course.findById(courseId).select("name code department semester");
    if (!course)             return res.status(404).json({ message: "Course not found" });

    // Verify the semester in request matches the course's semester
    if (Number(semester) !== Number(course.semester)) {
      return res.status(400).json({
        message: `Semester mismatch: course is for semester ${course.semester}, you passed ${semester}`,
      });
    }

    // ── Close any stale active sessions for same teacher+course ──────────────
    await AttendanceSession.updateMany(
      { teacher: req.user.id, course: courseId, active: true },
      { active: false }
    );

    // ── Create session ────────────────────────────────────────────────────────
    const challenge = generateChallenge(3);
    const expiresAt = new Date(Date.now() + Number(duration) * 1000);

    const session = await AttendanceSession.create({
      teacher:    req.user.id,
      course:     courseId,
      department: course.department,       // ← from course, not teacher.departments[0]
      semester:   Number(course.semester), // ← from course (already validated above)
      challenge,
      duration:   Number(duration),
      expiresAt,
      active:     true,
      classroom: {
        lat:    Number(lat),
        lng:    Number(lng),
        radius: Number(radius),
      },
    });

    // ── Emit socket event to the right dept room ──────────────────────────────
    const io = req.app.get("io");
    if (io) {
      io.to(`dept_${course.department}`).emit("session_started", {
        sessionId:  session._id,
        courseId,
        courseName: course.name,
        challenge,
        expiresAt,
        duration:   Number(duration),
        department: course.department,
        semester:   course.semester,
      });
    }

    // ── Auto-stop & generate report on expiry ─────────────────────────────────
    setTimeout(async () => {
      try {
        const s = await AttendanceSession.findById(session._id);
        if (s?.active) {
          await generateReport(s);
          const io = req.app.get("io");
          if (io) {
            io.to(`dept_${course.department}`).emit("session_ended", { sessionId: s._id });
            io.to(`session_${s._id}`).emit("report_ready", { sessionId: s._id });
          }
        }
      } catch (e) {
        console.error("Auto-stop error:", e);
      }
    }, Number(duration) * 1000 + 2000);

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("startSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER: Stop session manually → generate report
// ─────────────────────────────────────────────────────────────────────────────
exports.stopSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      _id:     req.params.id,
      teacher: req.user.id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const report = await generateReport(session);

    const io = req.app.get("io");
    if (io) {
      io.to(`dept_${session.department}`).emit("session_ended",  { sessionId: session._id });
      io.to(`session_${session._id}`).emit("report_ready",       { sessionId: session._id });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error("stopSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER: Get one session (with full report)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("course",  "name code department semester")
      .populate("teacher", "name")
      .populate("report.entries.student", "name rollNumber");

    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER: List their past sessions
// ─────────────────────────────────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({ teacher: req.user.id })
      .populate("course", "name code department semester")
      .select(
        "course department semester startTime duration active " +
        "report.generated report.presentCount report.totalStudents report.generatedAt"
      )
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: All sessions
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find()
      .populate("course",  "name code department semester")
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: Get active session for their dept + semester + enrolled course
//
// ROOT CAUSE of "session required":
//   Old code only matched department; student's semester was ignored so
//   a session for Sem-3 CSE would appear to Sem-1 CSE students too.
//   Now we also verify the student is enrolled in the session's course.
// ─────────────────────────────────────────────────────────────────────────────
exports.getActiveSession = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select(
      "name department semester courses"
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Find an active session matching dept + semester that the student is enrolled in
    const session = await AttendanceSession.findOne({
      department: student.department,
      semester:   student.semester,
      active:     true,
      expiresAt:  { $gt: new Date() },
      // course must be one the student is enrolled in
      course:     { $in: student.courses },
    }).populate("course", "name code department semester");

    if (!session) {
      return res.json({
        success: true,
        session: null,
        message: "No active session for your department, semester, and enrolled courses",
      });
    }

    const alreadySubmitted = session.submissions.some(
      (s) => s.student?.toString() === req.user.id
    );

    res.json({
      success: true,
      session: {
        _id:        session._id,
        challenge:  session.challenge,
        expiresAt:  session.expiresAt,
        course:     session.course,
        department: session.department,
        semester:   session.semester,
        classroom:  session.classroom,
      },
      alreadySubmitted,
    });
  } catch (error) {
    console.error("getActiveSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: Submit attendance
// ─────────────────────────────────────────────────────────────────────────────
exports.submitAttendance = async (req, res) => {
  try {
    const { sessionId, answer, lat, lng } = req.body;


     if (!sessionId || !answer || lat == null || lng == null)
      return res.status(400).json({ message: "sessionId, answer, lat, lng are required" });

    const session = await AttendanceSession.findById(sessionId);
    if (!session)         return res.status(404).json({ message: "Session not found" });
    if (!session.active)  return res.status(400).json({ message: "Session has ended" });
    if (new Date() > session.expiresAt)
      return res.status(400).json({ message: "Session has expired" });

    const student = await Student.findById(req.user.id).select(
      "name rollNumber department semester courses"
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ── Guard: dept + semester must match ────────────────────────────────────
    if (student.department !== session.department)
      return res.status(403).json({ message: "This session is not for your department" });

    if (Number(student.semester) !== Number(session.semester))
      return res.status(403).json({
        message: `This session is for semester ${session.semester}, you are in semester ${student.semester}`,
      });

    // ── Guard: student must be enrolled in the session's course ──────────────
    const isEnrolled = (student.courses || []).some(
      (c) => c.toString() === session.course.toString()
    );
    if (!isEnrolled)
      return res.status(403).json({
        message: "You are not enrolled in the course for this session",
      });

    // ── Guard: no double submission ───────────────────────────────────────────
    const alreadySubmitted = session.submissions.some(
      (s) => s.student?.toString() === req.user.id
    );
    if (alreadySubmitted)
      return res.status(400).json({ message: "You have already submitted for this session" });

    // ── Validate challenge answer ─────────────────────────────────────────────
    const correct =
      Array.isArray(answer) &&
      answer.length === session.challenge.length &&
      answer.every((n, i) => Number(n) === session.challenge[i]);

    // ── Validate GPS ──────────────────────────────────────────────────────────
    const distance = getDistance(
      Number(lat), Number(lng),
      session.classroom.lat, session.classroom.lng
    );
    // const gpsValid = distance <= session.classroom.radius;
    // Change to — no tolerance, strictly less than radius:
   //const gpsValid = Math.round(distance) <= session.classroom.radius;
   ///const gpsValid = distance <= session.classroom.radius;
   const gpsValid = distance <= session.classroom.radius;

// 🔥 ADD DEBUG LOGS HERE (BEST PLACE)
console.log("📍 GPS DEBUG:", {
  student: student.name,
  rollNumber: student.rollNumber,
  sessionId,
  distance: Math.round(distance),
  radius: session.classroom.radius,
  gpsValid,
  correct,
});

 
    const status   = correct && gpsValid ? "Present" : "Rejected";

    // ── Record submission ─────────────────────────────────────────────────────
    session.submissions.push({
      student:    req.user.id,
      name:       student.name,
      rollNumber: student.rollNumber,
      answer:     answer.map(Number),
      correct,
      gpsValid,
      lat:        Number(lat),
      lng:        Number(lng),
      distance:   Math.round(distance),
      status,
    });
    await session.save();

console.log("💾 SAVED SUBMISSION:", {
  student: student.name,
  status,
});
    

    // ── Persist to Attendance collection if Present ───────────────────────────
    if (status === "Present") {
      await Attendance.findOneAndUpdate(
        {
          student: req.user.id,
          course:  session.course,
          date:    new Date().toDateString(),
        },
        {
          student: req.user.id,
          course:  session.course,
          status:  "Present",
          date:    new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // ── Emit real-time update ─────────────────────────────────────────────────
    const io = req.app.get("io");
    if (io) {
      io.to(`session_${sessionId}`).emit("student_submitted", {
        studentId:  req.user.id,
        name:       student.name,
        rollNumber: student.rollNumber,
        correct,
        gpsValid,
        distance:   Math.round(distance),
        status,
      });
    }

    // ── Response ──────────────────────────────────────────────────────────────
    if (!correct)
      return res.status(400).json({
        success: false,
        message: "❌ Wrong number order! Try again.",
        correct,
        gpsValid,
      });

    if (!gpsValid)
      return res.status(400).json({
        success: false,
        message: `❌ GPS failed! You are ${Math.round(distance)}m away (max ${session.classroom.radius}m).`,
        correct,
        gpsValid,
        distance: Math.round(distance),
      });

    res.json({
      success: true,
      message: "✅ Attendance marked successfully!",
      status,
    });
  } catch (error) {
    console.error("submitAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};