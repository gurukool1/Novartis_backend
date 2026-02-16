const evaluationOrchestrator = require('../utils/evaluationOrchestrator');
const evaluationStats = require('../utils/evaluationStats');

/**
 * Controller to handle evaluation-related HTTP requests
 */
class EvaluationController {

    /**
     * Trigger evaluation for a specific user submission
     * This will be called automatically when user submits form
     */
    async triggerEvaluation(req, res) {
        try {
            const { formId, userCaseId, caseId } = req.body;

            if (!formId || !userCaseId || !caseId) {
                return res.status(200).json({
                    success: false,
                    message: 'Missing required fields: formId, userCaseId, caseId'
                });
            }

            // Run evaluation
            const result = await evaluationOrchestrator.runEvaluation(
                formId,
                userCaseId,
                caseId,
                req.user?.id // Pass admin ID if available
            );

            return res.status(200).json(result);

        } catch (error) {
            console.error('Error in triggerEvaluation:', error);
            return res.status(200).json({
                success: false,
                message: 'Error running evaluation',
                error: error.message
            });
        }
    }

    /**
     * Get evaluation report by evaluation ID
     */
    async getReport(req, res) {
        try {
            const { evaluationId } = req.params;

            const report = await evaluationOrchestrator.getEvaluationReport(evaluationId);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Evaluation report not found'
                });
            }

            // Group discrepancies by section for better readability
            const groupedDiscrepancies = evaluationStats.groupBySection(report.discrepancies);

            return res.status(200).json({
                success: true,
                report: {
                    id: report.id,
                    userCaseId: report.userCaseId,
                    totalFields: report.totalFields,
                    matchedFields: report.matchedFields,
                    mismatchedFields: report.mismatchedFields,
                    accuracyPercentage: report.accuracyPercentage,
                    evaluatedAt: report.evaluatedAt,
                    discrepancies: report.discrepancies,
                    groupedDiscrepancies: groupedDiscrepancies
                }
            });

        } catch (error) {
            console.error('Error in getReport:', error);
            return res.status(200).json({
                success: false,
                message: 'Error fetching evaluation report',
                error: error.message
            });
        }
    }

    /**
     * Get evaluation report for a specific user case
     */
    async getReportByUserCase(req, res) {
        try {
            const { userCaseId } = req.params;

            const report = await evaluationOrchestrator.getEvaluationByUserCaseId(userCaseId);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'No evaluation found for this user case'
                });
            }

            const groupedDiscrepancies = evaluationStats.groupBySection(report.discrepancies);

            return res.status(200).json({
                success: true,
                report: {
                    id: report.id,
                    userCaseId: report.userCaseId,
                    totalFields: report.totalFields,
                    matchedFields: report.matchedFields,
                    mismatchedFields: report.mismatchedFields,
                    accuracyPercentage: report.accuracyPercentage,
                    evaluatedAt: report.evaluatedAt,
                    discrepancies: report.discrepancies,
                    groupedDiscrepancies: groupedDiscrepancies
                }
            });

        } catch (error) {
            console.error('Error in getReportByUserCase:', error);
            return res.status(200).json({
                success: false,
                message: 'Error fetching evaluation report',
                error: error.message
            });
        }
    }
}

module.exports = new EvaluationController();