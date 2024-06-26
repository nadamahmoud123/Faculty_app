const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const AppError = require("./utils/appError");
const adminRouter = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const globalErrorHandler = require("./controllers/errorController");
const doctors = require("./routes/doctorRoutes");
const subjectsRoutes = require("./routes/subjectRoutes");
const app = express();
const commentRoutes = require("./routes/commentRoutes");
// 1) global middlewares......

// Set security HTTP headers
app.use(helmet());
// Body parser, reading data from body into req.body
app.use(express.json());
app.use(morgan());
// data sintization against NoSQL query injection
// this look at req.body and req.query string and req.params and filter out all of $ and . from it
app.use(mongoSanitize());

// data santiziation against cross-site-script attacks (xss)
app.use(xss());

// This is often used to track when a request was received.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use("/api/user", adminRouter);
app.use("/api/students", studentRoutes);
app.use("/api/doctors", doctors);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/comments", commentRoutes);
// catch-all for any routes that haven't been handled by previous route handlers
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
app.use(morgan("combined"));
module.exports = app;
