 const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    course:     { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
    department: { type: String, required: true },
    challenge:  { type: [Number], required: true },
    startTime:  { type: Date, default: Date.now },
    duration:   { type: Number, default: 60 },
    expiresAt:  { type: Date, required: true },
    active:     { type: Boolean, default: true },

    classroom: {
      lat:    { type: Number, required: true },
      lng:    { type: Number, required: true },
      radius: { type: Number, default: 100 },
    },

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
        distance:   Number,
        markedAt:   { type: Date, default: Date.now },
        status:     { type: String, enum: ["Present", "Rejected"], default: "Present" },
      },
    ],

    // ✅ Final attendance report (generated on session end)
    report: {
      generated:    { type: Boolean, default: false },
      generatedAt:  { type: Date },
      totalStudents: Number,
      presentCount:  Number,
      absentCount:   Number,
      rejectedCount: Number,
      // Full student-wise breakdown
      entries: [
        {
          student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
          name:       String,
          rollNumber: String,
          status:     { type: String, enum: ["Present", "Absent", "Rejected"] },
          submittedAt: Date,
          distance:   Number,
          gpsValid:   Boolean,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);