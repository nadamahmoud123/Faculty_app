const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Student = require("./../models/studentModel");
const Subject = require("./../models/subjectModel");
/*
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    const { subjectId } = req.body;

    // Check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subjectId);
    if (!meetsPrerequisites) {
      return next(
        new AppError(
          "Student does not meet prerequisites for this subject",
          403
        )
      );
    }

    // Record the subject for the student
    const subjectRecord = { subject: subjectId, passed: false };
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
*/
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    const { subjectId } = req.body;

    // Check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subjectId);
    if (!meetsPrerequisites) {
      return next(new AppError("Student does not meet prerequisites", 403));
    }

    // Check if the student has already recorded the subject
    const alreadyRecorded = student.subjects.some((subjectRecord) =>
      subjectRecord.subject.equals(subjectId)
    );
    if (alreadyRecorded) {
      return next(new AppError("Subject already recorded", 400));
    }

    // Record the subject for the student
    const subjectRecord = { subject: subjectId, passed: true };
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
