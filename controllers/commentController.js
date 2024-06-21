const Comment = require("../models/commentModel");
const Doctor = require("../models/doctorModel");
const Student = require("../models/studentModel");
const Assignment = require("../models/assigment");
const Lecture = require("../models/lectureModel");
const Subject = require("../models/subjectModel");
const AppError = require("../utils/appError");

// Determine author type from role of logged person
const getAuthorType = (req) => {
  return req.user.role === "doctor" ? "Doctor" : "Student";
};
exports.createLectureComment = async (req, res, next) => {
  try {
    const { lectureId, text } = req.body;
    const authorId = req.user._id;
    const authorType = getAuthorType(req);

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res
        .status(404)
        .json({ status: "error", message: "Lecture not found" });
    }

    const subjectName = lecture.subject; // Assuming lecture contains the subject name

    if (authorType === "Student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(authorId).populate(
        "subjects.subject"
      );

      // Check if the student exists
      if (!student) {
        return res
          .status(404)
          .json({ status: "error", message: "Student not found" });
      }

      // Extract the names of the subjects the student is enrolled in
      const enrolledSubjects = student.subjects.map((sub) => sub.subject._id);
      console.log(enrolledSubjects);
      console.log(lecture.subject);
      // Check if the subject of the lecture is among the enrolled subjects
      if (!enrolledSubjects.includes(lecture.subject)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // Check if the user is a doctor teaching the subject of the lecture
    if (authorType === "Doctor") {
      const doctor = await Doctor.findById(authorId);
      if (!doctor.subjects.includes(lecture.subject._id)) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to comment on this lecture",
        });
      }
    }

    const comment = new Comment({
      text,
      author: authorId,
      authorType,
      subject: lecture.subject,
      lecture: lectureId,
    });

    await comment.save();
    lecture.comments.push(comment);
    await lecture.save();

    res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

exports.createAssignmentComment = async (req, res, next) => {
  try {
    const { assignmentId, text } = req.body;
    const authorId = req.user._id;
    const authorType = getAuthorType(req); // Assuming you have a function to get the author type

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ status: "error", message: "Assignment not found" });
    }

    const subjectId = assignment.subject; // Assuming assignment.subject is an ObjectId

    // Check authorization for students
    if (authorType === "Student") {
      const student = await Student.findById(authorId).populate(
        "subjects.subject"
      );
      if (!student) {
        return res
          .status(404)
          .json({ status: "error", message: "Student not found" });
      }

      const enrolledSubjectIds = student.subjects.map((sub) =>
        sub.subject._id.toString()
      );
      if (!enrolledSubjectIds.includes(subjectId.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // Check authorization for doctors
    if (authorType === "Doctor") {
      const doctor = await Doctor.findById(authorId);
      if (!doctor.subjects.includes(subjectId)) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to comment on this assignment",
        });
      }
    }

    const comment = new Comment({
      text,
      author: authorId,
      authorType,
      subject: assignment.subject,
      assignment: assignmentId,
    });

    await comment.save();
    assignment.comments.push(comment);
    await assignment.save();

    res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};
exports.getLectureComments = async (req, res, next) => {
  try {
    const { lectureId } = req.params;
    const authorId = req.user._id;
    const authorType = getAuthorType(req);

    // Find the lecture by ID and populate comments
    const lecture = await Lecture.findById(lectureId).populate({
      path: "comments",
      populate: {
        path: "author",
        select: "name",
      },
    });

    if (!lecture) {
      return res
        .status(404)
        .json({ status: "error", message: "Lecture not found" });
    }

    const subjectId = lecture.subject;

    // Check authorization for students
    if (authorType === "Student") {
      const student = await Student.findById(authorId).populate(
        "subjects.subject"
      );
      if (!student) {
        return res
          .status(404)
          .json({ status: "error", message: "Student not found" });
      }

      const enrolledSubjectIds = student.subjects.map((sub) =>
        sub.subject._id.toString()
      );
      if (!enrolledSubjectIds.includes(subjectId.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // Check authorization for doctors
    if (authorType === "Doctor") {
      const doctor = await Doctor.findById(authorId);
      if (!doctor.subjects.includes(subjectId)) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to comment on this lecture",
        });
      }
    }

    // Fetch comments from lecture
    const comments = lecture.comments;

    // Debugging step: Log the comments found
    console.log("Lecture ID: ", lectureId);
    // console.log("Comments found: ", comments);

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentComments = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ status: "error", message: "Assignment not found" });
    }

    const comments = await Comment.find({ assignment: assignmentId }).populate(
      "author"
    );

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

exports.replyToComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const authorId = req.user._id;
    const authorType = getAuthorType(req);

    const comment = await Comment.findById(commentId)
      .populate({
        path: "lecture",
        populate: { path: "subject" },
      })
      .populate({
        path: "assignment",
        populate: { path: "subject" },
      });

    if (!comment) {
      return res
        .status(404)
        .json({ status: "error", message: "Comment not found" });
    }

    let subjectId;
    let commentType;

    if (comment.lecture) {
      if (!comment.lecture.subject) {
        return res.status(400).json({
          status: "error",
          message: "Subject not found for the lecture comment",
        });
      }
      subjectId = comment.lecture.subject._id.toString();
      commentType = "lecture";
    } else if (comment.assignment) {
      if (!comment.assignment.subject) {
        return res.status(400).json({
          status: "error",
          message: "Subject not found for the assignment comment",
        });
      }
      subjectId = comment.assignment.subject._id.toString();
      commentType = "assignment";
    } else {
      return res.status(400).json({
        status: "error",
        message: "Comment does not belong to a lecture or assignment",
      });
    }

    // Check if the author is a student and enrolled in the subject
    if (authorType === "Student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(authorId).populate(
        "subjects.subject"
      );

      // Check if the student exists
      if (!student) {
        return res
          .status(404)
          .json({ status: "error", message: "Student not found" });
      }

      // Extract the IDs of the subjects the student is enrolled in
      const enrolledSubjectIds = student.subjects.map((sub) =>
        sub.subject._id.toString()
      );

      // Check if the subject of the comment is among the enrolled subjects
      if (!enrolledSubjectIds.includes(subjectId)) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to reply to this comment",
        });
      }
    }

    // Check if the author is a doctor teaching the subject
    if (authorType === "Doctor") {
      const doctor = await Doctor.findById(authorId);
      if (!doctor.subjects.includes(subjectId)) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to reply to this comment",
        });
      }
    }

    // Add the reply to the comment
    comment.replies.push({ text, author: authorId });
    await comment.save();

    res.status(201).json({
      status: "success",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};
