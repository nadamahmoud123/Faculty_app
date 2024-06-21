const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const multer = require("multer");
const authController = require("../controllers/authController");
const upload = require("../utils/uploadfile");
//const assignmentController = require("../controllers/assignmentController");
// Set up multer for file upload

router.post(
  "/upload-grades",
  authController.protect, // Ensure user is authenticated
  authController.restrictTo("doctor"), // Ensure user is a doctor
  upload.single("gradesFile"),
  doctorController.uploadGrades
);

// Routes for uploading lectures and assignments
// Routes for uploading lectures and assignments
router.post(
  "/subjects/:subjectName/lectures",
  authController.protect,
  authController.restrictTo("doctor"),
  upload.single("lectureFile"),

  doctorController.uploadLecture
);
router.post(
  "/subjects/:subjectName/assignments",
  authController.protect,
  authController.restrictTo("doctor"),
  upload.single("assignmentFile"),
  doctorController.uploadAssignment
);

// Route to fetch all assignments for a doctor
router.get(
  "/assignments/:assignmentId/solutions",
  authController.protect,
  doctorController.getAssignmentSolutions
);
//router.get('/assignments/:subjectName', doctorController.getAssignmentsBySubject);

module.exports = router;
