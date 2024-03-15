const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
