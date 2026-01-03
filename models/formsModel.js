const {sequelize} = require('../config/database');
const {DataTypes} = require('sequelize');       
const UserCase = require('./userCaseModel');

const Form = sequelize.define('Form', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    caseId:{ 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userCaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // ensures one-to-one
        references: {
          model: 'UserCases',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
   
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
        allowedNull: true
    },
    Physician_followUp: {
        type: DataTypes.JSON,
        allowedNull: true
    },
    form_Score_followUp: {
        type: DataTypes.JSON,
        allowNull: true,
    },
   
      percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      isDraft: {
        type: DataTypes.TINYINT,
        defaultValue: 0, 
        validate: {
            isIn: [[0,1]]
        }

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
    }
    );


Form.associate = (models) => {
  Form.belongsTo(models.UserCase, {
    foreignKey: 'userCaseId',
  });
};

module.exports = Form



    
    // CDASI-Activity-initial
    // CDASI-Damage-initial
    // Gottron-Hands-initial
    // Periungual-initial
    // Alopecia-initial
    // MDAAT-initial
    // form-Score-initial

    // MMT-8-followUp
    // CDASI-Activity-followUp
    // CDASI-Damage-followUp
    // Gottron-Hands-followUp
    // Periungual-followUp
    // Alopecia-followUp
    // MDAAT-followUp
    // form-Score-followUp