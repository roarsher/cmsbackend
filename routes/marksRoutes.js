 const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { addMarks } = require("../controllers/teacherController");
const { getStudentMarks } = require("../controllers/studentController");

// Teacher adds marks
router.post("/", protect, authorize("teacher"), addMarks);

// Student views their own marks
router.get("/my-marks", protect, authorize("student"), getStudentMarks);

module.exports = router;