const mongoose = require("mongoose");
///////////
const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "authorType",
    required: true,
  },
  authorType: {
    type: String,
    required: true,
    enum: ["Doctor", "Student"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: function () {
      return !this.assignment;
    },
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: function () {
      return !this.lecture;
    },
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  replies: [
    {
      text: {
        type: String,
        required: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
