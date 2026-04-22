// const express = require("express");
// const router = express.Router();
// const { generateChatResponse } = require("../controllers/aiController");
// // ✅ IMPORT CONTROLLER PROPERLY
// const { generatePerformanceReport } = require("../controllers/aiReportController");


// // POST request banayenge frontend se data receive karne ke liye
// router.post("/chat", generateChatResponse);
// router.get("/report", generatePerformanceReport);


// module.exports = router;
 
const express = require("express");
const router  = express.Router();
const { chat } = require("../controllers/aiChatController");
const { generatePerformanceReport } = require("../controllers/aiReportController");

router.post("/chat",   chat);
router.get("/report",  generatePerformanceReport);

module.exports = router;