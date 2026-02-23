const fieldExtractorService = require('./fieldExtractor.js');


const compareField = (expectedValue, actualValue, validationRule = null) => {
    // Handle null/undefined cases for expected value
    if (expectedValue === null || expectedValue === undefined) {
        return {
            isMatch: true,
            deviation: 0,
            status: 'SKIPPED',
            message: 'Expected value is null'
        };
    }

    // Handle case where actual value is missing from submission
    if (actualValue === null || actualValue === undefined) {
        return {
            isMatch: false,
            deviation: 0,
            status: 'MISMATCH',
            message: 'Field not found in submission'
        };
    }

    // Handle case where entire section was submitted but empty
    if (actualValue === 'NOT_SUBMITTED') {
        return {
            isMatch: false,
            deviation: 0,
            status: 'MISMATCH',
            message: 'Section was not filled by user'
        };
    }

    // If no validation rule, default to exact match
    const validationType = validationRule?.validationType || 'exact';

    switch (validationType) {
        case 'exact':
            return exactMatch(expectedValue, actualValue);

        case 'range':
            return rangeMatch(
                expectedValue,
                actualValue,
                validationRule.acceptableRange
            );

        case 'list':
            return listMatch(
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
            return exactMatch(expectedValue, actualValue);
    }
}

/**
 * Exact match comparison
 */
const exactMatch = (expected, actual) => {
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
const rangeMatch = (expected, actual, acceptableRange) => {
    const expectedNum = parseFloat(expected);
    const actualNum = parseFloat(actual);

    // Check if both are valid numbers
    if (isNaN(expectedNum) || isNaN(actualNum)) {
        return exactMatch(expected, actual);
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
const listMatch = (actual, acceptableValues) => {
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


const compareSubmission = (masterData, userData, validationRules = []) => {
    // Flatten both JSONs
    const masterFields = fieldExtractorService.flattenJSON(masterData);
    const userFields = fieldExtractorService.flattenJSON(userData);

    // ===== PATH DEBUG =====
    console.log('\n[DEBUG] Master field paths:', masterFields.map(f => f.path));
    console.log('[DEBUG] User field paths:', userFields.map(f => f.path));
    // ======================

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

        // Find corresponding field in user data (exact path match)
        const userField = userFields.find(f => f.path === path);

        let actualValue = null;

        if (userField) {
            actualValue = userField.value;
        } else {
            // Check if the user's entire SECTION was submitted but empty ({})
            // In that case, the user's path would be just the section name (e.g. 'MMT_8_initial')
            const sectionName = section; // e.g. 'MMT_8_initial'
            const userSectionAsLeaf = userFields.find(f => f.path === sectionName && f.isEmpty);
            if (userSectionAsLeaf) {
                actualValue = 'NOT_SUBMITTED'; // Whole section is empty
            }
            // else actualValue stays null = field completely missing from submission
        }

        // Get validation rule for this field
        const validationRule = rulesMap[path] || null;

        // Perform comparison
        const comparisonResult = compareField(
            expectedValue,
            actualValue,
            validationRule
        );

        // Store detailed comparison result
        comparisons.push({
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


module.exports = {
    compareField,
    compareSubmission,
    listMatch,
    rangeMatch,
    exactMatch
};