 const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true, select: false },
    role:       { type: String, default: "student" },

    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year:       { type: Number, required: true, min: 1, max: 4 },

    // ✅ Auto-assigned courses based on department at registration
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);
studentSchema.methods.assignNumbers = function (rollSerial, regSerial) {
  this.rollNumber = `RN-${rollSerial}-${Date.now()}`;
  this.registrationNumber = `REG-${regSerial}-${Date.now()}`;
  this.year = Math.ceil(this.semester / 2);
};

module.exports = mongoose.model("Student", studentSchema);