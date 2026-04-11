 const express = require("express");
const router  = express.Router();

const {
  getAllStudents,
  getAllTeachers,
  deleteStudent,
  deleteTeacher,
  createCourse,
} = require("../controllers/adminController");

const {
  createNotice,
  getAllNotices,
  deleteNotice,
} = require("../controllers/noticeController");

// Students
router.get("/students",        getAllStudents);
router.delete("/students/:id", deleteStudent);

// Teachers
router.get("/teachers",        getAllTeachers);
router.delete("/teachers/:id", deleteTeacher);

// Courses
router.post("/create-course",  createCourse);

// Notices
router.post("/notices",        createNotice);
router.get("/notices",         getAllNotices);
router.delete("/notices/:id",  deleteNotice);

// Courses (for admin use)
router.get("/courses", async (req, res) => {
  try {
    const Course = require("../models/Course");
    const courses = await Course.find().select("name code department");
    res.json({ success: true, courses });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;