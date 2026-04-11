const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createRoutine, updateRoutine, deleteRoutine, getAllRoutines,
  getMyTodayClasses, getMyBranchRoutine,
} = require("../controllers/routineController");

// Admin
router.post("/",          protect, authorize("admin"),   createRoutine);
router.put("/:id",        protect, authorize("admin"),   updateRoutine);
router.delete("/:id",     protect, authorize("admin"),   deleteRoutine);
router.get("/all",        protect, authorize("admin"),   getAllRoutines);

// Teacher
router.get("/my-today",   protect, authorize("teacher"), getMyTodayClasses);

// Student
router.get("/my-branch",  protect, authorize("student"), getMyBranchRoutine);

module.exports = router;