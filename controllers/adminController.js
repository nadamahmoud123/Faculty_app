const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Student = require("../models/studentModel");
const Subject = require("../models/subjectModel");
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
    const users = await User.find();

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
  const doctor = await User.create({
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
    const { name, prerequisites } = req.body;

    // Create the subject
    const subject = await Subject.create({ name, prerequisites });

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
