//  const mongoose = require("mongoose");

// const attendanceSessionSchema = new mongoose.Schema(
//   {
//     teacher:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
//     course:     { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
//     department: { type: String, required: true },
//     semester: { type: Number, required: true, min: 1, max: 8 }, // added semester for better filtering in reports
//     challenge:  { type: [Number], required: true },
//     startTime:  { type: Date, default: Date.now },
//     duration:   { type: Number, default: 60 },
//     expiresAt:  { type: Date, required: true },
//     active:     { type: Boolean, default: true },

//     classroom: {
//       lat:    { type: Number, required: true },
//       lng:    { type: Number, required: true },
//       radius: { type: Number, default: 100 },
//     },

//     submissions: [
//       {
//         student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//         name:       String,
//         rollNumber: String,
//         answer:     [Number],
//         correct:    Boolean,
//         gpsValid:   Boolean,
//         lat:        Number,
//         lng:        Number,
//         distance:   Number,
//         markedAt:   { type: Date, default: Date.now },
//         status:     { type: String, enum: ["Present", "Rejected"], default: "Present" },
//       },
//     ],

//     // ✅ Final attendance report (generated on session end)
//     report: {
//       generated:    { type: Boolean, default: false },
//       generatedAt:  { type: Date },
//       totalStudents: Number,
//       presentCount:  Number,
//       absentCount:   Number,
//       rejectedCount: Number,
//       // Full student-wise breakdown
//       entries: [
//         {
//           student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//           name:       String,
//           rollNumber: String,
//           status:     { type: String, enum: ["Present", "Absent", "Rejected"] },
//           submittedAt: Date,
//           distance:   Number,
//           gpsValid:   Boolean,
//         },
//       ],
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  name:       String,
  rollNumber: String,
  answer:     [Number],
  correct:    Boolean,
  gpsValid:   Boolean,
  lat:        Number,
  lng:        Number,
  distance:   Number,
  status:     { type: String, enum: ["Present", "Rejected"], default: "Rejected" },
  markedAt:   { type: Date, default: Date.now },
});

const entrySchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  name:        String,
  rollNumber:  String,
  status:      { type: String, enum: ["Present", "Absent", "Rejected"], default: "Absent" },
  submittedAt: Date,
  distance:    Number,
  gpsValid:    Boolean,
}, { _id: false });

const reportSchema = new mongoose.Schema({
  generated:     { type: Boolean, default: false },
  generatedAt:   Date,
  totalStudents: { type: Number, default: 0 },
  presentCount:  { type: Number, default: 0 },
  absentCount:   { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  entries:       [entrySchema],
}, { _id: false });

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    course:     { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },

    // ── Scope fields (ALL THREE are required for correct student filtering) ──
    department: {
      type: String,
      required: true,
      enum: ["CSE", "ECE", "ME", "CE", "EE"],
    },
    semester: {
      type: Number,
      required: true,   // ← was missing before; caused "session required" mismatch
      min: 1,
      max: 8,
    },

    // ── Session config ───────────────────────────────────────────────────────
    challenge:  { type: [Number], required: true },
    duration:   { type: Number, default: 60 },      // seconds
    expiresAt:  { type: Date, required: true },
    active:     { type: Boolean, default: true },
    startTime:  { type: Date, default: Date.now },

    classroom: {
      lat:    { type: Number, required: true },
      lng:    { type: Number, required: true },
      radius: { type: Number, default: 100 },       // metres
    },

    submissions: [submissionSchema],
    report:      { type: reportSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Index for fast active-session lookup by student
attendanceSessionSchema.index({ department: 1, semester: 1, active: 1, expiresAt: 1 });

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);