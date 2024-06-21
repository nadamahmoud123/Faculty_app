const multer = require("multer");

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

module.exports = upload;
