const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authController = require("../controllers/authController");

// Route to record a subject for a student
router.post(
  "/record-subject",
  authController.protect,
  studentController.recordSubject
);

module.exports = router;
