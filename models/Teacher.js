 const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true },
    email:           { type: String, required: true, unique: true },
    password:        { type: String, required: true, select: false },
    role:            { type: String, default: "teacher" },

    TeacherIdNumber: { type: String, required: true, unique: true },

    // ── Multi-department support (1 to 5) ──────────────────────────
    departments: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 5,
        message: "A teacher must have 1 to 5 departments",
      },
      enum: { values: ["CE", "ME", "EE", "ECE", "CSE"], message: "{VALUE} is not a valid department" },
    },

    designation: { type: String, required: true },

    // ── Courses this teacher is assigned to teach ──────────────────
    assignedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);