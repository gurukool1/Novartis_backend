const fs = require("fs");
const path = require("path");
const multer = require("multer")

// const storage  = multer.diskStorage({
//     destination: (req,file,cb)=>{
         
//          const uploadDir = "uploads/";
        
//             fs.exists(uploadDir, function (exists) {
//               if (!exists) {
//                 fs.mkdirSync(uploadDir, { recursive: true });
//               }
        
//               cb(null, uploadDir);
//     })
// },
//     filename:(req, file, cb)=>{
//       cb(null, Date.now() + "-" + file.originalname);
//     }
// })

// const upload = multer({ storage: storage });

// module.exports = upload




// Set max file size to 50MB






// Maximum file size: 50MB
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";

    fs.exists(uploadDir, (exists) => {
      if (!exists) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// File filter to allow only PDF and DOC/DOCX files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // If file type is not allowed, pass an error to multer
    cb(new Error("Only PDF and DOC/DOCX files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: MAX_SIZE }
});

module.exports = upload;
