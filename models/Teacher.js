// const mongoose = require("mongoose");

// const teacherSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true
//     },
//     department: {
//       type: String,
//       required: true
//     },
//     designation: {
//       type: String,
//       required: true
//     },
//      TeacherIdNumber: {
//       type: String,
//       required: true,
//       unique: true
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Teacher", teacherSchema);

const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "teacher" },

    TeacherIdNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);