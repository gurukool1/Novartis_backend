const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ValidationRule = sequelize.define('ValidationRule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    caseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'case_id'
    },
    fieldPath: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'field_path',
        comment: 'Dot notation path like "MMT_8_initial.Biceps.left"'
    },
    validationType: {
        type: DataTypes.ENUM('exact', 'range', 'list', 'ignore'),
        allowNull: false,
        defaultValue: 'exact',
        field: 'validation_type'
    },
    acceptableRange: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'acceptable_range',
        comment: 'For range type: {min: -2, max: 2}'
    },
    acceptableValues: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'acceptable_values',
        comment: 'For list type: ["0", "1", "2"]'
    },
    isDeleted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isIn: [[0, 1]],
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'validation_rules',
    timestamps: true,
    underscored: false
});

module.exports = ValidationRule;