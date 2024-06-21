const mongoose = require("mongoose");
const { Schema } = mongoose;
const Lecture = require("./lectureModel");
const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  passingGrade: {
    type: Number,
    required: true,
  },
  prerequisites: [
    {
      subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    },
  ],
  department: {
    type: String,
    required: true,
    enum: ["Cs", "It", "IS"],
  },
  lectures: [
    {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
    },
  ],
  assignments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
    },
  ],
  hours: {
    type: Number,
    required: true,
    default: 3, // Set default value to 3
  },
});

// Define pre-remove hook
subjectSchema.pre("remove", async function (next) {
  const subjectId = this._id;

  // Remove the subject reference from students
  await mongoose
    .model("Student")
    .updateMany({}, { $pull: { subjects: { subject: subjectId } } });

  // Remove the subject reference from doctors
  await mongoose
    .model("Doctor")
    .updateMany({}, { $pull: { subjects: { subject: subjectId } } });

  next();
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
