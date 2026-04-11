 const AttendanceSession = require("../models/AttendanceSession");
const Attendance        = require("../models/Attendance");
const Teacher           = require("../models/Teacher");
const Student           = require("../models/Student");

const generateChallenge = (count = 3) => {
  const nums = Array.from({ length: 9 }, (_, i) => i + 1);
  return nums.sort(() => Math.random() - 0.5).slice(0, count);
};

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Helper: generate and save final report ────────────────────────────────────
const generateReport = async (session) => {
  try {
    // Get ALL students from this department
    const allStudents = await Student.find({ department: session.department }).select("name rollNumber _id");

    const entries = allStudents.map((s) => {
      const sub = session.submissions.find((sub) => sub.student?.toString() === s._id.toString());
      let status = "Absent";
      if (sub) status = sub.status; // "Present" or "Rejected"
      return {
        student:     s._id,
        name:        s.name,
        rollNumber:  s.rollNumber,
        status,
        submittedAt: sub?.markedAt || null,
        distance:    sub?.distance || null,
        gpsValid:    sub?.gpsValid || null,
      };
    });

    // Sort: Present first, then Absent, then Rejected
    entries.sort((a, b) => {
      const order = { Present: 0, Absent: 1, Rejected: 2 };
      return (order[a.status] || 0) - (order[b.status] || 0);
    });

    const presentCount  = entries.filter(e => e.status === "Present").length;
    const absentCount   = entries.filter(e => e.status === "Absent").length;
    const rejectedCount = entries.filter(e => e.status === "Rejected").length;

    session.report = {
      generated:     true,
      generatedAt:   new Date(),
      totalStudents: allStudents.length,
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
  }
};

// ✅ Teacher: Start session
exports.startSession = async (req, res) => {
  try {
    const { courseId, duration = 60, lat, lng, radius = 100 } = req.body;
    if (!courseId || !lat || !lng)
      return res.status(400).json({ message: "courseId, lat, lng are required" });

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    await AttendanceSession.updateMany({ teacher: req.user.id, course: courseId, active: true }, { active: false });

    const challenge = generateChallenge(3);
    const expiresAt = new Date(Date.now() + duration * 1000);

    const session = await AttendanceSession.create({
      teacher: req.user.id, course: courseId,
      department: teacher.department,
      challenge, duration, expiresAt, active: true,
      classroom: { lat: Number(lat), lng: Number(lng), radius: Number(radius) },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`dept_${teacher.department}`).emit("session_started", {
        sessionId: session._id, courseId, challenge,
        expiresAt, duration, department: teacher.department,
      });
    }

    // Auto-stop and generate report when session expires
    setTimeout(async () => {
      try {
        const s = await AttendanceSession.findById(session._id);
        if (s && s.active) {
          await generateReport(s);
          const io = req.app.get("io");
          if (io) io.to(`dept_${teacher.department}`).emit("session_ended", { sessionId: s._id });
          if (io) io.to(`session_${s._id}`).emit("report_ready", { sessionId: s._id });
        }
      } catch (e) { console.error("Auto-stop error:", e); }
    }, duration * 1000 + 2000);

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("startSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Teacher: Stop session manually + generate report
exports.stopSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const report = await generateReport(session);

    const io = req.app.get("io");
    if (io) {
      io.to(`dept_${session.department}`).emit("session_ended", { sessionId: session._id });
      io.to(`session_${session._id}`).emit("report_ready", { sessionId: session._id });
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Teacher: Get session with full report
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("course", "name code")
      .populate("teacher", "name")
      .populate("report.entries.student", "name rollNumber");
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Teacher: Get all past sessions
exports.getSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({ teacher: req.user.id })
      .populate("course", "name code")
      .select("course department startTime duration active report.generated report.presentCount report.totalStudents report.generatedAt")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Student: Get active session
exports.getActiveSession = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const session = await AttendanceSession.findOne({
      department: student.department,
      active: true,
      expiresAt: { $gt: new Date() },
    }).populate("course", "name code");

    if (!session) return res.json({ success: true, session: null });

    const alreadySubmitted = session.submissions.some(s => s.student?.toString() === req.user.id);

    res.json({
      success: true,
      session: {
        _id: session._id, challenge: session.challenge,
        expiresAt: session.expiresAt, course: session.course,
        department: session.department, classroom: session.classroom,
      },
      alreadySubmitted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Student: Submit attendance
exports.submitAttendance = async (req, res) => {
  try {
    const { sessionId, answer, lat, lng } = req.body;
    if (!sessionId || !answer || !lat || !lng)
      return res.status(400).json({ message: "sessionId, answer, lat, lng required" });

    const session = await AttendanceSession.findById(sessionId);
    if (!session)        return res.status(404).json({ message: "Session not found" });
    if (!session.active) return res.status(400).json({ message: "Session has ended" });
    if (new Date() > session.expiresAt) return res.status(400).json({ message: "Session expired" });

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const already = session.submissions.some(s => s.student?.toString() === req.user.id);
    if (already) return res.status(400).json({ message: "Already submitted" });

    if (student.department !== session.department)
      return res.status(403).json({ message: "This session is not for your department" });

    const correct = Array.isArray(answer) && answer.length === session.challenge.length &&
      answer.every((n, i) => Number(n) === session.challenge[i]);

    const distance = getDistance(Number(lat), Number(lng), session.classroom.lat, session.classroom.lng);
    const gpsValid = distance <= session.classroom.radius;
    const status   = correct && gpsValid ? "Present" : "Rejected";

    session.submissions.push({
      student: req.user.id, name: student.name, rollNumber: student.rollNumber,
      answer: answer.map(Number), correct, gpsValid,
      lat: Number(lat), lng: Number(lng),
      distance: Math.round(distance), status,
    });
    await session.save();

    if (status === "Present") {
      await Attendance.findOneAndUpdate(
        { student: req.user.id, course: session.course, date: new Date().toDateString() },
        { student: req.user.id, course: session.course, status: "Present", date: new Date() },
        { upsert: true, new: true }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`session_${sessionId}`).emit("student_submitted", {
        studentId: req.user.id, name: student.name, rollNumber: student.rollNumber,
        correct, gpsValid, distance: Math.round(distance), status,
      });
    }

    if (!correct)  return res.status(400).json({ success: false, message: "❌ Wrong number order!", correct, gpsValid });
    if (!gpsValid) return res.status(400).json({ success: false, message: `❌ GPS failed! You are ${Math.round(distance)}m away (max ${session.classroom.radius}m).`, correct, gpsValid, distance: Math.round(distance) });

    res.json({ success: true, message: "✅ Attendance marked successfully!", status });
  } catch (error) {
    console.error("submitAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};