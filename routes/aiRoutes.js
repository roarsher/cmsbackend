const express = require("express");
const router = express.Router();
const { generateChatResponse } = require("../controllers/aiController");
// ✅ IMPORT CONTROLLER PROPERLY
const { generatePerformanceReport } = require("../controllers/aiReportController");


// POST request banayenge frontend se data receive karne ke liye
router.post("/chat", generateChatResponse);
router.get("/report", generatePerformanceReport);


module.exports = router;
 
