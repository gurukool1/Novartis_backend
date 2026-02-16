/**
 * Service to extract field paths from nested JSON objects
 */

const flattenJSON = (jsonData, parentPath = '') => {
    const fields = [];

    for (const key in jsonData) {
        if (!jsonData.hasOwnProperty(key)) continue;

        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        const value = jsonData[key];

        // Skip metadata fields
        if (isMetadataField(key)) {
            continue;
        }

        // If value is an object and not null, recurse
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Check if empty object
            if (Object.keys(value).length === 0) {
                fields.push({
                    path: currentPath,
                    value: null,
                    section: extractSection(currentPath),
                    isEmpty: true
                });
            } else {
                // Recurse into nested object
                const nestedFields = flattenJSON(value, currentPath);
                fields.push(...nestedFields);
            }
        } else {
            // Leaf node - actual field value
            fields.push({
                path: currentPath,
                value: value,
                section: extractSection(currentPath),
                isEmpty: false
            });
        }
    }

    return fields;
}


const isMetadataField = (fieldName) => {
    const metadataFields = [
        'id', 'caseId', 'userId', 'userCaseId',
        'percentage', 'isDraft', 'isDeleted',
        'createdAt', 'updatedAt', 'investigatorName'
    ];
    return metadataFields.includes(fieldName);
}

/**
 * Extract section name from field path
 */
const extractSection = (path) => {
    const parts = path.split('.');
    return parts[0];
}

/**
 * Get field name without section
 */
const getFieldName = (path) => {
    const parts = path.split('.');
    return parts.slice(1).join('.');
}

/**
 * Get value from nested object using dot notation path
 */
const getValueByPath = (obj, path) => {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}


module.exports = {
    flattenJSON,
    isMetadataField,
    extractSection,
    getFieldName,
    getValueByPath
};