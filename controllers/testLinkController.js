
const TestLink = require("../models/TestLink");
const Teacher  = require("../models/Teacher");
const { notifyDepartment } = require("./notificationController");

// ✅ Teacher: Post a test link
exports.createTestLink = async (req, res) => {
  try {
    const { title, description, formUrl, courseId, deadline } = req.body;
    if (!title || !formUrl) return res.status(400).json({ message: "Title and form URL required" });

    const teacher = await Teacher.findById(req.user.id).select("name department");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Convert Google Form share URL to embed URL
    let embedUrl = formUrl;
    if (formUrl.includes("docs.google.com/forms")) {
      embedUrl = formUrl.replace("/viewform", "/viewform?embedded=true").replace("/edit", "/viewform?embedded=true");
      if (!embedUrl.includes("embedded=true")) embedUrl += (embedUrl.includes("?") ? "&" : "?") + "embedded=true";
    }

    const testLink = await TestLink.create({
      teacher:    req.user.id,
      title,
      description,
      formUrl:    embedUrl,
      department: teacher.department,
      course:     courseId || null,
      deadline:   deadline ? new Date(deadline) : null,
    });

    // ✅ Notify all students of this department
    await notifyDepartment({
      department: teacher.department,
      type:       "test",
      title:      `📝 New Test: ${title}`,
      message:    `${teacher.name} posted a new online test. Click to open the form.`,
      link:       `/student/notifications?section=tests&id=${testLink._id}`,
      icon:       "📝",
    });

    res.status(201).json({ success: true, testLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all test links for a department
exports.getTestLinks = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = department ? { department, active: true } : { active: true };
    const tests = await TestLink.find(filter)
      .populate("teacher", "name designation")
      .populate("course", "name code")
      .sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get single test link
exports.getTestLink = async (req, res) => {
  try {
    const test = await TestLink.findById(req.params.id)
      .populate("teacher", "name designation")
      .populate("course", "name code");
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete test link
exports.deleteTestLink = async (req, res) => {
  try {
    await TestLink.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 
