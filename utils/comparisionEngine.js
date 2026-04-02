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

    // New logic for min-max range expected value
    if (expectedValue && typeof expectedValue === 'object' && 'min' in expectedValue && 'max' in expectedValue) {
        if (String(actualValue).trim().toUpperCase() === 'NA') {
            return {
                isMatch: false,
                deviation: 0,
                status: 'MISMATCH',
                message: `Expected within range (${expectedValue.min}-${expectedValue.max}) but got NA`
            };
        }

        const expectedMin = parseFloat(expectedValue.min);
        const expectedMax = parseFloat(expectedValue.max);
        const actualNum = parseFloat(actualValue);

        if (isNaN(actualNum)) {
            return {
                isMatch: false,
                deviation: 0,
                status: 'MISMATCH',
                message: 'Invalid actual value (must be numeric)'
            };
        }

        const isMatch = actualNum >= expectedMin && actualNum <= expectedMax;

        let deviation = 0;
        if (actualNum < expectedMin) {
            deviation = parseFloat((actualNum - expectedMin).toFixed(2));
        } else if (actualNum > expectedMax) {
            deviation = parseFloat((actualNum - expectedMax).toFixed(2));
        }

        return {
            isMatch,
            deviation,
            status: isMatch ? 'RANGED_MATCH' : 'RANGED_MISMATCH',
            message: isMatch 
                ? `Match within acceptable range (${expectedMin} - ${expectedMax})` 
                : `Values are outside acceptable range (${expectedMin} - ${expectedMax})`
        };
    }

    // New logic when expected value is exactly 'NA'
    if (String(expectedValue).trim().toUpperCase() === 'NA') {
        const isMatch = String(actualValue).trim().toUpperCase() === 'NA';
        return {
            isMatch,
            deviation: 0,
            status: isMatch ? 'MATCH' : 'MISMATCH',
            message: isMatch ? 'Exact match (NA)' : `Expected NA but got ${actualValue}`
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
 * Exact or Default match comparison
 */
const exactMatch = (expected, actual) => {
    // Convert to string for comparison
    const expectedStr = String(expected).trim();
    const actualStr = String(actual).trim();

    // Check if both can be parsed as valid numbers
    const expectedNum = Number(expectedStr);
    const actualNum = Number(actualStr);

    const isNumericExpected = expectedStr !== '' && !isNaN(expectedNum);
    const isNumericActual = actualStr !== '' && !isNaN(actualNum);

    if (isNumericExpected && isNumericActual) {
        const deviation = actualNum - expectedNum;
        const absDeviation = Math.abs(deviation);
        const isMatch = absDeviation <= 2;

        let status = 'RANGED_MISMATCH';
        let message = 'Values are outside acceptable range (±2)';

        if (absDeviation === 0) {
            status = 'MATCH';
            message = 'Exact match';
        } else if (isMatch) {
            status = 'RANGED_MATCH';
            message = 'Match within acceptable range of 2';
        }

        return {
            isMatch,
            deviation,
            status,
            message
        };
    }

    // Fallback to exact string match
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

        // Check if the value is essentially un-submitted or null
        const isNotSubmitted = 
            actualValue === null || 
            actualValue === undefined || 
            actualValue === 'NOT_SUBMITTED' || 
            String(actualValue).trim() === '';

        // Neglect it from the evaluation if not submitted
        if (isNotSubmitted) {
            return;
        }

        // Get validation rule for this field
        const validationRule = rulesMap[path] || null;

        // Perform comparison
        const

            comparisonResult = compareField(
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