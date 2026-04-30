const express = require("express");
const router  = express.Router();
const { firebaseAuth } = require("../controllers/firebaseAuthController");

router.post("/", firebaseAuth);

module.exports = router;