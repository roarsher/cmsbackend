 const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true },
    email:              { type: String, required: true, unique: true },
    password:           { type: String, required: true, select: false },
    role:               { type: String, default: "student" },

    rollNumber:         { type: String, required: true, unique: true },
    registrationNumber: { type: String, unique: true, sparse: true },
    department:         { type: String, required: true },
    enrollmentYear:     { type: Number, required: true },
    semester:           { type: Number, required: true, min: 1, max: 8 },
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

studentSchema.pre("validate", function () {
  if (this.semester) {
    this.year = Math.ceil(this.semester / 2);
  }
});

module.exports = mongoose.model("Student", studentSchema);