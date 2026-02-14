const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
// const authMiddleware = require('../middleware/auth'); // Your auth middleware

// Manual trigger (admin can manually trigger evaluation)
router.post('/evaluation/trigger', evaluationController.triggerEvaluation);

// Get evaluation report by evaluation ID
router.get('/evaluation/report/:evaluationId', evaluationController.getReport);

// Get evaluation report by user case ID
router.get('/evaluation/report/user-case/:userCaseId', evaluationController.getReportByUserCase);

module.exports = router;