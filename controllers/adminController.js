const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const Subject = require("../models/subjectModel");
const multer = require("multer");
const xlsx = require("xlsx");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  // Check if there's a user associated with the request
  if (!req.user) {
    return next(new AppError("You need to log in first", 401));
  }

  try {
    const users = await Doctor.find();

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    // Check if the error is due to lack of permission
    if (err.message === "Unauthorized role") {
      // Return an error response indicating lack of permission
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this route",
      });
    }

    // For other errors, pass to the global error handler
    return next(err);
  }
});

exports.getAllStudents = catchAsync(async (req, res, next) => {
  // Check if there's a user associated with the request
  if (!req.user) {
    return next(new AppError("You need to log in first", 401));
  }

  try {
    const users = await Student.find();

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    // Check if the error is due to lack of permission
    if (err.message === "Unauthorized role") {
      // Return an error response indicating lack of permission
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this route",
      });
    }

    // For other errors, pass to the global error handler
    return next(err);
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.createStudent = catchAsync(async (req, res) => {
  // Extract student data from the request body
  const {
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    dateOfAcceptance,
    region,
    gender,
    department,
  } = req.body;

  // Create a new student document
  const student = await Student.create({
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    dateOfAcceptance,
    region,
    gender,
    department,

    // You can set the role to 'student' for new students
  });

  // Send success response
  res.status(201).json({
    status: "success",
    data: {
      student,
    },
  });
});

exports.createDoctor = catchAsync(async (req, res) => {
  // Extract student data from the request body
  const {
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    DateOfHiring,
    region,
    gender,
    department,
  } = req.body;

  // Create a new student document
  const doctor = await Doctor.create({
    name,
    email,
    password,
    passwordConfirm,
    role: "doctor",
    birthDate,
    DateOfHiring,
    region,
    gender,
    department, // You can set the role to 'student' for new students
  });

  // Send success response
  res.status(201).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.addSubject = async (req, res, next) => {
  try {
    const { name, prerequisites, passingGrade, level, department } = req.body;

    // Create the subject
    const subject = await Subject.create({
      name,
      prerequisites,
      passingGrade,
      level,
      department,
    });

    res.status(201).json({
      status: "success",
      data: {
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};
/*
// Endpoint to add subjects to a doctor
exports.addSubjectsToDoctor = async (req, res, next) => {
  try {
    const { doctorId, subjectName } = req.body;

    // Find the doctor by ID
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ status: "error", message: "Doctor not found" });
    }

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if the subject ID already exists in the doctor's subjects array
    if (doctor.subjects.includes(subject._id)) {
      return res
        .status(400)
        .json({ status: "error", message: "Subject already added to doctor" });
    }

    // Update the doctor's subjects array with the found subject ID
    doctor.subjects.push(subject._id);
    await doctor.save();

    res.status(200).json({ status: "success", data: doctor });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
*/
// Endpoint to add subjects to a doctor

exports.addSubjectsToDoctor = async (req, res, next) => {
  try {
    const { doctorId, subjectName } = req.body;

    // Find the doctor by ID
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ status: "error", message: "Doctor not found" });
    }

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if the subject ID already exists in the doctor's subjects array
    if (doctor.subjects.includes(subject._id)) {
      return res.status(400).json({
        status: "error",
        message: "Subject already added to doctor",
      });
    }

    // Update the doctor's subjects array with the found subject ID
    doctor.subjects.push(subject._id);
    await doctor.save();

    res.status(200).json({ status: "success", data: doctor });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
/*
// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename for each uploaded file
  },
});

// Create multer instance with specified storage settings
const upload = multer({ storage: storage });

// Controller to handle file upload
(exports.uploadDegrees = upload.single("file")),
  async (req, res) => {
    try {
      // Get the subject ID from the request body
      const { subjectId } = req.body;

      // Ensure both subject ID and file are provided
      if (!subjectId || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Subject ID and file are required",
        });
      }

      // Get the uploaded file path
      const filePath = req.file.path;

      // Read the uploaded Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      // Iterate over the data and update student documents for the specified subject
      for (const record of data) {
        const { studentId, degree } = record;

        // Find the student by ID
        const student = await Student.findById(studentId);

        // If the student is found, update their degree for the specified subject
        if (student) {
          // Update the degree field for the specified subject
          const subjectIndex = student.subjects.findIndex(
            (subjectRecord) => subjectRecord.subject.toString() === subjectId
          );
          if (subjectIndex !== -1) {
            // Update the degree field of the subject
            student.subjects[subjectIndex].degree = degree;

            // Save the updated student document
            await student.save();
          }
        }
      }

      res
        .status(200)
        .json({ success: true, message: "Degrees uploaded successfully" });
    } catch (error) {
      console.error("Error uploading degrees:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while uploading degrees",
      });
    }
  };
*/
