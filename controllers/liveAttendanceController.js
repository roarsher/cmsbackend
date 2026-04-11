const AttendanceSession = require("../models/AttendanceSession");
const Attendance        = require("../models/Attendance");
const Teacher           = require("../models/Teacher");
const Student           = require("../models/Student");

// ── Helper: generate random unique numbers ────────────────────────────────────
const generateChallenge = (count = 3) => {
  const nums = Array.from({ length: 9 }, (_, i) => i + 1); // 1-9
  const shuffled = nums.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// ── Helper: calculate distance between two GPS coords (Haversine) ─────────────
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R    = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ✅ Teacher: Start a live attendance session
exports.startSession = async (req, res) => {
  try {
    const { courseId, duration = 60, lat, lng, radius = 100 } = req.body;

    if (!courseId || !lat || !lng)
      return res.status(400).json({ message: "courseId, lat, lng are required" });

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Close any existing active session for this teacher+course
    await AttendanceSession.updateMany(
      { teacher: req.user.id, course: courseId, active: true },
      { active: false }
    );

    const challenge  = generateChallenge(3);
    const expiresAt  = new Date(Date.now() + duration * 1000);

    const session = await AttendanceSession.create({
      teacher:    req.user.id,
      course:     courseId,
      department: teacher.department,
      challenge,
      duration,
      expiresAt,
      active: true,
      classroom: { lat: Number(lat), lng: Number(lng), radius: Number(radius) },
    });

    // Emit via Socket.io so students get notified instantly
    const io = req.app.get("io");
    if (io) {
      io.to(`dept_${teacher.department}`).emit("session_started", {
        sessionId:  session._id,
        courseId,
        challenge,
        expiresAt,
        duration,
        department: teacher.department,
      });
    }

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("startSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Teacher: Stop session manually
exports.stopSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { active: false },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: "Session not found" });

    const io = req.app.get("io");
    if (io) io.to(`dept_${session.department}`).emit("session_ended", { sessionId: session._id });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Teacher: Get session status + submissions
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("course", "name code")
      .populate("submissions.student", "name rollNumber");
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
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Student: Get active session for their department
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

    // Check if already submitted
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
        classroom:  session.classroom,
      },
      alreadySubmitted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Student: Submit attendance answer
exports.submitAttendance = async (req, res) => {
  try {
    const { sessionId, answer, lat, lng } = req.body;

    if (!sessionId || !answer || !lat || !lng)
      return res.status(400).json({ message: "sessionId, answer, lat, lng required" });

    const session = await AttendanceSession.findById(sessionId);
    if (!session)       return res.status(404).json({ message: "Session not found" });
    if (!session.active) return res.status(400).json({ message: "Session has ended" });
    if (new Date() > session.expiresAt)
      return res.status(400).json({ message: "Session has expired" });

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✔ Check not already submitted
    const already = session.submissions.some(
      (s) => s.student?.toString() === req.user.id
    );
    if (already) return res.status(400).json({ message: "You have already submitted attendance" });

    // ✔ Check department match
    if (student.department !== session.department)
      return res.status(403).json({ message: "This session is not for your department" });

    // ✔ Check answer correctness
    const correct =
      Array.isArray(answer) &&
      answer.length === session.challenge.length &&
      answer.every((n, i) => Number(n) === session.challenge[i]);

    // ✔ Check GPS distance
    const distance = getDistance(
      Number(lat), Number(lng),
      session.classroom.lat, session.classroom.lng
    );
    const gpsValid = distance <= session.classroom.radius;

    const status = correct && gpsValid ? "Present" : "Rejected";

    // Save submission
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

    // ✔ Mark attendance in DB only if both checks pass
    if (status === "Present") {
      await Attendance.findOneAndUpdate(
        { student: req.user.id, course: session.course, date: new Date().toDateString() },
        { student: req.user.id, course: session.course, status: "Present", date: new Date() },
        { upsert: true, new: true }
      );
    }

    // Emit real-time update to teacher
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

    if (!correct)   return res.status(400).json({ success: false, message: "❌ Wrong order! Numbers were incorrect.", correct, gpsValid });
    if (!gpsValid)  return res.status(400).json({ success: false, message: `❌ GPS failed! You are ${Math.round(distance)}m away from classroom (max ${session.classroom.radius}m).`, correct, gpsValid, distance: Math.round(distance) });

    res.json({ success: true, message: "✅ Attendance marked successfully!", status });
  } catch (error) {
    console.error("submitAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};