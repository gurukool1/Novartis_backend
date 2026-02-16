

const calculateStats = (comparisons) => {
    const totalFields = comparisons.length;

    // Count different statuses
    const matched = comparisons.filter(c => c.status === 'MATCH').length;
    const withinRange = comparisons.filter(c => c.status === 'WITHIN_RANGE').length;
    const acceptable = comparisons.filter(c => c.status === 'ACCEPTABLE').length;
    const ignored = comparisons.filter(c => c.status === 'IGNORED').length;

    // Total successful validations
    const totalMatched = matched + withinRange + acceptable + ignored;

    // Mismatches
    const mismatched = totalFields - totalMatched;

    // Calculate accuracy percentage
    const accuracyPercentage = totalFields > 0
        ? ((totalMatched / totalFields) * 100).toFixed(2)
        : 0;

    return {
        totalFields,
        matchedFields: totalMatched,
        exactMatches: matched,
        withinRange,
        acceptable,
        ignored,
        mismatchedFields: mismatched,
        accuracyPercentage: parseFloat(accuracyPercentage)
    };
}


const getDiscrepancies = (comparisons) => {
    const mismatchStatuses = ['MISMATCH', 'OUT_OF_RANGE', 'NOT_ACCEPTABLE'];

    return comparisons
        .filter(c => mismatchStatuses.includes(c.status))
        .map(c => ({
            fieldPath: c.fieldPath,
            section: c.section,
            fieldName: c.fieldName,
            expectedValue: c.expectedValue,
            actualValue: c.actualValue,
            deviation: c.deviation,
            status: c.status,
            message: c.message,
            severity: this.calculateSeverity(c.deviation, c.validationType)
        }));
}

const calculateSeverity = (deviation, validationType) => {
    if (validationType === 'exact') {
        return 'HIGH';
    }

    const absDeviation = Math.abs(deviation);

    if (absDeviation === 0) return 'LOW';
    if (absDeviation <= 2) return 'LOW';
    if (absDeviation <= 5) return 'MEDIUM';
    if (absDeviation <= 10) return 'HIGH';
    return 'CRITICAL';
}


const groupBySection = (discrepancies) => {
    const grouped = {};

    discrepancies.forEach(disc => {
        if (!grouped[disc.section]) {
            grouped[disc.section] = [];
        }
        grouped[disc.section].push(disc);
    });

    return grouped;
}


module.exports = {
    calculateStats,
    getDiscrepancies,
    calculateSeverity,
    groupBySection
}