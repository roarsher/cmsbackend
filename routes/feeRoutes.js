 const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  assignFee, assignFeeBulk, markPaid, rejectProof,
  getAllFees, deleteFee, getMyFees, uploadProof,
} = require("../controllers/feeController");

// Admin
router.post("/assign",       protect, authorize("admin"),   assignFee);
router.post("/assign-bulk",  protect, authorize("admin"),   assignFeeBulk);
router.put("/pay/:id",       protect, authorize("admin"),   markPaid);
router.put("/reject/:id",    protect, authorize("admin"),   rejectProof);
router.get("/all",           protect, authorize("admin"),   getAllFees);
router.delete("/:id",        protect, authorize("admin"),   deleteFee);

// Student
router.get("/my",            protect, authorize("student"), getMyFees);
router.put("/proof/:id",     protect, authorize("student"), uploadProof);

module.exports = router;