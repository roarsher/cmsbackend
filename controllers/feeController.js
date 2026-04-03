 const Fee     = require("../models/Fee");
const Student = require("../models/Student");

const genReceiptNo = () => `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ✅ Admin: Assign fee to a student
exports.assignFee = async (req, res) => {
  try {
    const { studentId, semester, amount, dueDate, feeType, description } = req.body;
    if (!studentId || !semester || !amount || !dueDate)
      return res.status(400).json({ message: "All fields are required" });
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const fee = await Fee.create({ student: studentId, semester, amount, dueDate: new Date(dueDate), feeType, description });
    res.status(201).json({ success: true, fee });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Admin: Assign fee bulk by department
exports.assignFeeBulk = async (req, res) => {
  try {
    const { department, semester, amount, dueDate, feeType, description } = req.body;
    if (!department || !semester || !amount || !dueDate)
      return res.status(400).json({ message: "All fields are required" });
    const students = await Student.find({ department });
    if (students.length === 0) return res.status(404).json({ message: "No students found" });
    const fees = await Fee.insertMany(students.map((s) => ({
      student: s._id, semester, amount, dueDate: new Date(dueDate), feeType, description,
    })));
    res.status(201).json({ success: true, count: fees.length, message: `Fee assigned to ${fees.length} students` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Admin: Mark fee as paid (after verifying proof)
exports.markPaid = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    const paid = Number(req.body.paidAmount) || fee.amount;
    fee.paidAmount = paid;
    fee.paidDate   = new Date();
    fee.status     = paid >= fee.amount ? "Paid" : "Partial";
    fee.receiptNo  = fee.receiptNo || genReceiptNo();
    await fee.save();
    res.json({ success: true, fee });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Admin: Reject payment proof
exports.rejectProof = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    fee.status       = "Unpaid";
    fee.paymentProof = null;
    fee.paymentNote  = null;
    fee.submittedAt  = null;
    await fee.save();
    res.json({ success: true, fee });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Admin: Get all fees
exports.getAllFees = async (req, res) => {
  try {
    const { status, department, semester } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (semester) filter.semester = Number(semester);
    let fees = await Fee.find(filter).populate("student", "name email rollNumber department year").sort({ createdAt: -1 });
    if (department) fees = fees.filter((f) => f.student?.department === department);
    const totalAmount      = fees.reduce((s, f) => s + f.amount, 0);
    const collectedAmount  = fees.reduce((s, f) => s + f.paidAmount, 0);
    const paidCount        = fees.filter((f) => f.status === "Paid").length;
    const unpaidCount      = fees.filter((f) => f.status === "Unpaid").length;
    const partialCount     = fees.filter((f) => f.status === "Partial").length;
    const pendingCount     = fees.filter((f) => f.status === "Pending Verification").length;
    const defaulterCount   = fees.filter((f) => f.status !== "Paid" && new Date(f.dueDate) < new Date()).length;
    res.json({ success: true, fees, stats: { totalAmount, collectedAmount, paidCount, unpaidCount, partialCount, pendingCount, defaulterCount } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Admin: Delete fee
exports.deleteFee = async (req, res) => {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Fee record deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Student: Get my fees
exports.getMyFees = async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.user.id }).sort({ semester: 1, createdAt: -1 });
    const totalDue     = fees.filter((f) => f.status !== "Paid").reduce((s, f) => s + (f.amount - f.paidAmount), 0);
    const totalPaid    = fees.reduce((s, f) => s + f.paidAmount, 0);
    const overdueCount = fees.filter((f) => f.status !== "Paid" && new Date(f.dueDate) < new Date()).length;
    res.json({ success: true, fees, stats: { totalDue, totalPaid, overdueCount } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ✅ Student: Upload payment proof
exports.uploadProof = async (req, res) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, student: req.user.id });
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    if (fee.status === "Paid") return res.status(400).json({ message: "Fee already paid" });

    const { paymentProof, paymentProofName, paymentNote } = req.body;
    if (!paymentProof) return res.status(400).json({ message: "Payment proof is required" });

    fee.paymentProof     = paymentProof;
    fee.paymentProofName = paymentProofName || "receipt";
    fee.paymentNote      = paymentNote || "";
    fee.status           = "Pending Verification";
    fee.submittedAt      = new Date();
    await fee.save();

    res.json({ success: true, message: "Payment proof submitted! Admin will verify shortly.", fee });
  } catch (error) { res.status(500).json({ message: error.message }); }
};