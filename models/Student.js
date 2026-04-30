 const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true },
    email:              { type: String, required: true, unique: true },
    password:           { type: String, required: true, select: false },
    role:               { type: String, default: "student" },

    rollNumber:         { type: String, required: true, unique: true },
    registrationNumber: { type: String, unique: true, sparse: true }, // ← ADD
    department:         { type: String, required: true },
    enrollmentYear:     { type: Number, required: true },             // ← ADD
    semester:           { type: Number, required: true, min: 1, max: 8 }, // ← ADD
    year:               { type: Number, required: true, min: 1, max: 4 },

    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

// Auto-derive year from semester before saving
studentSchema.pre("validate", function (next) {
  if (this.semester) {
    this.year = Math.ceil(this.semester / 2);
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);