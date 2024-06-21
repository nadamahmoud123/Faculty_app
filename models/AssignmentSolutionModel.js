const mongoose = require("mongoose");

const assignmentSolutionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  comments: [
    {
      text: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming the comment author can be either a Student or a Doctor
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const AssignmentSolution = mongoose.model(
  "AssignmentSolution",
  assignmentSolutionSchema
);

module.exports = AssignmentSolution;
