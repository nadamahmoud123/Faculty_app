// subjectRoutes.js

const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const authController = require("../controllers/authController");
const commentController = require("../controllers/commentController");

// Route to get subjects for the logged-in user (student or doctor)
router.get(
  "/my-subjects",
  authController.protect,
  subjectController.getSubjectsByUserRole
);

// Route to create a new comment on a lecture
router.post(
  "/:subjectName/lecture-comments",
  authController.protect,
  commentController.createLectureComment
);

// Route to create a new comment on an assignment
router.post(
  "/assignment-comments",
  authController.protect,
  commentController.createAssignmentComment
);

// Route to get all comments for a lecture
router.get(
  "/lecture-comments/:subjectName/:lectureId",
  authController.protect,
  commentController.getLectureComments
);

// Route to get all comments for an assignment
router.get(
  "/assignment-comments/:assignmentId",
  commentController.getAssignmentComments
);

// Route to reply to a comment
router.post(
  "/comments/:commentId/reply",
  authController.protect,
  commentController.replyToComment
);

module.exports = router;
