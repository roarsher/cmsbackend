//  const mongoose = require("mongoose");

// const courseSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     code: { type: String, required: true, unique: true },
//     department: { type: String, required: true },
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Teacher",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Course", courseSchema);
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    code:       { type: String, required: true, unique: true },
    department: { type: String, required: true, enum: ["CE", "ME", "EE", "ECE", "CSE"] },
    semester:   { type: Number, required: true, min: 1, max: 8 }, // ← NEW
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);