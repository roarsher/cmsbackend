 



const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  subject:   { type: String, required: true },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  room:      { type: String, default: "" },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", default: null },
  attendanceLink: { type: String, default: "" },
});

const routineSchema = new mongoose.Schema(
  {
    date:     { type: Date,   required: true },
    branch:   { type: String, required: true, enum: ["CSE", "ECE", "ME", "CE", "EE"] },
    semester: { type: Number, required: true, min: 1, max: 8 }, // ← NEW
    slots:    [slotSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    locked:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One routine per branch + semester + date
routineSchema.index({ date: 1, branch: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("Routine", routineSchema);