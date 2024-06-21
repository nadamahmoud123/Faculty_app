const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const Student = require("./../models/studentModel");
const Doctor = require("./../models/doctorModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  // 1) Check if email, password, and role exist
  if (!email || !password || !role) {
    return next(new AppError("Please provide email, password, and role", 400));
  }

  let user;

  // 2) Check if user exists in the User collection
  user = await User.findOne({ email }).select("+password +role");

  // If user not found in the User collection, check the Student collection
  if (!user) {
    user = await Student.findOne({ email }).select("+password +role");
  }
  if (!user) {
    user = await Doctor.findOne({ email }).select("+password +role");
  }

  // 3) Verify password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 4) Verify role
  if (user.role !== role) {
    return next(new AppError("Unauthorized role", 403));
  }

  // 5) If everything is correct, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  try {
    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists in the User model
    let currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      // If user not found in User model, check Student model
      currentUser = await Student.findById(decoded.id);
      // If user not found in Student model, check Doctor model
      if (!currentUser) {
        currentUser = await Doctor.findById(decoded.id);
        if (!currentUser) {
          return next(
            new AppError(
              "The user belonging to this token does no longer exist.",
              401
            )
          );
        }
      }
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    return next(
      new AppError("Invalid token! Please log in again to get access.", 401)
    );
  }
});
exports.logout = (req, res) => {
  try {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: "success" });
  } catch (error) {
    // If an error occurs during logout, handle it and send an error response
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Check if the request body contains an email
  if (!req.body.email) {
    return next(new AppError("Please provide an email address", 400));
  }

  let user;

  // 2) Check User model
  user = await User.findOne({ email: req.body.email });

  // If user not found in User model, check Student model
  if (!user) {
    user = await Student.findOne({ email: req.body.email });
  }

  // If user still not found, check Doctor model
  if (!user) {
    user = await Doctor.findOne({ email: req.body.email });
  }

  // If user not found in any of the models, return error
  if (!user) {
    return next(new AppError("There is no user with that email address.", 404));
  }

  // 3) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 4) Send the response with the reset token
  res.status(200).json({
    status: "success",
    token: resetToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  let user;

  // Check User model
  user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired and there is no user in the User model,
  // check Student model
  if (!user) {
    user = await Student.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // If token has not expired and there is no user in the Student model,
    // check Doctor model
    if (!user) {
      user = await Doctor.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });
    }
  }

  // If token has not expired and there is no user in any of the models,
  // return error
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Reset password based on user type
  if (user instanceof User) {
    // Reset password for User
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
  } else if (user instanceof Student) {
    // Reset password for Student
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
  } else if (user instanceof Doctor) {
    // Reset password for Doctor
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
  }

  // Clear password reset token and expiration
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the user with the updated password
  await user.save();

  // 3) Update changedPasswordAt property for the user (if needed)
  // This step might be specific to your application's requirements

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  let user;

  // Check User model
  user = await User.findById(req.user.id).select("+password");

  // If user not found in User model, check Student model
  if (!user) {
    user = await Student.findById(req.user.id).select("+password");

    // If user not found in Student model, check Doctor model
    if (!user) {
      user = await Doctor.findById(req.user.id).select("+password");
    }
  }

  // If user still not found, return error
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log user in, send JWT
  createSendToken(user, 200, res);
});
