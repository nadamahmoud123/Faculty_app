const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Student = require("./../models/studentModel");
const Subject = require("./../models/subjectModel");
const Assignment = require("./../models/assigment");
const Lecture = require("./../models/lectureModel");
const AssignmentSolution = require("../models/AssignmentSolutionModel");

// Controller function to record a subject for a student
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Extract the subject name from the request body
    const { subjectName } = req.body;

    // Check if the subject exists
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subject._id);
    if (!meetsPrerequisites) {
      return next(new AppError("Student does not meet prerequisites", 403));
    }

    // Check if the student has already recorded the subject
    const alreadyRecorded = student.subjects.some((subjectRecord) =>
      subjectRecord.subject.equals(subject._id)
    );
    if (alreadyRecorded) {
      return next(new AppError("Subject already recorded", 400));
    }

    // Record the subject for the student
    const subjectRecord = { subject: subject._id, passed: false };
    student.subjects.push(subjectRecord);
    await student.save();

    res.status(200).json({
      status: "success",
      data: {
        student,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

exports.getSubjectFilesByName = async (req, res, next) => {
  try {
    const { subjectName } = req.params;

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });

    // Check if subject exists
    if (!subject) {
      return res.status(404).json({
        status: "error",
        message: "Subject not found",
      });
    }

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject.name);
      if (!enrolledSubjects.includes(subjectName)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // If the logged-in user is a doctor
    if (req.user.role === "doctor") {
      // Check if the doctor teaches the requested subject
      if (!req.user.subjects.includes(subject._id.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not assigned to this subject",
        });
      }
    }

    // Get the lectures for the specified subject
    const lectures = await Lecture.find({ subject: subject._id });

    // Return the lecture files along with subject data
    res.status(200).json({
      status: "success",
      data: {
        lectures: lectures,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getSubjectAssignments = async (req, res, next) => {
  try {
    const { subjectName } = req.params;

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });

    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject.name);
      if (!enrolledSubjects.includes(subjectName)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // If the logged-in user is a doctor
    if (req.user.role === "doctor") {
      // Check if the doctor teaches the requested subject
      if (!req.user.subjects.includes(subject._id.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not assigned to this subject",
        });
      }
    }

    // Fetch all assignments for the specific subject
    const assignments = await Assignment.find({ subject: subject._id });

    res.status(200).json({ status: "success", data: { assignments } });
  } catch (error) {
    next(error);
  }
};
exports.uploadAssignmentSolution = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const fileUrl = req.file.path; // Assuming multer has saved the file to disk
    const userId = req.user._id; // Assuming userId is available in the request user object
    // Find the assignment by ID
    const assignment = await Assignment.findById(assignmentId);

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject._id);
      if (!enrolledSubjects.includes(assignment.subject)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // Check if assignment exists
    if (!assignment) {
      return res
        .status(404)
        .json({ status: "error", message: "Assignment not found" });
    }
    // Check if the deadline has passed
    const now = new Date();
    if (now > assignment.deadline) {
      return res.status(403).json({
        status: "error",
        message: "Deadline has passed. You cannot upload your solution.",
      });
    }

    // Create a new AssignmentSolution document
    const assignmentSolution = new AssignmentSolution({
      assignment: assignmentId,
      student: userId,
      fileUrl: fileUrl,
    });

    // Save the new assignment solution
    await assignmentSolution.save();

    res.status(201).json({
      status: "success",
      message: "Assignment solution uploaded successfully",
      data: {
        assignmentSolution,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getAvailableSubjects = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Get subjects that the student has already recorded and passed
    const passedSubjects = student.subjects
      .filter((subject) => subject.passed)
      .map((subject) => subject.subject);
    const availableSubjects = await Subject.find({
      $and: [
        {
          $or: [
            { prerequisites: { $exists: false } }, // Subjects with no prerequisites
            { prerequisites: { $size: 0 } }, // Subjects with empty prerequisites array
            {
              prerequisites: {
                $elemMatch: { subject: { $in: passedSubjects } },
              },
            }, // Subjects with prerequisites matching passed subjects
          ],
        },
        { _id: { $nin: passedSubjects } }, // Exclude passed subjects
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        subjects: availableSubjects.map((subject) => subject.name),
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});
