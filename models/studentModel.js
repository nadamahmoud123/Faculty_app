const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: [true, "Please provide a gender"],
  },
  region: {
    type: String,
    required: [true, "Please provide the region"],
  },
  location: String,
  birthDate: {
    type: Date,
    required: [true, "Please provide the birth date"],
  },
  dateOfAcceptance: {
    type: Date,
    required: [true, "Please provide the date of acceptance"],
  },
  department: {
    type: String,
    enum: ["CS", "IT", "IS"],
    required: [true, "Please provide the department"],
  },
  role: {
    default: "student",
    type: String,
    enum: ["student"],
  },
  subjects: [
    {
      subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      passed: { type: Boolean, default: false },
      grade: { type: Number, default: 0 },
    },
  ],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
  passedHours: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
});
studentSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

studentSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

studentSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

studentSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Define the method on the user schema

studentSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

studentSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Method to check if student meets prerequisites for a subject

studentSchema.methods.meetsPrerequisites = async function (subjectId) {
  const subject = await mongoose.model("Subject").findById(subjectId);
  // console.log(subject);
  if (!subject) {
    throw new Error("Subject not found");
  }

  for (const prereq of subject.prerequisites) {
    // Check if the student has enrolled in the prerequisite subject and has passed it
    const passedPrereq = this.subjects.some(
      (s) => s.subject.equals(prereq.subject) && s.passed
    );

    if (!passedPrereq) {
      return false; // Student hasn't passed one of the prerequisites
    }
  }

  return true; // Student meets all prerequisites
};

studentSchema.methods.updateLevel = async function () {
  const hoursPassed = this.hoursPassed;

  // Define the logic to determine the level based on hoursPassed
  if (hoursPassed >= 3) {
    this.level = 2;
  } else if (hoursPassed >= 12) {
    this.level = 3;
  } else if (hoursPassed >= 18) {
    this.level = 4;
  } // Add more conditions as needed

  await this.save();
};
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
