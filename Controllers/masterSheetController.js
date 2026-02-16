const { User } = require('../models');
const MasterAnswerSheet = require('../models/masterAnswerSheet');
const docxParserService = require('../services/docxParser');


// const uploadDocx = async (req, res) => {
//     const createdBy = req.user.id;
//     try {
//         const admin = await User.findOne({
//             where: { id: createdBy, role: 'admin' }
//         });

//         if (!admin) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Unauthorized access'
//             });
//         }

//         const { caseId } = req.body;

//         // Check if file was uploaded
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No file uploaded. Please upload a .docx file.'
//             });
//         }

//         if (!caseId) {
//             // Delete uploaded file
//             await docxParserService.deleteFile(req.file.path);

//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: caseId'
//             });
//         }

//         console.log('File uploaded:', req.file.filename);
//         console.log('Case ID:', caseId);



//         // Check if master sheet already exists for this case
//         const existing = await MasterAnswerSheet.findOne({
//             where: { caseId: caseId, isDeleted: 0 }
//         });

//         if (existing) {
//             // Delete uploaded file
//             await docxParserService.deleteFile(req.file.path);

//             return res.status(400).json({
//                 success: false,
//                 message: `Master answer sheet already exists for case ${caseId}. Please delete or update the existing one.`
//             });
//         }

//         // Parse the .docx file
//         const parsedData = await docxParserService.parseDocxFile(req.file.path);

//         // Validate parsed data
//         const validation = docxParserService.validateParsedData(parsedData);

//         console.log('Validation result:', validation);

//         // Create master answer sheet record
//         const masterSheet = await MasterAnswerSheet.create({
//             caseId: caseId,
//             ...parsedData, // Spread all section data
//             createdBy: createdBy,
//             isDeleted: 0
//         });

//         // Optional: Delete the uploaded file after processing
//         await docxParserService.deleteFile(req.file.path);

//         return res.status(201).json({
//             success: true,
//             message: 'Master answer sheet created successfully from .docx file',
//             data: {
//                 id: masterSheet.id,
//                 caseId: masterSheet.caseId,
//                 totalFields: validation.totalFields,
//                 emptySections: validation.emptySections,
//                 createdAt: masterSheet.createdAt
//             }
//         });

//     } catch (error) {
//         console.error('Error uploading .docx:', error);

//         // Clean up uploaded file on error
//         if (req.file) {
//             await docxParserService.deleteFile(req.file.path);
//         }

//         return res.status(500).json({
//             success: false,
//             message: 'Error processing .docx file',
//             error: error.message
//         });
//     }
// }

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

        // Create the data object to save
        const dataToSave = {
            caseId: caseId,
            ...parsedData,
            createdBy: createdBy,
            isDeleted: 0
        };

        // Create master answer sheet record
        const masterSheet = await MasterAnswerSheet.create(dataToSave);

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
        const { caseId, formData } = req.body;

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

        const form = await MasterAnswerSheet.create({
            caseId,
            createdBy: createdBy.dataValues.id,
            MMT_8_initial: formData.MMT_8_initial || {},
            CDASI_Activity_initial: formData.CDASI_Activity_initial || {},
            CDASI_Damage_initial: formData.CDASI_Damage_initial || {},
            Gottron_Hands_initial: formData.Gottron_Hands_initial || {},
            Periungual_initial: formData.Periungual_initial || {},
            Alopecia_initial: formData.Alopecia_initial || {},
            MDAAT_initial: formData.MDAAT_initial || {},
            MMT_8_followUp: formData.MMT_8_followUp || {},
            CDASI_Activity_followUp: formData.CDASI_Activity_followUp || {},
            CDASI_Damage_followUp: formData.CDASI_Damage_followUp || {},
            Gottron_Hands_followUp: formData.Gottron_Hands_followUp || {},
            Periungual_followUp: formData.Periungual_followUp || {},
            Alopecia_followUp: formData.Alopecia_followUp || {},
            MDAAT_followUp: formData.MDAAT_followUp || {},
            Physician_initial: formData.Physician_initial || {},
            Physician_followUp: formData.Physician_followUp || {},
            isDeleted: 0
        });

        // // Create master sheet
        // const masterSheet = await MasterAnswerSheet.create({
        //     caseId,
        //     createdBy,
        //     ...formData,
        //     isDeleted: 0
        // });

        return res.status(201).json({
            success: true,
            message: 'Master answer sheet created successfully',
            data: {
                id: form.id,
                caseId: form.caseId,
                createdAt: form.createdAt
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

        const { id, formData } = req.body;

        const user = await User.findOne({
            where: { id: userId, role: 'admin' }
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const masterSheet = await MasterAnswerSheet.findAll({
            where: { id: id, isDeleted: 0 }
        })

        if (!masterSheet) {
            return res.status(200).json({
                success: false,
                message: 'Master answer sheet not found'
            });
        }
        const updatedSheet = await masterSheet.update({
            caseId,
            MMT_8_initial: formData.MMT_8_initial || masterSheet.MMT_8_initial,
            CDASI_Activity_initial: formData.CDASI_Activity_initial || masterSheet.CDASI_Activity_initial,
            CDASI_Damage_initial: formData.CDASI_Damage_initial || masterSheet.CDASI_Damage_initial,
            Gottron_Hands_initial: formData.Gottron_Hands_initial || masterSheet.Gottron_Hands_initial,
            Periungual_initial: formData.Periungual_initial || masterSheet.Periungual_initial,
            Alopecia_initial: formData.Alopecia_initial || masterSheet.Alopecia_initial,
            MDAAT_initial: formData.MDAAT_initial || masterSheet.MDAAT_initial,
            MMT_8_followUp: formData.MMT_8_followUp || masterSheet.MMT_8_followUp,
            CDASI_Activity_followUp: formData.CDASI_Activity_followUp || masterSheet.CDASI_Activity_followUp,
            CDASI_Damage_followUp: formData.CDASI_Damage_followUp || masterSheet.CDASI_Damage_followUp,
            Gottron_Hands_followUp: formData.Gottron_Hands_followUp || masterSheet.Gottron_Hands_followUp,
            Periungual_followUp: formData.Periungual_followUp || masterSheet.Periungual_followUp,
            Alopecia_followUp: formData.Alopecia_followUp || masterSheet.Alopecia_followUp,
            MDAAT_followUp: formData.MDAAT_followUp || masterSheet.MDAAT_followUp,
            Physician_initial: formData.Physician_initial || masterSheet.Physician_initial,
            Physician_followUp: formData.Physician_followUp || masterSheet.Physician_followUp,
            percentage: percentage,
        });

        return res.status(200).json({
            success: true,
            message: 'Master answer sheet updated successfully',
            data: updatedSheet
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

