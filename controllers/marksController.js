const Marks = require("../models/Marks");
const Student = require("../models/Student");

exports.addMarks = async (req, res) => {
  try {
    const { studentId, courseId, marks } = req.body;

    if (!studentId || !courseId || marks == null) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newMarks = await Marks.create({
      student: studentId,
      course: courseId,
      marks
    });

    res.status(201).json(newMarks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentMarks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    const marks = await Marks.find({ student: student._id })
      .populate("course");

    res.json(marks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
