const { User } = require('../models');
const MasterAnswerSheet = require('../models/masterAnswerSheet');
const docxParserService = require('../services/docxParser');


const uploadDocx = async (req, res) => {
    const createdBy = req.user.id;
    try {
        const admin = await User.findOne({
            where: { id: createdBy, role: 'admin' }
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const { caseId } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a .docx file.'
            });
        }

        if (!caseId) {
            // Delete uploaded file
            await docxParserService.deleteFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: 'Missing required fields: caseId'
            });
        }

        console.log('File uploaded:', req.file.filename);
        console.log('Case ID:', caseId);



        // Check if master sheet already exists for this case
        const existing = await MasterAnswerSheet.findOne({
            where: { caseId: caseId, isDeleted: 0 }
        });

        if (existing) {
            // Delete uploaded file
            await docxParserService.deleteFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: `Master answer sheet already exists for case ${caseId}. Please delete or update the existing one.`
            });
        }

        // Parse the .docx file
        const parsedData = await docxParserService.parseDocxFile(req.file.path);

        // Validate parsed data
        const validation = docxParserService.validateParsedData(parsedData);

        console.log('Validation result:', validation);

        // Create master answer sheet record
        const masterSheet = await MasterAnswerSheet.create({
            caseId: caseId,
            ...parsedData, // Spread all section data
            createdBy: createdBy,
            isDeleted: 0
        });

        // Optional: Delete the uploaded file after processing
        await docxParserService.deleteFile(req.file.path);

        return res.status(201).json({
            success: true,
            message: 'Master answer sheet created successfully from .docx file',
            data: {
                id: masterSheet.id,
                caseId: masterSheet.caseId,
                totalFields: validation.totalFields,
                emptySections: validation.emptySections,
                createdAt: masterSheet.createdAt
            }
        });

    } catch (error) {
        console.error('Error uploading .docx:', error);

        // Clean up uploaded file on error
        if (req.file) {
            await docxParserService.deleteFile(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: 'Error processing .docx file',
            error: error.message
        });
    }
}



const uploadAnswerSheet = async (req, res) => {
    const userId = req.user.id;
    try {
        const { caseId, ...formData } = req.body;

        if (!caseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: caseId'
            });
        }

        const createdBy = await User.findOne({
            where: { id: userId, role: 'admin' }
        });

        if (!createdBy) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // Check if already exists
        const existing = await MasterAnswerSheet.findOne({
            where: { caseId: caseId, isDeleted: 0 }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Master answer sheet already exists for case ${caseId}`
            });
        }

        // Create master sheet
        const masterSheet = await MasterAnswerSheet.create({
            caseId,
            createdBy,
            ...formData,
            isDeleted: 0
        });

        return res.status(201).json({
            success: true,
            message: 'Master answer sheet created successfully',
            data: {
                id: masterSheet.id,
                caseId: masterSheet.caseId,
                createdAt: masterSheet.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating master sheet:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating master answer sheet',
            error: error.message
        });
    }
}


const getByCaseId = async (req, res) => {
    console.log("step 1", req.user);

    const userId = req.user.id;
    try {
        const { caseId } = req.params;

        const user = await User.findOne({
            where: { id: userId, role: 'admin' }
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const masterSheet = await MasterAnswerSheet.findOne({
            where: { caseId: caseId, isDeleted: 0 }
        });

        if (!masterSheet) {
            return res.status(404).json({
                success: false,
                message: `No master answer sheet found for case ${caseId}`
            });
        }

        return res.status(200).json({
            success: true,
            data: masterSheet
        });

    } catch (error) {
        console.error('Error fetching master sheet:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching master answer sheet',
            error: error.message
        });
    }
}



const updateMasterSheet = async (req, res) => {
    const userId = req.user.id;
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findOne({
            where: { id: userId, role: 'admin' }
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const masterSheet = await MasterAnswerSheet.findByPk(id);

        if (!masterSheet) {
            return res.status(404).json({
                success: false,
                message: 'Master answer sheet not found'
            });
        }

        await masterSheet.update(updateData);

        return res.status(200).json({
            success: true,
            message: 'Master answer sheet updated successfully',
            data: masterSheet
        });

    } catch (error) {
        console.error('Error updating master sheet:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating master answer sheet',
            error: error.message
        });
    }
}

const deleteMasterSheet = async (req, res) => {
    try {
        const { id } = req.params;

        const masterSheet = await MasterAnswerSheet.findByPk(id);

        if (!masterSheet) {
            return res.status(404).json({
                success: false,
                message: 'Master answer sheet not found'
            });
        }

        await masterSheet.update({ isDeleted: 1 });

        return res.status(200).json({
            success: true,
            message: 'Master answer sheet deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting master sheet:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting master answer sheet',
            error: error.message
        });
    }
}




module.exports = {
    uploadDocx,
    uploadAnswerSheet,
    getByCaseId,
    updateMasterSheet,
    deleteMasterSheet
}

