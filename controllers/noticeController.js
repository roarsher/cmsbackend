 

// const Notice = require("../models/Notice");
// const { notifyAllStudents, notifyAllTeachers } = require("./notificationController");

// exports.createNotice = async (req, res) => {
//   try {
//     const { title, message } = req.body;
//     if (!title || !message) return res.status(400).json({ message: "Title and message required" });

//     const notice = await Notice.create({ title, message });

//     // ✅ Notify all students and teachers
//     await Promise.all([
//       notifyAllStudents({ type: "notice", title: "📢 New Notice: " + title, message, link: "/student/dashboard", icon: "📢" }),
//       notifyAllTeachers({ type: "notice", title: "📢 New Notice: " + title, message, link: "/teacher", icon: "📢" }),
//     ]);

//     res.status(201).json(notice);
//   } catch (error) { res.status(500).json({ message: error.message }); }
// };

// exports.getAllNotices = async (req, res) => {
//   try {
//     const notices = await Notice.find().sort({ createdAt: -1 });
//     res.json(notices);
//   } catch (error) { res.status(500).json({ message: error.message }); }
// };

// exports.deleteNotice = async (req, res) => {
//   try {
//     await Notice.findByIdAndDelete(req.params.id);
//     res.json({ message: "Notice deleted" });
//   } catch (error) { res.status(500).json({ message: error.message }); }
// };


const Notice = require("../models/Notice");
const { notifyAllStudents, notifyAllTeachers, createNotification } = require("./notificationController");

exports.createNotice = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message required" });

    const notice = await Notice.create({ title, message });

    // ✅ Notify all students AND teachers
    await Promise.all([
      notifyAllStudents({
        type:    "notice",
        title:   `📢 Notice: ${title}`,
        message: message.slice(0, 100),
        link:    `/student/notifications?section=notices&id=${notice._id}`,
        icon:    "📢",
      }),
      notifyAllTeachers({
        type:    "notice",
        title:   `📢 Notice: ${title}`,
        message: message.slice(0, 100),
        link:    `/teacher/notifications?section=notices&id=${notice._id}`,
        icon:    "📢",
      }),
    ]);

    res.status(201).json(notice);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};


