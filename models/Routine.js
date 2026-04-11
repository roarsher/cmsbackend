const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  startTime:   { type: String, required: true }, // e.g. "10:00"
  endTime:     { type: String, required: true }, // e.g. "11:00"
  subject:     { type: String, required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  room:        { type: String, default: "" },
  // Live attendance session link (populated when teacher starts session)
  sessionId:   { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", default: null },
  attendanceLink: { type: String, default: "" },
});

const routineSchema = new mongoose.Schema(
  {
    date:       { type: Date,   required: true },
    branch:     { type: String, required: true, enum: ["CSE", "ECE", "ME", "CE", "EE"] },
    slots:      [slotSchema],
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    locked:     { type: Boolean, default: false }, // locked after 10:00 AM
  },
  { timestamps: true }
);

// Compound index — one routine per branch per date
routineSchema.index({ date: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("Routine", routineSchema);