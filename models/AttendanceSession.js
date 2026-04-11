const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    course:     { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
    department: { type: String, required: true },

    // Random number challenge
    challenge:  { type: [Number], required: true }, // e.g. [3, 7, 2]

    // Session timing
    startTime:  { type: Date, default: Date.now },
    duration:   { type: Number, default: 60 },      // seconds
    expiresAt:  { type: Date, required: true },
    active:     { type: Boolean, default: true },

    // Classroom GPS
    classroom: {
      lat:     { type: Number, required: true },
      lng:     { type: Number, required: true },
      radius:  { type: Number, default: 100 },      // meters allowed
    },

    // Students who submitted
    submissions: [
      {
        student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        name:       String,
        rollNumber: String,
        answer:     [Number],
        correct:    Boolean,
        gpsValid:   Boolean,
        lat:        Number,
        lng:        Number,
        distance:   Number,  // meters from classroom
        markedAt:   { type: Date, default: Date.now },
        status:     { type: String, enum: ["Present", "Rejected"], default: "Present" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);