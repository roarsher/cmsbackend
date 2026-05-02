// const Routine = require("../models/Routine");
// const Teacher = require("../models/Teacher");

// const isBeforeDeadline = () => {
//   const now = new Date();
//   return now.getHours() < 10; // before 10:00 AM
// };

// const todayStart = () => {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const todayEnd = () => {
//   const d = new Date();
//   d.setHours(23, 59, 59, 999);
//   return d;
// };

 
// exports.createRoutine = async (req, res) => {
//   try {
//     console.log("📥 BODY:", req.body);
//     console.log("👤 USER:", req.user);

//     const { date, branch, slots } = req.body;

//     // ✅ Validation
//     if (!date || !branch || !slots || !Array.isArray(slots) || slots.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "date, branch and slots are required",
//       });
//     }

//     // ✅ Check user exists
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found",
//       });
//     }

//     // ✅ Deadline logic
//     const routineDate = new Date(date);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const isToday = routineDate.toDateString() === today.toDateString();

//     // 👉 Safe check
//     if (isToday && typeof isBeforeDeadline === "function") {
//       if (!isBeforeDeadline()) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot create today's routine after 10:00 AM",
//         });
//       }
//     }

//     // ✅ Create routine
//     const routine = await Routine.create({
//       date: new Date(date),
//       branch,
//       slots,
//       createdBy: req.user.id,
//     });

//     // ✅ Populate safely
//     await routine.populate([
//       { path: "slots.teacher", select: "name designation" },
//       { path: "slots.course", select: "name code" },
//     ]);

//     res.status(201).json({
//       success: true,
//       routine,
//     });

//   } catch (error) {
//     console.error("❌ CREATE ROUTINE ERROR:", error);

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: `Routine for ${req.body.branch} on this date already exists.`,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// // ✅ Admin: Update routine (before 10 AM for today)
// exports.updateRoutine = async (req, res) => {
//   try {
//     const routine = await Routine.findById(req.params.id);
//     if (!routine) return res.status(404).json({ message: "Routine not found" });

//     const isToday = routine.date.toDateString() === new Date().toDateString();
//     if (isToday && !isBeforeDeadline())
//       return res.status(400).json({ message: "Cannot edit today's routine after 10:00 AM" });

//     const { slots } = req.body;
//     if (slots) routine.slots = slots;
//     await routine.save();
//     await routine.populate("slots.teacher", "name designation");

//     res.json({ success: true, routine });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Admin: Delete routine
// exports.deleteRoutine = async (req, res) => {
//   try {
//     const routine = await Routine.findById(req.params.id);
//     if (!routine) return res.status(404).json({ message: "Routine not found" });

//     const isToday = routine.date.toDateString() === new Date().toDateString();
//     if (isToday && !isBeforeDeadline())
//       return res.status(400).json({ message: "Cannot delete today's routine after 10:00 AM" });

//     await Routine.findByIdAndDelete(req.params.id);
//     res.json({ success: true, message: "Routine deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Admin: Get routines (filter by date/branch)
// exports.getAllRoutines = async (req, res) => {
//   try {
//     const { date, branch } = req.query;
//     let filter = {};
//     if (date) {
//       const d = new Date(date);
//       d.setHours(0,0,0,0);
//       const e = new Date(date);
//       e.setHours(23,59,59,999);
//       filter.date = { $gte: d, $lte: e };
//     }
//     if (branch) filter.branch = branch;

//     const routines = await Routine.find(filter)
//       .populate("slots.teacher", "name designation department")
//       .populate("slots.course", "name code")
//       .sort({ date: -1, branch: 1 });

//     res.json({ success: true, routines });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Teacher: Get today's classes assigned to them
// exports.getMyTodayClasses = async (req, res) => {
//   try {
//     const teacher = await Teacher.findById(req.user.id);
//     if (!teacher) return res.status(404).json({ message: "Teacher not found" });

//     const routines = await Routine.find({
//       date: { $gte: todayStart(), $lte: todayEnd() },
//     })
//       .populate("slots.teacher", "name")
//       .populate("slots.course", "name code");

//     // Filter slots assigned to this teacher
//     const myClasses = [];
//     routines.forEach((r) => {
//       r.slots.forEach((slot) => {
//         if (slot.teacher?._id?.toString() === req.user.id) {
//           myClasses.push({
//             routineId: r._id,
//             branch:    r.branch,
//             date:      r.date,
//             slotId:    slot._id,
//             startTime: slot.startTime,
//             endTime:   slot.endTime,
//             subject:   slot.subject,
//             course:    slot.course,
//             room:      slot.room,
//             sessionId: slot.sessionId,
//             attendanceLink: slot.attendanceLink,
//           });
//         }
//       });
//     });

//     // Sort by start time
//     myClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

//     res.json({ success: true, classes: myClasses, canEdit: isBeforeDeadline() });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Student: Get today's routine for their branch
// exports.getMyBranchRoutine = async (req, res) => {
//   try {
//     const Student = require("../models/Student");
//     const student = await Student.findById(req.user.id);
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const routine = await Routine.findOne({
//       date:   { $gte: todayStart(), $lte: todayEnd() },
//       branch: student.department,
//     })
//       .populate("slots.teacher", "name designation")
//       .populate("slots.course", "name code");

//     res.json({ success: true, routine: routine || null });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };







const Routine = require("../models/Routine");
const Teacher = require("../models/Teacher");

const isBeforeDeadline = () => new Date().getHours() < 10;

const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const todayEnd   = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

// ── Create ────────────────────────────────────────────────────────────────────
exports.createRoutine = async (req, res) => {
  try {
    const { date, branch, semester, slots } = req.body;

    if (!date || !branch || !semester || !slots || !Array.isArray(slots) || slots.length === 0)
      return res.status(400).json({ success: false, message: "date, branch, semester and slots are required" });

    if (!req.user?.id)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const routineDate = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    const isToday = routineDate.toDateString() === today.toDateString();
    if (isToday && !isBeforeDeadline())
      return res.status(400).json({ success: false, message: "Cannot create today's routine after 10:00 AM" });

    const routine = await Routine.create({
      date: new Date(date),
      branch,
      semester: Number(semester),
      slots,
      createdBy: req.user.id,
    });

    await routine.populate([
      { path: "slots.teacher", select: "name designation" },
      { path: "slots.course",  select: "name code semester" },
    ]);

    res.status(201).json({ success: true, routine });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: `Routine for ${req.body.branch} Sem ${req.body.semester} on this date already exists.` });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update ────────────────────────────────────────────────────────────────────
exports.updateRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    const isToday = routine.date.toDateString() === new Date().toDateString();
    if (isToday && !isBeforeDeadline())
      return res.status(400).json({ message: "Cannot edit today's routine after 10:00 AM" });

    if (req.body.slots) routine.slots = req.body.slots;
    await routine.save();
    await routine.populate([
      { path: "slots.teacher", select: "name designation" },
      { path: "slots.course",  select: "name code semester" },
    ]);

    res.json({ success: true, routine });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Delete ────────────────────────────────────────────────────────────────────
exports.deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    const isToday = routine.date.toDateString() === new Date().toDateString();
    if (isToday && !isBeforeDeadline())
      return res.status(400).json({ message: "Cannot delete today's routine after 10:00 AM" });

    await Routine.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Routine deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Get All (Admin) — filter by date, branch, semester ───────────────────────
exports.getAllRoutines = async (req, res) => {
  try {
    const { date, branch, semester } = req.query;
    const filter = {};

    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      filter.date = { $gte: d, $lte: e };
    }
    if (branch)   filter.branch   = branch;
    if (semester) filter.semester = Number(semester);

    const routines = await Routine.find(filter)
      .populate("slots.teacher", "name designation department")
      .populate("slots.course",  "name code semester")
      .sort({ date: -1, branch: 1, semester: 1 });

    res.json({ success: true, routines });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Teacher: today's classes ──────────────────────────────────────────────────
exports.getMyTodayClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const routines = await Routine.find({ date: { $gte: todayStart(), $lte: todayEnd() } })
      .populate("slots.teacher", "name")
      .populate("slots.course",  "name code");

    const myClasses = [];
    routines.forEach((r) => {
      r.slots.forEach((slot) => {
        if (slot.teacher?._id?.toString() === req.user.id) {
          myClasses.push({
            routineId:  r._id,
            branch:     r.branch,
            semester:   r.semester,
            date:       r.date,
            slotId:     slot._id,
            startTime:  slot.startTime,
            endTime:    slot.endTime,
            subject:    slot.subject,
            course:     slot.course,
            room:       slot.room,
          });
        }
      });
    });

    myClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    res.json({ success: true, classes: myClasses, canEdit: isBeforeDeadline() });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Student: today's routine for their branch + semester ──────────────────────
exports.getMyBranchRoutine = async (req, res) => {
  try {
    const Student = require("../models/Student");
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const routine = await Routine.findOne({
      date:     { $gte: todayStart(), $lte: todayEnd() },
      branch:   student.department,
      semester: student.semester,          // ← matches student's exact semester
    })
      .populate("slots.teacher", "name designation")
      .populate("slots.course",  "name code");

    res.json({ success: true, routine: routine || null });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
 