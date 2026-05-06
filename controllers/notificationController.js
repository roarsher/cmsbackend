 

// const Notification = require("../models/Notification");

// /* ─────────────────────────────────────────────
//    ✅ Get my notifications
// ───────────────────────────────────────────── */
// exports.getMyNotifications = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const notifications = await Notification.find({ recipient: userId })
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .lean(); // ⚡ faster

//     // Optimized unread count (DB-level, not JS filter)
//     const unread = await Notification.countDocuments({
//       recipient: userId,
//       read: false,
//     });

//     res.json({ success: true, notifications, unread });
//   } catch (e) {
//     console.error("getMyNotifications error:", e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Mark one as read
// ───────────────────────────────────────────── */
// exports.markRead = async (req, res) => {
//   try {
//     await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user.id },
//       { read: true },
//       { new: true }
//     );

//     res.json({ success: true });
//   } catch (e) {
//     console.error("markRead error:", e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Mark all as read
// ───────────────────────────────────────────── */
// exports.markAllRead = async (req, res) => {
//   try {
//     await Notification.updateMany(
//       { recipient: req.user.id, read: false },
//       { read: true }
//     );

//     res.json({ success: true });
//   } catch (e) {
//     console.error("markAllRead error:", e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Create single notification
// ───────────────────────────────────────────── */
// exports.createNotification = async ({
//   recipient,
//   recipientRole,
//   type,
//   title,
//   message,
//   link,
//   icon,
// }) => {
//   try {
//     if (!recipient) return;

//     await Notification.create({
//       recipient,
//       recipientRole,
//       type,
//       title,
//       message,
//       link: link || "",
//       icon: icon || "🔔",
//     });
//   } catch (e) {
//     console.error("createNotification error:", e);
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Notify all students of a department
// ───────────────────────────────────────────── */
// exports.notifyDepartment = async ({
//   department,
//   type,
//   title,
//   message,
//   link,
//   icon,
// }) => {
//   try {
//     const Student = require("../models/Student");

//     const students = await Student.find({ department })
//       .select("_id")
//       .lean(); // ⚡ faster

//     if (!students.length) return;

//     const notifications = students.map((s) => ({
//       recipient: s._id,
//       recipientRole: "student",
//       type,
//       title,
//       message,
//       link: link || "",
//       icon: icon || "🔔",
//     }));

//     await Notification.insertMany(notifications);

//   } catch (e) {
//     console.error("notifyDepartment error:", e);
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Notify all students
// ───────────────────────────────────────────── */
// exports.notifyAllStudents = async ({
//   type,
//   title,
//   message,
//   link,
//   icon,
// }) => {
//   try {
//     const Student = require("../models/Student");

//     const students = await Student.find()
//       .select("_id")
//       .lean();

//     if (!students.length) return;

//     const notifications = students.map((s) => ({
//       recipient: s._id,
//       recipientRole: "student",
//       type,
//       title,
//       message,
//       link: link || "",
//       icon: icon || "🔔",
//     }));

//     await Notification.insertMany(notifications);

//   } catch (e) {
//     console.error("notifyAllStudents error:", e);
//   }
// };

// /* ─────────────────────────────────────────────
//    ✅ Notify all teachers
// ───────────────────────────────────────────── */
// exports.notifyAllTeachers = async ({
//   type,
//   title,
//   message,
//   link,
//   icon,
// }) => {
//   try {
//     const Teacher = require("../models/Teacher");

//     const teachers = await Teacher.find()
//       .select("_id")
//       .lean();

//     if (!teachers.length) return;

//     const notifications = teachers.map((t) => ({
//       recipient: t._id,
//       recipientRole: "teacher",
//       type,
//       title,
//       message,
//       link: link || "",
//       icon: icon || "🔔",
//     }));

//     await Notification.insertMany(notifications);

//   } catch (e) {
//     console.error("notifyAllTeachers error:", e);
//   }
// };

const Notification = require("../models/Notification");

// ── GET /notifications ────────────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unread = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({ success: true, notifications, unread });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── PUT /notifications/:id/read ───────────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── PUT /notifications/read-all ───────────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS — call these from other controllers, not from routes
// ─────────────────────────────────────────────────────────────────────────────

// Generic single notification
exports.createNotification = async ({
  recipient,
  recipientRole,
  type,
  title,
  message,
  link,
  icon,
  extraData,
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
      extraData: extraData || {},
    });
  } catch (e) {
    console.error("createNotification error:", e);
  }
};

// Bulk — array of { recipient, recipientRole }
exports.createBulkNotifications = async ({
  recipients,
  type,
  title,
  message,
  link,
  icon,
  extraData,
}) => {
  try {
    if (!recipients?.length) return;
    const docs = recipients.map((r) => ({
      recipient: r.recipient || r._id,
      recipientRole: r.recipientRole || r.role || "student",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
      extraData: extraData || {},
    }));
    await Notification.insertMany(docs);
  } catch (e) {
    console.error("createBulkNotifications error:", e);
  }
};

// ── NOTICE POSTED (teacher or admin) ─────────────────────────────────────────
// sender = "teacher" → notify all students of that teacher's courses + admin
// sender = "admin"   → notify all students + all teachers
//
// IMPORTANT: pass `adminId` when senderRole is "teacher" so the admin
// receives the notification.  Pass fully populated courseStudents / allTeachers
// / allStudents arrays (at minimum { _id } on each object).
//
// extraData stored per notification:
//   noticeId       – MongoDB _id of the notice document
//   noticeTitle    – notice title (used by frontend PDF generator)
//   noticeMessage  – full notice body (used by frontend PDF generator)
//   downloadable   – true  (tells frontend to show a PDF action badge)
//   createdAt      – ISO timestamp (for PDF date line)
exports.notifyNoticePosted = async ({
  notice,
  senderRole,
  senderName,
  courseStudents,
  allTeachers,
  allStudents,
  adminId, // pass the admin's ObjectId when senderRole === "teacher"
}) => {
  try {
    // Build the extraData payload once – reused for every recipient so the
    // frontend PDF generator has everything it needs without another API call.
    const extraData = {
      noticeId: notice._id,
      noticeTitle: notice.title,
      noticeMessage: notice.message,
      downloadable: true,
      createdAt: notice.createdAt || new Date().toISOString(),
    };

    const docs = [];

    if (senderRole === "teacher") {
      // → enrolled students of teacher's courses
      (courseStudents || []).forEach((s) => {
        if (!s._id) return;
        docs.push({
          recipient: s._id,
          recipientRole: "student",
          type: "notice",
          title: `📢 Notice: ${notice.title}`,
          message: `${senderName} posted a notice: ${notice.message.slice(0, 100)}`,
          icon: "📢",
          link: "/student/notifications?section=notices",
          extraData,
        });
      });

      // → notify admin (requires adminId to be passed by the caller)
      if (adminId) {
        docs.push({
          recipient: adminId,
          recipientRole: "admin",
          type: "notice",
          title: `📢 Teacher Notice: ${notice.title}`,
          message: `${senderName}: ${notice.message.slice(0, 100)}`,
          icon: "📢",
          link: "/admin/notifications?section=notices",
          extraData,
        });
      } else {
        // Fallback: look up the first admin in the DB so we never silently drop the notification
        try {
          const Admin = require("../models/Admin");
          const admin = await Admin.findOne().select("_id").lean();
          if (admin) {
            docs.push({
              recipient: admin._id,
              recipientRole: "admin",
              type: "notice",
              title: `📢 Teacher Notice: ${notice.title}`,
              message: `${senderName}: ${notice.message.slice(0, 100)}`,
              icon: "📢",
              link: "/admin/notifications?section=notices",
              extraData,
            });
          }
        } catch (adminErr) {
          console.error("notifyNoticePosted – could not resolve admin:", adminErr);
        }
      }
    } else if (senderRole === "admin") {
      // → all students
      (allStudents || []).forEach((s) => {
        if (!s._id) return;
        docs.push({
          recipient: s._id,
          recipientRole: "student",
          type: "notice",
          title: `📢 Notice: ${notice.title}`,
          message: notice.message.slice(0, 120),
          icon: "📢",
          link: "/student/notifications?section=notices",
          extraData,
        });
      });

      // → all teachers
      (allTeachers || []).forEach((t) => {
        if (!t._id) return;
        docs.push({
          recipient: t._id,
          recipientRole: "teacher",
          type: "notice",
          title: `📢 Notice: ${notice.title}`,
          message: notice.message.slice(0, 120),
          icon: "📢",
          link: "/teacher/notifications?section=notices",
          extraData,
        });
      });
    }

    const valid = docs.filter((d) => d.recipient);
    if (valid.length) await Notification.insertMany(valid);
  } catch (e) {
    console.error("notifyNoticePosted error:", e);
  }
};

// ── TEST LINK POSTED (teacher → students of their courses) ───────────────────
exports.notifyTestLink = async ({
  testTitle,
  testUrl,
  message,
  courseStudents,
  senderName,
}) => {
  try {
    if (!courseStudents?.length) return;
    const docs = courseStudents.map((s) => ({
      recipient: s._id,
      recipientRole: "student",
      type: "test_link",
      title: `📝 Online Test: ${testTitle}`,
      message: message || `${senderName} has shared a test for you`,
      icon: "📝",
      link: "/student/notifications?section=tests",
      extraData: {
        googleFormUrl: testUrl,
        testTitle,
      },
    }));
    await Notification.insertMany(docs);
  } catch (e) {
    console.error("notifyTestLink error:", e);
  }
};

// ── ROUTINE PUBLISHED (admin → teachers of that branch + students of that branch) ─
//
// IMPORTANT: pass `routine` already populated with:
//   routine.slots[].teacher  { _id, name }
//   routine.slots[].course   { _id, name, code }
//   routine.slots[].room
//
// The full slots array is stored in extraData so the frontend can generate
// a PDF without any additional API call.
exports.notifyRoutinePublished = async ({ routine, branchTeachers, branchStudents }) => {
  try {
    const dateStr = new Date(routine.date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    // Serialise slots to plain objects (in case they are Mongoose docs)
    const slots = (routine.slots || []).map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject,
      room: s.room || null,
      teacher: s.teacher
        ? { _id: s.teacher._id?.toString(), name: s.teacher.name }
        : null,
      course: s.course
        ? {
            _id: s.course._id?.toString(),
            name: s.course.name,
            code: s.course.code,
          }
        : null,
    }));

    const extraData = {
      routineId: routine._id?.toString(),
      branch: routine.branch,
      date: routine.date,
      slots, // full slot data – frontend uses this to render PDF with no extra call
    };

    const docs = [];

    // Teachers of this branch
    (branchTeachers || []).forEach((t) => {
      if (!t._id) return;
      docs.push({
        recipient: t._id,
        recipientRole: "teacher",
        type: "routine",
        title: `📅 Routine: ${routine.branch} — ${dateStr}`,
        message: `Class routine published for ${routine.branch} on ${dateStr}. Tap to view & download PDF.`,
        icon: "📅",
        link: "/teacher/notifications?section=routine",
        extraData,
      });
    });

    // Students of this branch
    (branchStudents || []).forEach((s) => {
      if (!s._id) return;
      docs.push({
        recipient: s._id,
        recipientRole: "student",
        type: "routine",
        title: `📅 Class Routine — ${dateStr}`,
        message: `Your class routine for ${dateStr} has been published. Tap to view & download PDF.`,
        icon: "📅",
        link: "/student/notifications?section=routine",
        extraData,
      });
    });

    if (docs.length) await Notification.insertMany(docs);
  } catch (e) {
    console.error("notifyRoutinePublished error:", e);
  }
};

// ── Notify department students ─────────────────────────────────────────────────
exports.notifyDepartment = async ({
  department,
  type,
  title,
  message,
  link,
  icon,
  extraData,
}) => {
  try {
    const Student = require("../models/Student");
    const students = await Student.find({ department }).select("_id").lean();
    if (!students.length) return;
    const docs = students.map((s) => ({
      recipient: s._id,
      recipientRole: "student",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
      extraData: extraData || {},
    }));
    await Notification.insertMany(docs);
  } catch (e) {
    console.error("notifyDepartment error:", e);
  }
};

// ── Notify all students ───────────────────────────────────────────────────────
exports.notifyAllStudents = async ({ type, title, message, link, icon, extraData }) => {
  try {
    const Student = require("../models/Student");
    const students = await Student.find().select("_id").lean();
    if (!students.length) return;
    const docs = students.map((s) => ({
      recipient: s._id,
      recipientRole: "student",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
      extraData: extraData || {},
    }));
    await Notification.insertMany(docs);
  } catch (e) {
    console.error("notifyAllStudents error:", e);
  }
};

// ── Notify all teachers ───────────────────────────────────────────────────────
exports.notifyAllTeachers = async ({ type, title, message, link, icon, extraData }) => {
  try {
    const Teacher = require("../models/Teacher");
    const teachers = await Teacher.find().select("_id").lean();
    if (!teachers.length) return;
    const docs = teachers.map((t) => ({
      recipient: t._id,
      recipientRole: "teacher",
      type,
      title,
      message,
      link: link || "",
      icon: icon || "🔔",
      extraData: extraData || {},
    }));
    await Notification.insertMany(docs);
  } catch (e) {
    console.error("notifyAllTeachers error:", e);
  }
};