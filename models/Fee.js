 const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    student:            { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    semester:           { type: Number, required: true, min: 1, max: 8 },
    amount:             { type: Number, required: true },
    dueDate:            { type: Date, required: true },
    paidDate:           { type: Date },
    status:             { type: String, enum: ["Unpaid", "Paid", "Partial", "Pending Verification"], default: "Unpaid" },
    paidAmount:         { type: Number, default: 0 },
    feeType:            { type: String, enum: ["Tuition", "Hostel", "Exam", "Library", "Other"], default: "Tuition" },
    description:        { type: String },
    receiptNo:          { type: String, unique: true, sparse: true },
    // ✅ Payment proof uploaded by student
    paymentProof:       { type: String }, // base64 or filename
    paymentProofName:   { type: String },
    paymentNote:        { type: String }, // e.g. "UTR: 123456789"
    submittedAt:        { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);