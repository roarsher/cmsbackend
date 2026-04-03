// 

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "admin" },

    adminId: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);