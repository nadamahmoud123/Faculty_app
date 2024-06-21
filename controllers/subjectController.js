const Student = require("../models/studentModel");
const Doctor = require("../models/doctorModel");

exports.getSubjectsByUserRole = async (req, res, next) => {
  try {
    // Check if req.user exists and has the role property
    if (!req.user || !req.user.role) {
      console.log(req.user);

      return res.status(403).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    if (req.user.role === "student") {
      const subjects = await exports.getStudentSubjects(req.user.id); // Call using module exports
      return res.status(200).json({ status: "success", data: subjects });
    } else if (req.user.role === "doctor") {
      const subjects = await exports.getDoctorSubjects(req.user.id); // Call using module exports
      return res.status(200).json({ status: "success", data: subjects });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

exports.getStudentSubjects = async (studentId) => {
  const student = await Student.findById(studentId).populate({
    path: "subjects.subject",
    select: "name department level",
  });
  console.log(student);
  const subjects = student.subjects.map((subject) => ({
    name: subject.subject.name,
    department: subject.subject.department,
    level: subject.subject.level,
  }));

  return subjects;
};

exports.getDoctorSubjects = async (doctorId) => {
  try {
    // Find the doctor by ID and populate the 'subjects' field with the actual subject documents
    const doctor = await Doctor.findById(doctorId).populate({
      path: "subjects",
      select: "name department level", // Select the fields you want to include from the populated documents
    });

    // Check if the doctor exists
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Extract the subjects from the populated 'subjects' field
    const subjects = doctor.subjects.map((subject) => ({
      name: subject.name,
      department: subject.department,
      level: subject.level,
    }));

    return subjects;
  } catch (error) {
    throw error; // Pass the error to the calling function
  }
};
