
const mongoose = require("mongoose");

const testLinkSchema = new mongoose.Schema({
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  formUrl:     { type: String, required: true }, // Google Form URL
  department:  { type: String, required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  deadline:    { type: Date },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("TestLink", testLinkSchema);
 

 