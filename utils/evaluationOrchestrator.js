const MasterAnswerSheet = require('../models/MasterAnswerSheet');
const ValidationRule = require('../models/ValidationRule');
const EvaluationReport = require('../models/EvaluationReport');
const Form = require('../models/formsModel'); // Your existing Form model
const comparisonEngine = require('./comparisionEngine.js');
const evaluationStats = require('./evaluationStats.js');
const formDataConverter = require('./formDataConverter.js');



const runEvaluation = async (formId, caseId, evaluatedBy = null) => {
    try {
        console.log(`Starting evaluation for formId: ${formId}, caseId: ${caseId}`);

        // Step 1: Check if master answer sheet exists
        const masterSheet = await getMasterSheet(caseId);

        if (!masterSheet) {
            console.log(`No master answer sheet found for caseId: ${caseId}`);
            return {
                success: false,
                message: 'No master answer sheet available for this case',
                evaluationSkipped: true
            };
        }

        // Step 2: Get user's form submission
        const userForm = await Form.findByPk(formId);

        if (!userForm) {
            throw new Error(`Form not found with id: ${formId}`);
        }

        // Step 3: Convert both Form models to comparable JSON
        const masterData = formDataConverter.convertToJSON(masterSheet);
        const userData = formDataConverter.convertToJSON(userForm);

        console.log(`Master data sections: ${Object.keys(masterData).length}`, Object.keys(masterData));
        console.log(`User data sections: ${Object.keys(userData).length}`, Object.keys(userData));

        // ===== FULL DEBUG: Show ALL section values for user data =====
        console.log('\n[DEBUG] ===== ALL USER SECTION DATA =====');
        Object.entries(userData).forEach(([section, value]) => {
            console.log(`[DEBUG] User[${section}]:`, JSON.stringify(value));
        });

        console.log('\n[DEBUG] ===== ALL MASTER SECTION DATA =====');
        Object.entries(masterData).forEach(([section, value]) => {
            console.log(`[DEBUG] Master[${section}]:`, JSON.stringify(value));
        });
        // ==========================================================

        // Step 4: Get validation rules
        const validationRules = await getValidationRules(caseId);
        console.log(`Found ${validationRules.length} validation rules`);

        // Step 5: Perform comparison
        const comparisons = comparisonEngine.compareSubmission(
            masterData,
            userData,
            validationRules
        );

        console.log(`Compared ${comparisons.length} fields`);

        // Step 6: Calculate statistics
        const stats = evaluationStats.calculateStats(comparisons);

        // Step 7: Extract discrepancies
        const discrepancies = evaluationStats.getDiscrepancies(comparisons);

        console.log(`Found ${discrepancies.length} discrepancies`);

        // Step 8: Save evaluation report to database
        const reportData = {
            formId: formId,
            caseId: caseId,
            totalFields: stats.totalFields,
            matchedFields: stats.matchedFields,
            mismatchedFields: stats.mismatchedFields,
            accuracyPercentage: stats.accuracyPercentage,
            discrepancies: discrepancies,
            evaluatedAt: new Date(),
            evaluatedBy: evaluatedBy
        };

        const savedReport = await saveEvaluationReport(reportData);

        console.log(`Evaluation report saved with ID: ${savedReport.id}`);

        return {
            success: true,
            evaluationId: savedReport.id,
            stats: stats,
            discrepancies: discrepancies,
            discrepancyCount: discrepancies.length,
            message: `Evaluation completed: ${stats.accuracyPercentage}% accuracy`
        };

    } catch (error) {
        console.error('Error in runEvaluation:', error);
        throw error;
    }
}


const getMasterSheet = async (caseId) => {
    try {
        const masterSheet = await MasterAnswerSheet.findOne({
            where: {
                caseId: caseId,
                isDeleted: 0
            }
        });

        return masterSheet;
    } catch (error) {
        console.error('Error fetching master sheet:', error);
        throw error;
    }
}


const getValidationRules = async (caseId) => {
    try {
        const rules = await ValidationRule.findAll({
            where: {
                caseId: caseId,
                isDeleted: 0
            }
        });

        return rules;
    } catch (error) {
        console.error('Error fetching validation rules:', error);
        throw error;
    }
}

const saveEvaluationReport = async (reportData) => {
    try {
        const report = await EvaluationReport.create(reportData);
        return report;
    } catch (error) {
        console.error('Error saving evaluation report:', error);
        throw error;
    }
}


const getEvaluationReport = async (evaluationId) => {
    try {
        const report = await EvaluationReport.findByPk(evaluationId, {
            where: { isDeleted: 0 }
        });
        return report;
    } catch (error) {
        console.error('Error fetching evaluation report:', error);
        throw error;
    }
}


const getEvaluationByFormId = async (formId) => {
    try {
        const report = await EvaluationReport.findOne({
            where: {
                formId: formId,
                isDeleted: 0
            },
            order: [['evaluatedAt', 'DESC']] // Get latest evaluation
        });

        return report;
    } catch (error) {
        console.error('Error fetching evaluation by formId:', error);
        throw error;
    }
}


// const getEvaluationByUserCaseId = async (userCaseId) => {
//     try {
//         const report = await EvaluationReport.findOne({
//             where: {
//                 userCaseId: userCaseId,
//                 isDeleted: 0
//             },
//             order: [['evaluatedAt', 'DESC']] // Get latest evaluation
//         });

//         return report;
//     } catch (error) {
//         console.error('Error fetching evaluation by userCaseId:', error);
//         throw error;
//     }
// }


module.exports = {
    runEvaluation,
    getMasterSheet,
    getValidationRules,
    saveEvaluationReport,
    getEvaluationReport,
    getEvaluationByFormId,
    // getEvaluationByUserCaseId
}