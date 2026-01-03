const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./userModel");
const UserCase = require("./userCaseModel");

const Case = sequelize.define("Case", {
  
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pdfUrl:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    references: {
      userId: "id",
      model: User,
      onDelete: "CASCADE",
    },
  },
  // formType: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },
  isDeleted:{
    type: DataTypes.TINYINT,
    defaultValue: 0,  
    validate: {
      isIn: [[0, 1]], 
    },
  },
  // isAssigned: {
  //   type: DataTypes.TINYINT,
  //   defaultValue: 0,  
  //   validate: {
  //     isIn: [[0, 1]], 
  //   },
  // },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});


// Case.associate = (models) => {
//   Case.belongsToMany(models.User, {
//     through: models.UserCase,
//     foreignKey: "caseId",
//     otherKey: "userId",
//   });
// };

Case.associate = (models) => {
  Case.belongsToMany(models.User, {
    through: {model:models.UserCase, unique:false },

    foreignKey: "caseId",
    otherKey: "userId",
   // onDelete: "CASCADE", // This ensures that when a case is deleted, all UserCase records are deleted too
  });
};

module.exports = Case;
