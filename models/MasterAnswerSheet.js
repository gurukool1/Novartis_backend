const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterAnswerSheet = sequelize.define('MasterAnswerSheet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    caseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // One master sheet per case
        field: 'case_id'
    },

    // Store the same structure as Form model
    MMT_8_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    CDASI_Activity_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    CDASI_Damage_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Gottron_Hands_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Periungual_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Alopecia_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    MDAAT_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    form_Score_initial: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    MMT_8_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    CDASI_Activity_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    CDASI_Damage_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Gottron_Hands_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Periungual_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Alopecia_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    MDAAT_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Physician_initial: {
        type: DataTypes.JSON,
        allowNull: true
    },
    Physician_followUp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    form_Score_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },

    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        comment: 'Admin user ID who created this master sheet'
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
    tableName: 'master_answer_sheets',
    timestamps: true,
    underscored: false
});

module.exports = MasterAnswerSheet;