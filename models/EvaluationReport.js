const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EvaluationReport = sequelize.define('EvaluationReport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    formId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'form_id',
        comment: 'Reference to Form.id'
    },
    caseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'case_id'
    },
    totalFields: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_fields'
    },
    matchedFields: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'matched_fields'
    },
    mismatchedFields: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'mismatched_fields'
    },
    accuracyPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'accuracy_percentage'
    },
    discrepancies: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of mismatch details'
    },
    reportFilePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'report_file_path'
    },
    evaluatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'evaluated_at'
    },
    evaluatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'evaluated_by',
        comment: 'Admin ID if manually triggered'
    },
    isDeleted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isIn: [[0, 1]],
        }
    }
}, {
    tableName: 'evaluation_reports',
    timestamps: false
});

module.exports = EvaluationReport;