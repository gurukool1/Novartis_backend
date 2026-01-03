const express = require("express");
const multer = require("multer");
const User = require("../models/userModel");
const Case = require("../models/caseModel");
const fs = require("fs");
const path = require("path");
const adminController = require("../Controllers/adminController");
const verifyToken = require("../Middleware/verifyToken");
const upload = require("../Middleware/multer");
 const registerSchema = require("../validations/registrationSchema")
 const validate = require('../Middleware/validate');


const router = express.Router();





function multerErrorHandler(req, res, next) {
  upload.single("file")(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        status: false,
        message: err.message || "File upload error",
      });
    }
    next();
  });
}


//router.post("/admin/upload-case",verifyToken, upload.single("file"), adminController.uploadCase);
router.post("/admin/view-users",verifyToken, adminController.viewUsers);
router.post('/admin/upload-case', verifyToken, multerErrorHandler, adminController.uploadCase);
router.post("/admin/view-cases", verifyToken, adminController.viewCases);
router.post("/admin/assign-case", verifyToken, adminController.assignCase);
router.post("/admin/assign-case-to-multiple-users", verifyToken, adminController.assignCaseToMultipleUsers);
router.post("/admin/unassign-case", verifyToken, adminController.unAssignCase);
router.post("/admin/fetch-all-case-data", verifyToken, adminController.fetchAllCaseData);
router.post("/admin/assigned-cases", verifyToken, adminController.assignedCases);
router.post("/admin/get-assigned-users", verifyToken, adminController.getAssignedUsersForCase);
router.post("/admin/get-total-assigned-users", verifyToken, adminController.getTotalAssignedUsers);
router.post("/admin/submitted-cases", verifyToken, adminController.submittedCases);
router.post("/admin/filter-by-case-id", verifyToken, adminController.filterByCaseId);
router.post("/admin/is-active", verifyToken, adminController.isActive);
router.post("/admin/delete-account", verifyToken, adminController.deleteAccount);
router.post("/admin/delete-case", verifyToken, adminController.deleteCase);
router.post("/admin/delete-user", verifyToken, adminController.deleteUser);
router.post("/admin/admin-dashboard", verifyToken, adminController.adminDashBoard);
router.post("/admin/edit-user-details", verifyToken, adminController.editUserDetails);




module.exports = router;
