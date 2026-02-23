

/**
 * List of form field sections (excluding metadata)
 */
const getFormSections = () => {
    return [
        'MMT_8_initial',
        'CDASI_Activity_initial',
        'CDASI_Damage_initial',
        'Gottron_Hands_initial',
        'Periungual_initial',
        'Alopecia_initial',
        'MDAAT_initial',
        'form_Score_initial',
        'MMT_8_followUp',
        'CDASI_Activity_followUp',
        'CDASI_Damage_followUp',
        'Gottron_Hands_followUp',
        'Periungual_followUp',
        'Alopecia_followUp',
        'MDAAT_followUp',
        'Physician_initial',
        'Physician_followUp',
        'form_Score_followUp'
    ];
}

/**
 * Convert Form model instance to comparable JSON object
 * @param {Object} formInstance - Sequelize Form model instance
 * @returns {Object} JSON object with only form sections
 */
const convertToJSON = (formInstance) => {
    const formData = {};
    const sections = getFormSections();

    // Extract raw plain data from Sequelize model instance.
    // Direct bracket notation on a Sequelize instance can return undefined
    // for JSON columns — .toJSON() / .get({ plain: true }) gives proper values.
    const rawData = (typeof formInstance.toJSON === 'function')
        ? formInstance.toJSON()
        : formInstance;

    sections.forEach(section => {
        const value = rawData[section];

        if (value === undefined || value === null) return;

        // Some DB drivers return JSON columns as strings — parse them if needed.
        if (typeof value === 'string') {
            try {
                formData[section] = JSON.parse(value);
            } catch (e) {
                console.warn(`[FormDataConverter] Could not parse section "${section}" as JSON. Raw value:`, value);
                formData[section] = value;
            }
        } else {
            formData[section] = value;
        }
    });

    return formData;
}

/**
 * Convert plain object (from req.body) to comparable JSON
 * @param {Object} plainObject 
 * @returns {Object} JSON object with only form sections
 */
const convertPlainObjectToJSON = (plainObject) => {
    const formData = {};
    const sections = getFormSections();

    sections.forEach(section => {
        if (plainObject[section] !== undefined && plainObject[section] !== null) {
            formData[section] = plainObject[section];
        }
    });

    return formData;
}

/**
 * Get metadata fields that should not be compared
 * @returns {Array}
 */
const getMetadataFields = () => {
    return [
        'id',
        'caseId',
        'userId',
        'userCaseId',
        'percentage',
        'isDraft',
        'isDeleted',
        'createdAt',
        'updatedAt'
    ];
}

module.exports = {
    getFormSections,
    convertToJSON,
    convertPlainObjectToJSON,
    getMetadataFields
};