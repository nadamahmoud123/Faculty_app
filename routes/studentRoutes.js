const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authController = require("../controllers/authController");
const subjectController = require("../controllers/subjectController");
const upload = require("../utils/uploadfile");

router.get(
  "/available-subjects",
  authController.protect,
  studentController.getAvailableSubjects
);
// Route to record a subject for a student
router.post(
  "/record-subject",
  authController.protect,
  studentController.recordSubject
);
router.get(
  "/subjects/:subjectName/files",
  authController.protect,
  studentController.getSubjectFilesByName
);
router.get(
  "/subjects/:subjectName/assigments",
  authController.protect,
  studentController.getSubjectAssignments
);

// Route to upload assignment solutions
router.post(
  "/assignments/:assignmentId/upload",
  authController.protect,
  authController.restrictTo("student"),
  upload.single("assignmentFile"),
  studentController.uploadAssignmentSolution
);

module.exports = router;
