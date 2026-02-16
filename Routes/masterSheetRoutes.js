const express = require('express');
const router = express.Router();
const masterSheetController = require('../Controllers/masterSheetController');
const upload = require('../Middleware/multer');
const verifyToken = require('../Middleware/verifyToken');
// const authMiddleware = require('../middleware/auth'); // Your auth middleware

// Upload .docx file to create master sheet
router.post('/upload-docx', verifyToken, upload.single('file'), masterSheetController.uploadDocx);

// Create master sheet manually with JSON
router.post('/upload-answer-sheet', verifyToken, masterSheetController.uploadAnswerSheet);

// Get master sheet by case ID
router.post('/get-master-sheet/:caseId', verifyToken, masterSheetController.getByCaseId);

// Update master sheet
router.put('/update-master-sheet/:id', verifyToken, masterSheetController.updateMasterSheet);

// Delete master sheet (soft delete)
router.delete('/delete-master-sheet/:id', verifyToken, masterSheetController.deleteMasterSheet);


module.exports = router;