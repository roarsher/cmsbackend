const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { createTestLink, getTestLinks, getTestLink, deleteTestLink } = require("../controllers/testLinkController");

router.post("/",          protect, authorize("teacher"),          createTestLink);
router.get("/",           protect, authorize("student","teacher"), getTestLinks);
router.get("/:id",        protect,                                 getTestLink);
router.delete("/:id",     protect, authorize("teacher"),          deleteTestLink);

module.exports = router;
 