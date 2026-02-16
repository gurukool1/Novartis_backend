const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Service to parse .docx files and extract form data
 */


/**
 * Parse .docx file and extract text content
 * @param {String} filePath - Path to .docx file
 * @returns {String} Extracted text
 */
const extractText = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value; // The raw text
    } catch (error) {
        console.error('Error extracting text from .docx:', error);
        throw new Error('Failed to extract text from document');
    }
}

const parseTextToJSON = (textContent) => {
    const formData = {
        MMT_8_initial: {},
        CDASI_Activity_initial: {},
        CDASI_Damage_initial: {},
        Gottron_Hands_initial: {},
        Periungual_initial: {},
        Alopecia_initial: {},
        MDAAT_initial: {},
        form_Score_initial: {},
        MMT_8_followUp: {},
        CDASI_Activity_followUp: {},
        CDASI_Damage_followUp: {},
        Gottron_Hands_followUp: {},
        Periungual_followUp: {},
        Alopecia_followUp: {},
        MDAAT_followUp: {},
        Physician_initial: {},
        Physician_followUp: {},
        form_Score_followUp: {}
    };

    // Split text into lines
    const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentSection = null;
    let jsonBuffer = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is a section header
        const sectionMatch = detectSection(line);

        if (sectionMatch) {
            // Before switching sections, process any buffered JSON
            if (jsonBuffer && currentSection) {
                try {
                    const parsed = JSON.parse(jsonBuffer);
                    formData[currentSection] = parsed;
                } catch (e) {
                    console.error(`Error parsing JSON for section ${currentSection}:`, e);
                }
                jsonBuffer = '';
            }

            currentSection = sectionMatch;
            continue;
        }

        // If we're in a section
        if (currentSection) {
            // Check if line looks like JSON (starts with { or continues JSON)
            if (line.startsWith('{') || jsonBuffer) {
                jsonBuffer += line;

                // Check if we have a complete JSON object
                try {
                    const parsed = JSON.parse(jsonBuffer);
                    formData[currentSection] = parsed;
                    jsonBuffer = ''; // Clear buffer after successful parse
                } catch (e) {
                    // Not complete yet, continue buffering
                    // Only clear if we detect it's not going to be valid JSON
                    if (!line.includes('{') && !line.includes('}') && !line.includes('"') && jsonBuffer.length > 1000) {
                        console.error(`Clearing invalid JSON buffer for ${currentSection}`);
                        jsonBuffer = '';
                    }
                }
            } else {
                // Try to parse as field:value pair
                const fieldData = parseFieldLine(line);

                if (fieldData) {
                    formData[currentSection][fieldData.field] = fieldData.value;
                }
            }
        }
    }

    // Process any remaining JSON buffer
    if (jsonBuffer && currentSection) {
        try {
            const parsed = JSON.parse(jsonBuffer);
            formData[currentSection] = parsed;
        } catch (e) {
            console.error(`Error parsing final JSON for section ${currentSection}:`, e);
        }
    }

    return formData;
}

const detectSection = (line) => {
    const lineLower = line.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const sectionMappings = {
        'mmt8initial': 'MMT_8_initial',
        'mmt_8_initial': 'MMT_8_initial',
        'cdasiactivityinitial': 'CDASI_Activity_initial',
        'cdasi_activity_initial': 'CDASI_Activity_initial',
        'cdasidamageinitial': 'CDASI_Damage_initial',
        'cdasi_damage_initial': 'CDASI_Damage_initial',
        'gottronhandsinitial': 'Gottron_Hands_initial',
        'gottron_hands_initial': 'Gottron_Hands_initial',
        'periungualinitial': 'Periungual_initial',
        'periungual_initial': 'Periungual_initial',
        'alopeciainitial': 'Alopecia_initial',
        'alopecia_initial': 'Alopecia_initial',
        'mdaatinitial': 'MDAAT_initial',
        'mdaat_initial': 'MDAAT_initial',
        'formscoreinitial': 'form_Score_initial',
        'form_score_initial': 'form_Score_initial',
        'mmt8followup': 'MMT_8_followUp',
        'mmt_8_followup': 'MMT_8_followUp',
        'cdasiactivityfollowup': 'CDASI_Activity_followUp',
        'cdasi_activity_followup': 'CDASI_Activity_followUp',
        'cdasidamagefollowup': 'CDASI_Damage_followUp',
        'cdasi_damage_followup': 'CDASI_Damage_followUp',
        'gottronhandsfollowup': 'Gottron_Hands_followUp',
        'gottron_hands_followup': 'Gottron_Hands_followUp',
        'periungualfollowup': 'Periungual_followUp',
        'periungual_followup': 'Periungual_followUp',
        'alopeciafollowup': 'Alopecia_followUp',
        'alopecia_followup': 'Alopecia_followUp',
        'mdaatfollowup': 'MDAAT_followUp',
        'mdaat_followup': 'MDAAT_followUp',
        'physicianinitial': 'Physician_initial',
        'physician_initial': 'Physician_initial',
        'physicianfollowup': 'Physician_followUp',
        'physician_followup': 'Physician_followUp',
        'formscorefollowup': 'form_Score_followUp',
        'form_score_followup': 'form_Score_followUp'
    };

    return sectionMappings[lineLower] || null;
}


const parseFieldLine = (line) => {
    // Try different separators: : = |
    const separators = [':', '=', '|'];

    for (const sep of separators) {
        if (line.includes(sep)) {
            const parts = line.split(sep);

            if (parts.length >= 2) {
                const field = parts[0].trim();
                const value = parts.slice(1).join(sep).trim(); // Handle cases where value contains separator

                return { field, value };
            }
        }
    }

    return null;
}


const parseTableFormat = (textContent) => {
    // This can be implemented if the .docx has tables
    // Mammoth can extract table data separately
    // For now, we'll use the simple line-based parser
    return parseTextToJSON(textContent);
}


// const parseDocxFile = async (filePath) => {
//     try {
//         // Step 1: Extract text
//         const textContent = await extractText(filePath);

//         console.log('Extracted text length:', textContent.length);

//         // Step 2: Parse text to JSON
//         const formData = parseTextToJSON(textContent);

//         console.log('Parsed sections:', Object.keys(formData).filter(key => Object.keys(formData[key]).length > 0));

//         return formData;

//     } catch (error) {
//         console.error('Error parsing .docx file:', error);
//         throw error;
//     }
// }


const parseDocxFile = async (filePath) => {
    try {
        // Step 1: Extract text
        const textContent = await extractText(filePath);

        console.log('Extracted text length:', textContent.length);

        // Step 2: Parse text to JSON
        let formData = parseTextToJSON(textContent);

        // Ensure all JSON fields are proper objects, not strings
        const jsonFields = [
            'MMT_8_initial', 'CDASI_Activity_initial', 'CDASI_Damage_initial',
            'Gottron_Hands_initial', 'Periungual_initial', 'Alopecia_initial',
            'MDAAT_initial', 'form_Score_initial', 'MMT_8_followUp',
            'CDASI_Activity_followUp', 'CDASI_Damage_followUp', 'Gottron_Hands_followUp',
            'Periungual_followUp', 'Alopecia_followUp', 'MDAAT_followUp',
            'Physician_initial', 'Physician_followUp', 'form_Score_followUp'
        ];

        jsonFields.forEach(field => {
            if (typeof formData[field] === 'string') {
                try {
                    formData[field] = JSON.parse(formData[field]);
                } catch (e) {
                    // If parsing fails, treat as empty object
                    formData[field] = {};
                }
            } else if (!formData[field] || typeof formData[field] !== 'object') {
                formData[field] = {};
            }
        });

        console.log('Parsed sections:', Object.keys(formData).filter(key => Object.keys(formData[key]).length > 0));

        return formData;

    } catch (error) {
        console.error('Error parsing .docx file:', error);
        throw error;
    }
}


const validateParsedData = (formData) => {
    const requiredSections = [
        'MMT_8_initial', 'CDASI_Activity_initial', 'CDASI_Damage_initial',
        'Gottron_Hands_initial', 'Periungual_initial', 'Alopecia_initial',
        'MDAAT_initial', 'form_Score_initial', 'MMT_8_followUp',
        'CDASI_Activity_followUp', 'CDASI_Damage_followUp', 'Gottron_Hands_followUp',
        'Periungual_followUp', 'Alopecia_followUp', 'MDAAT_followUp',
        'Physician_initial', 'Physician_followUp', 'form_Score_followUp'
    ];

    const missingFields = [];
    const emptySections = [];

    for (const section of requiredSections) {
        if (!formData[section]) {
            missingFields.push(section);
        } else if (Object.keys(formData[section]).length === 0) {
            emptySections.push(section);
        }
    }

    return {
        valid: missingFields.length === 0,
        missingFields,
        emptySections,
        totalFields: countTotalFields(formData)
    };
}

/**
 * Count total fields across all sections
 * @param {Object} formData 
 * @returns {Number}
 */
const countTotalFields = (formData) => {
    let count = 0;
    for (const section in formData) {
        if (typeof formData[section] === 'object') {
            count += Object.keys(formData[section]).length;
        }
    }
    return count;
}

/**
 * Delete uploaded file
 * @param {String} filePath 
 */
const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        console.log('Deleted file:', filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}



module.exports =
{
    extractText,
    parseTextToJSON,
    detectSection,
    parseFieldLine,
    parseTableFormat,
    parseDocxFile,
    validateParsedData,
    countTotalFields,
    deleteFile
}