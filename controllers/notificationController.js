const Notification = require("../models/Notification");

// ✅ Get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = notifications.filter(n => !n.read).length;
    res.json({ success: true, notifications, unread });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ✅ Mark one as read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ✅ Mark all as read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ✅ Helper — create notification (used internally by other controllers)
exports.createNotification = async ({ recipient, recipientRole, type, title, message, link, icon }) => {
  try {
    await Notification.create({ recipient, recipientRole, type, title, message, link: link || "", icon: icon || "🔔" });
  } catch (e) { console.error("createNotification error:", e); }
};

// ✅ Helper — notify all students of a department
exports.notifyDepartment = async ({ department, type, title, message, link, icon }) => {
  try {
    const Student = require("../models/Student");
    const students = await Student.find({ department }).select("_id");
    await Notification.insertMany(
      students.map(s => ({ recipient: s._id, recipientRole: "student", type, title, message, link: link || "", icon: icon || "🔔" }))
    );
  } catch (e) { console.error("notifyDepartment error:", e); }
};

// ✅ Helper — notify all students
exports.notifyAllStudents = async ({ type, title, message, link, icon }) => {
  try {
    const Student = require("../models/Student");
    const students = await Student.find().select("_id");
    await Notification.insertMany(
      students.map(s => ({ recipient: s._id, recipientRole: "student", type, title, message, link: link || "", icon: icon || "🔔" }))
    );
  } catch (e) { console.error("notifyAllStudents error:", e); }
};

// ✅ Helper — notify all teachers
exports.notifyAllTeachers = async ({ type, title, message, link, icon }) => {
  try {
    const Teacher = require("../models/Teacher");
    const teachers = await Teacher.find().select("_id");
    await Notification.insertMany(
      teachers.map(t => ({ recipient: t._id, recipientRole: "teacher", type, title, message, link: link || "", icon: icon || "🔔" }))
    );
  } catch (e) { console.error("notifyAllTeachers error:", e); }
};