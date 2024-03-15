const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
//const userController = require("../controllers/adminController");
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);
router.get("/logout", authController.logout);

router.patch("/updateMyPassword", authController.updatePassword);
//router.get("/me", userController.getMe, userController.getUser);
//router.patch("/updateMe", userController.updateMe);

router.use(authController.restrictTo("admin"));

router.route("/students").get(adminController.getAllStudents);
router.route("/doctors").get(adminController.getAllDoctors);
router
  .route("/createStudent")

  .post(adminController.createStudent);
router.route("/createDoctor").post(adminController.createDoctor);
router.route("/addsubject").post(adminController.addSubject);
router
  .route("/:id")
  .get(adminController.getUser)
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

module.exports = router;
