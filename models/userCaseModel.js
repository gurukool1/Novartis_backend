const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require('./userModel')
const Case = require('./caseModel')
const { on } = require("nodemailer/lib/xoauth2");
const Form = require("./formsModel");


const UserCase = sequelize.define("UserCase",{
  // id:{
  //   type: DataTypes.INTEGER,
  //   primaryKey: true,
  //   autoIncrement: true
  // }, 
  //   caseId:{
  //       type: DataTypes.INTEGER,
  //       allowNull: false,
  //   },
  //   userId:{
  //       type: DataTypes.INTEGER,
  //       allowNull: false,
  //   },
  //   status: {
  //       type: DataTypes.ENUM( "begin","resume",  "submitted"),
  //       defaultValue: "begin",
  //       allowNull: false,
  //     },
  //   formType: {
  //       type: DataTypes.ENUM("MMT8", "CDASI", "MDAAT", "Physician", "All"),
  //       defaultValue: "All",
  //       allowNull: false
  //   },
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Cases',
      key: 'id'
    }
  },
  formType: {
      type: DataTypes.JSON,
        allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("begin", "resume", "submitted"),
    defaultValue: "begin",
    allowNull: false,
  },
      percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      feedback:{
        type: DataTypes.STRING,
        allowNull: true,
      },
    
       isDeleted:{
    type: DataTypes.TINYINT,
    defaultValue: 0,  
    validate: {
      isIn: [[0, 1]], 
    },
    },
    credentials: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      alreadyAssigned: {
        type: DataTypes.TINYINT,
        defaultValue: 0,  
        validate: {
          isIn: [[0, 1]], 
        },
      },
      assignedAt:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {  
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

},
)



UserCase.associate = (models) => {
  UserCase.belongsTo(models.User, { foreignKey: "userId",onDelete: "CASCADE" });
  UserCase.belongsTo(models.Case, { foreignKey: "caseId" ,onDelete: "CASCADE"},);
  UserCase.hasOne(models.Form, {
    foreignKey: 'userCaseId',
    as: 'form',
    onDelete: 'CASCADE',
   
  });
};



module.exports = UserCase;