const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

// Route to create a new comment on a lecture
router.post(
  "/lecture-comments",
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
  "/lecture-comments/:lectureId",
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
