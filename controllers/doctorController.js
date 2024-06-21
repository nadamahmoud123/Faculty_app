const multer = require("multer");
const fs = require("fs");
const Student = require("../models/studentModel");
const xlsx = require("node-xlsx");
const Subject = require("../models/subjectModel");
const Assignment = require("../models/assigment");
const upload = multer({ dest: "uploads/" }); //store in uploads
const Lecture = require("../models/lectureModel"); // Import the Lecture model
const AssignmentSolution = require("../models/AssignmentSolutionModel");

exports.uploadGrades = async (req, res, next) => {
  // Check if the doctor teaches the subject associated with the uploaded grades
  const subjectName = req.body.subjectName; // Assuming subjectName is sent in the request body

  // Find the subject ID based on the subject name
  const subject = await Subject.findOne({ name: subjectName });

  // If subject not found, return error
  if (!subject) {
    return res
      .status(404)
      .json({ status: "error", message: "Subject not found" });
  }

  const subjectId = subject._id;

  // Check if the doctor teaches the subject
  if (!req.user.subjects.includes(subjectId)) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file provided" });
    }

    const jsonData = await parseExcel(req.file.path);

    for (const row of jsonData) {
      try {
        const { studentEmail, studentGrade } = extractStudentInfo(row);

        if (!studentEmail || !studentGrade) {
          console.log("Student email or grade not found in row:", row);
          continue;
        }

        const student = await findStudent(studentEmail);

        if (!student) {
          console.log(`Student with email ${studentEmail} not found`);
          continue;
        }

        await updateStudentGrades(student, subjectId, studentGrade);

        console.log(`Updated grades for student ${student.name}`);
      } catch (error) {
        console.error("Error processing row:", error);
      }
    }

    deleteFile(req.file.path);

    res
      .status(200)
      .json({ status: "success", message: "Grades updated successfully" });
  } catch (error) {
    console.error("Error uploading grades:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

async function parseExcel(filePath) {
  const workSheetsFromFile = xlsx.parse(filePath);
  return workSheetsFromFile[0].data;
}

function extractStudentInfo(row) {
  const emailColumnIndex = 0;
  const gradeColumnIndex = 1;
  return {
    studentEmail: row[emailColumnIndex],
    studentGrade: row[gradeColumnIndex],
  };
}

async function findStudent(email) {
  return await Student.findOne({ email });
}
/*
async function updateStudentGrades(student, subjectId, studentGrade) {
  const subjectIndex = student.subjects.findIndex((subject) =>
    subject.subject.equals(subjectId)
  );
  if (subjectIndex === -1) {
    console.log(`Subject not found for student ${student.name}`);
    return; // Exit function if subject not found
  }

  const subjectDoc = await Subject.findById(subjectId);
  if (!subjectDoc) {
    console.log(`Subject not found: ${subjectId}`);
    return; // Exit function if subject document not found
  }

  const passingGrade = subjectDoc.passingGrade;

  // Get the current passed status of the subject for the student
  const passedBefore = student.subjects[subjectIndex].passed;

  // Update grade and pass status for the specific subject
  student.subjects[subjectIndex].grade = studentGrade;
  student.subjects[subjectIndex].passed = studentGrade >= passingGrade;

  // If the student passed the subject and it was not passed before, update passedHours
  if (student.subjects[subjectIndex].passed && !passedBefore) {
    // Add the hours of the passed subject to passedHours
    student.passedHours += subjectDoc.hours;

    // Update student's level based on passedHours
    if (student.passedHours >= 3 && student.passedHours < 6) {
      student.level = 2;
    } else if (student.passedHours >= 6 && student.passedHours < 12) {
      student.level = 3;
    } else if (student.passedHours >= 12 && student.passedHours < 18) {
      student.level = 4;
    } else if (student.passedHours >= 18) {
      student.level = 5;
    }
  }

  await student.save();
}
*/
/*
async function updateStudentGrades(student, subjectId, studentGrade) {
  const subjectIndex = student.subjects.findIndex((subject) =>
    subject.subject.equals(subjectId)
  );
  if (subjectIndex === -1) {
    console.log(`Subject not found for student ${student.name}`);
    return; // Exit function if subject not found
  }

  const subjectDoc = await Subject.findById(subjectId);
  if (!subjectDoc) {
    console.log(`Subject not found: ${subjectId}`);
    return; // Exit function if subject document not found
  }

  const passingGrade = subjectDoc.passingGrade;

  // Get the current passed status and grade of the subject for the student
  const passedBefore = student.subjects[subjectIndex].passed;
  const previousGrade = student.subjects[subjectIndex].grade;

  // Update grade and pass status for the specific subject
  student.subjects[subjectIndex].grade = studentGrade;
  student.subjects[subjectIndex].passed = studentGrade >= passingGrade;

  // If the student passed the subject and it was not passed before, or if the grade changed
  if (
    (student.subjects[subjectIndex].passed && !passedBefore) ||
    previousGrade !== studentGrade
  ) {
    // Update passedHours if the grade changed
    if (previousGrade !== studentGrade) {
      if (student.subjects[subjectIndex].passed) {
        // Subtract the hours of the previously failed subject and add the hours of the passed subject
        student.passedHours +=
          subjectDoc.hours - student.subjects[subjectIndex].hours;
      } else {
        // Add the hours of the passed subject
        student.passedHours += subjectDoc.hours;
      }
    }

    // Update student's level based on passedHours
    if (student.passedHours >= 3 && student.passedHours < 6) {
      student.level = 2;
    } else if (student.passedHours >= 6 && student.passedHours < 12) {
      student.level = 3;
    } else if (student.passedHours >= 12 && student.passedHours < 18) {
      student.level = 4;
    } else if (student.passedHours >= 18) {
      student.level = 5;
    }
  }

  await student.save();
}
*/
async function updateStudentGrades(student, subjectId, studentGrade) {
  try {
    const subjectIndex = student.subjects.findIndex((subject) =>
      subject.subject.equals(subjectId)
    );

    if (subjectIndex === -1) {
      throw new Error(`Subject not found for student ${student.name}`);
    }

    const subjectDoc = await Subject.findById(subjectId);

    if (!subjectDoc) {
      throw new Error(`Subject not found: ${subjectId}`);
    }

    const passingGrade = subjectDoc.passingGrade;

    // Get the current passed status of the subject for the student
    const passedBefore = student.subjects[subjectIndex].passed;

    // Update grade and pass status for the specific subject
    student.subjects[subjectIndex].grade = studentGrade;
    student.subjects[subjectIndex].passed = studentGrade >= passingGrade;

    // If the student passed the subject and it was not passed before, update passedHours
    if (student.subjects[subjectIndex].passed && !passedBefore) {
      // Add the hours of the passed subject to passedHours
      student.passedHours += subjectDoc.hours;
    } else if (!student.subjects[subjectIndex].passed && passedBefore) {
      // Subtract the hours of the subject if the grade changes from passing to failing
      student.passedHours -= subjectDoc.hours;
    }

    // Update student's level based on passedHours
    if (student.passedHours >= 3 && student.passedHours < 6) {
      student.level = 2;
    } else if (student.passedHours >= 6 && student.passedHours < 12) {
      student.level = 3;
    } else if (student.passedHours >= 12 && student.passedHours < 18) {
      student.level = 4;
    } else if (student.passedHours >= 18) {
      student.level = 5;
    }

    await student.save();
  } catch (error) {
    console.error(`Error updating grades for student ${student.name}:`, error);
    throw error; // Re-throw the error to handle it at a higher level
  }
}

function deleteFile(filePath) {
  fs.unlinkSync(filePath);
}
exports.uploadLecture = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const { title } = req.body;
    const fileUrl = req.file.path; // Assuming multer has saved the file to disk

    // Find the subject ID based on the subject name
    const subject = await Subject.findOne({ name: subjectName });

    // If subject not found, return error
    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    const subjectId = subject._id;

    // Check if the doctor teaches the subject
    if (!req.user.subjects.includes(subjectId)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // Create a new Lecture document
    const lecture = new Lecture({ title, fileUrl, subject: subject._id });

    // Save the new lecture
    await lecture.save();

    res
      .status(201)
      .json({ status: "success", message: "Lecture uploaded successfully" });
  } catch (error) {
    next(error);
  }
};
exports.uploadAssignment = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const { title, deadline } = req.body;
    const fileUrl = req.file.path; // Assuming multer has saved the file to disk

    // Find the subject ID based on the subject name
    const subject = await Subject.findOne({ name: subjectName });

    // If subject not found, return error
    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    // Check if the user is a doctor
    if (req.user.role !== "doctor") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    const subjectId = subject._id;

    // Check if the doctor teaches the subject
    if (!req.user.subjects.includes(subjectId)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // Create a new Assignment document
    const assignment = new Assignment({
      title,
      fileUrl,
      subject: subject._id,
      deadline,
    });

    // Save the new assignment
    await assignment.save();

    res
      .status(201)
      .json({ status: "success", message: "Assignment uploaded successfully" });
  } catch (error) {
    next(error);
  }
};
exports.getAssignmentSolutions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    // Find the assignment by ID
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res
        .status(404)
        .json({ status: "error", message: "Assignment not found" });
    }

    // Check if the user is a doctor
    if (req.user.role !== "doctor") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // Retrieve all assignment solutions for the specified assignment
    const assignmentSolutions = await AssignmentSolution.find({
      assignment: assignmentId,
    });

    // Return the assignment solutions
    res.status(200).json({
      status: "success",
      data: {
        assignmentSolutions,
      },
    });
  } catch (error) {
    next(error);
  }
};
