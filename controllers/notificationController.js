// const Notification = require("../models/Notification");

// // ✅ Get my notifications
// exports.getMyNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.find({ recipient: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(50);
//     const unread = notifications.filter(n => !n.read).length;
//     res.json({ success: true, notifications, unread });
//   } catch (e) { res.status(500).json({ message: e.message }); }
// };

// // ✅ Mark one as read
// exports.markRead = async (req, res) => {
//   try {
//     await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user.id },
//       { read: true }
//     );
//     res.json({ success: true });
//   } catch (e) { res.status(500).json({ message: e.message }); }
// };

// // ✅ Mark all as read
// exports.markAllRead = async (req, res) => {
//   try {
//     await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
//     res.json({ success: true });
//   } catch (e) { res.status(500).json({ message: e.message }); }
// };

// // ✅ Helper — create notification (used internally by other controllers)
// exports.createNotification = async ({ recipient, recipientRole, type, title, message, link, icon }) => {
//   try {
//     await Notification.create({ recipient, recipientRole, type, title, message, link: link || "", icon: icon || "🔔" });
//   } catch (e) { console.error("createNotification error:", e); }
// };

// // ✅ Helper — notify all students of a department
// exports.notifyDepartment = async ({ department, type, title, message, link, icon }) => {
//   try {
//     const Student = require("../models/Student");
//     const students = await Student.find({ department }).select("_id");
//     await Notification.insertMany(
//       students.map(s => ({ recipient: s._id, recipientRole: "student", type, title, message, link: link || "", icon: icon || "🔔" }))
//     );
//   } catch (e) { console.error("notifyDepartment error:", e); }
// };

// // ✅ Helper — notify all students
// exports.notifyAllStudents = async ({ type, title, message, link, icon }) => {
//   try {
//     const Student = require("../models/Student");
//     const students = await Student.find().select("_id");
//     await Notification.insertMany(
//       students.map(s => ({ recipient: s._id, recipientRole: "student", type, title, message, link: link || "", icon: icon || "🔔" }))
//     );
//   } catch (e) { console.error("notifyAllStudents error:", e); }
// };

// // ✅ Helper — notify all teachers
// exports.notifyAllTeachers = async ({ type, title, message, link, icon }) => {
//   try {
//     const Teacher = require("../models/Teacher");
//     const teachers = await Teacher.find().select("_id");
//     await Notification.insertMany(
//       teachers.map(t => ({ recipient: t._id, recipientRole: "teacher", type, title, message, link: link || "", icon: icon || "🔔" }))
//     );
//   } catch (e) { console.error("notifyAllTeachers error:", e); }
// };


const Notification = require("../models/Notification");

/* ─────────────────────────────────────────────
   ✅ Get my notifications
───────────────────────────────────────────── */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); // ⚡ faster

    // Optimized unread count (DB-level, not JS filter)
    const unread = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({ success: true, notifications, unread });
  } catch (e) {
    console.error("getMyNotifications error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ─────────────────────────────────────────────
   ✅ Mark one as read
───────────────────────────────────────────── */
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    res.json({ success: true });
  } catch (e) {
    console.error("markRead error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ─────────────────────────────────────────────
   ✅ Mark all as read
───────────────────────────────────────────── */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (e) {
    console.error("markAllRead error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ─────────────────────────────────────────────
   ✅ Create single notification
───────────────────────────────────────────── */
exports.createNotification = async ({
  recipient,
  recipientRole,
  type,
  title,
  message,
  link,
  icon,
}) => {
  try {
    if (!recipient) return;

    await Notification.create({
      recipient,
      recipientRole,
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
    });
  } catch (e) {
    console.error("createNotification error:", e);
  }
};

/* ─────────────────────────────────────────────
   ✅ Notify all students of a department
───────────────────────────────────────────── */
exports.notifyDepartment = async ({
  department,
  type,
  title,
  message,
  link,
  icon,
}) => {
  try {
    const Student = require("../models/Student");

    const students = await Student.find({ department })
      .select("_id")
      .lean(); // ⚡ faster

    if (!students.length) return;

    const notifications = students.map((s) => ({
      recipient: s._id,
      recipientRole: "student",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
    }));

    await Notification.insertMany(notifications);

  } catch (e) {
    console.error("notifyDepartment error:", e);
  }
};

/* ─────────────────────────────────────────────
   ✅ Notify all students
───────────────────────────────────────────── */
exports.notifyAllStudents = async ({
  type,
  title,
  message,
  link,
  icon,
}) => {
  try {
    const Student = require("../models/Student");

    const students = await Student.find()
      .select("_id")
      .lean();

    if (!students.length) return;

    const notifications = students.map((s) => ({
      recipient: s._id,
      recipientRole: "student",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
    }));

    await Notification.insertMany(notifications);

  } catch (e) {
    console.error("notifyAllStudents error:", e);
  }
};

/* ─────────────────────────────────────────────
   ✅ Notify all teachers
───────────────────────────────────────────── */
exports.notifyAllTeachers = async ({
  type,
  title,
  message,
  link,
  icon,
}) => {
  try {
    const Teacher = require("../models/Teacher");

    const teachers = await Teacher.find()
      .select("_id")
      .lean();

    if (!teachers.length) return;

    const notifications = teachers.map((t) => ({
      recipient: t._id,
      recipientRole: "teacher",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
    }));

    await Notification.insertMany(notifications);

  } catch (e) {
    console.error("notifyAllTeachers error:", e);
  }
};