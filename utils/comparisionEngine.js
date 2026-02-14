const fieldExtractorService = require('./fieldExtractor.js');

/**
 * Service to compare master answer sheet with user submission
 */
class ComparisonEngineService {

    /**
     * Compare single field value based on validation rule
     * @param {*} expectedValue - Value from master sheet
     * @param {*} actualValue - Value from user submission
     * @param {Object} validationRule - Rule object or null for default
     * @returns {Object} {isMatch, deviation, status, message}
     */
    compareField(expectedValue, actualValue, validationRule = null) {
        // Handle null/undefined cases
        if (expectedValue === null || expectedValue === undefined) {
            return {
                isMatch: true,
                deviation: 0,
                status: 'SKIPPED',
                message: 'Expected value is null'
            };
        }

        // If no validation rule, default to exact match
        const validationType = validationRule?.validationType || 'exact';

        switch (validationType) {
            case 'exact':
                return this.exactMatch(expectedValue, actualValue);

            case 'range':
                return this.rangeMatch(
                    expectedValue,
                    actualValue,
                    validationRule.acceptableRange
                );

            case 'list':
                return this.listMatch(
                    actualValue,
                    validationRule.acceptableValues
                );

            case 'ignore':
                return {
                    isMatch: true,
                    deviation: 0,
                    status: 'IGNORED',
                    message: 'Field set to ignore'
                };

            default:
                return this.exactMatch(expectedValue, actualValue);
        }
    }

    /**
     * Exact match comparison
     */
    exactMatch(expected, actual) {
        // Convert to string for comparison to handle number vs string
        const expectedStr = String(expected).trim();
        const actualStr = String(actual).trim();

        const isMatch = expectedStr === actualStr;

        return {
            isMatch,
            deviation: 0,
            status: isMatch ? 'MATCH' : 'MISMATCH',
            message: isMatch ? 'Exact match' : 'Values do not match'
        };
    }

    /**
     * Range-based comparison (for numeric values)
     */
    rangeMatch(expected, actual, acceptableRange) {
        const expectedNum = parseFloat(expected);
        const actualNum = parseFloat(actual);

        // Check if both are valid numbers
        if (isNaN(expectedNum) || isNaN(actualNum)) {
            return this.exactMatch(expected, actual);
        }

        const deviation = actualNum - expectedNum;
        const absDeviation = Math.abs(deviation);

        // Default range if not provided
        const minRange = acceptableRange?.min || 0;
        const maxRange = acceptableRange?.max || 0;

        const isWithinRange = absDeviation >= minRange && absDeviation <= maxRange;

        return {
            isMatch: isWithinRange,
            deviation: deviation,
            status: isWithinRange ? 'WITHIN_RANGE' : 'OUT_OF_RANGE',
            message: isWithinRange
                ? `Within acceptable range (±${maxRange})`
                : `Outside acceptable range. Deviation: ${deviation > 0 ? '+' : ''}${deviation}`
        };
    }

    /**
     * List-based comparison (value must be in acceptable list)
     */
    listMatch(actual, acceptableValues) {
        if (!acceptableValues || !Array.isArray(acceptableValues)) {
            return {
                isMatch: false,
                deviation: 0,
                status: 'ERROR',
                message: 'No acceptable values list provided'
            };
        }

        const actualStr = String(actual).trim();
        const isMatch = acceptableValues.includes(actualStr);

        return {
            isMatch,
            deviation: 0,
            status: isMatch ? 'ACCEPTABLE' : 'NOT_ACCEPTABLE',
            message: isMatch
                ? 'Value in acceptable list'
                : `Value not in acceptable list: [${acceptableValues.join(', ')}]`
        };
    }

    /**
     * Compare entire JSON objects field by field
     * @param {Object} masterData - Master answer sheet JSON
     * @param {Object} userData - User submission JSON
     * @param {Array} validationRules - Array of validation rule objects
     * @returns {Object} {comparisons: Array, summary: Object}
     */
    compareSubmission(masterData, userData, validationRules = []) {
        // Flatten both JSONs
        const masterFields = fieldExtractorService.flattenJSON(masterData);
        const userFields = fieldExtractorService.flattenJSON(userData);

        // Create a map of validation rules by field path
        const rulesMap = {};
        validationRules.forEach(rule => {
            rulesMap[rule.fieldPath] = rule;
        });

        // Array to store all field comparisons
        const comparisons = [];

        // Compare each field from master sheet
        masterFields.forEach(masterField => {
            const { path, value: expectedValue, section, isEmpty } = masterField;

            // Skip empty sections
            if (isEmpty) {
                return;
            }

            // Find corresponding field in user data
            const userField = userFields.find(f => f.path === path);
            const actualValue = userField ? userField.value : undefined;

            // Get validation rule for this field
            const validationRule = rulesMap[path] || null;

            // Perform comparison
            const comparisonResult = this.compareField(
                expectedValue,
                actualValue,
                validationRule
            );

            // Store detailed comparison result
            comparisons.push({
                fieldPath: path,
                section: section,
                fieldName: fieldExtractorService.getFieldName(path),
                expectedValue: expectedValue,
                actualValue: actualValue,
                validationType: validationRule?.validationType || 'exact',
                ...comparisonResult
            });
        });

        return comparisons;
    }
}

module.exports = new ComparisonEngineService();