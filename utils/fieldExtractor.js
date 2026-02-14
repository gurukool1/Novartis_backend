/**
 * Service to extract field paths from nested JSON objects
 */
class FieldExtractorService {

    /**
     * Flatten nested JSON into array of field paths with values
     * @param {Object} jsonData - Nested JSON object
     * @param {String} parentPath - Parent path for recursion
     * @returns {Array} Array of {path, value, section} objects
     */
    flattenJSON(jsonData, parentPath = '') {
        const fields = [];

        for (const key in jsonData) {
            if (!jsonData.hasOwnProperty(key)) continue;

            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            const value = jsonData[key];

            // Skip metadata fields
            if (this.isMetadataField(key)) {
                continue;
            }

            // If value is an object and not null, recurse
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Check if empty object
                if (Object.keys(value).length === 0) {
                    fields.push({
                        path: currentPath,
                        value: null,
                        section: this.extractSection(currentPath),
                        isEmpty: true
                    });
                } else {
                    // Recurse into nested object
                    const nestedFields = this.flattenJSON(value, currentPath);
                    fields.push(...nestedFields);
                }
            } else {
                // Leaf node - actual field value
                fields.push({
                    path: currentPath,
                    value: value,
                    section: this.extractSection(currentPath),
                    isEmpty: false
                });
            }
        }

        return fields;
    }

    /**
     * Check if field is metadata (should not be validated)
     * @param {String} fieldName 
     * @returns {Boolean}
     */
    isMetadataField(fieldName) {
        const metadataFields = [
            'id', 'caseId', 'userId', 'userCaseId',
            'percentage', 'isDraft', 'isDeleted',
            'createdAt', 'updatedAt', 'investigatorName'
        ];
        return metadataFields.includes(fieldName);
    }

    /**
     * Extract section name from field path
     * @param {String} path - e.g., "MMT_8_initial.Biceps.left"
     * @returns {String} - e.g., "MMT_8_initial"
     */
    extractSection(path) {
        const parts = path.split('.');
        return parts[0];
    }

    /**
     * Get field name without section
     * @param {String} path - e.g., "MMT_8_initial.Biceps.left"
     * @returns {String} - e.g., "Biceps.left"
     */
    getFieldName(path) {
        const parts = path.split('.');
        return parts.slice(1).join('.');
    }

    /**
     * Get value from nested object using dot notation path
     * @param {Object} obj 
     * @param {String} path 
     * @returns {*} Value at the path or undefined
     */
    getValueByPath(obj, path) {
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
}

module.exports = new FieldExtractorService();