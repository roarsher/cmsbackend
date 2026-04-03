//  const express = require("express");
// const router = express.Router();
// const authController = require("../controllers/authController");

// // Register (student or teacher)
// router.post("/register", authController.register);

// // Login (admin/student/teacher)
// router.post("/login", authController.login);

// // Get logged-in user profile
// router.get("/me", authController.getMe);

// module.exports = router;

 const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register (admin/student/teacher)
router.post("/register", authController.register);

// Login (admin/student/teacher)
router.post("/login", authController.login);

// Get logged-in user profile
router.get("/me", authController.getMe);

module.exports = router;