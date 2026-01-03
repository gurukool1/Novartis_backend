const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database"); 

const User = sequelize.define("User", {
  investigatorName:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company_name: {
    type: DataTypes.STRING,
    allowedNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  siteNo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    defaultValue: "NA",
  },
  study_name: {
    type: DataTypes.STRING,
    allowedNull: false,
  },
  country:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "user"),
    defaultValue: "user",
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  isActive: {
    type: DataTypes.TINYINT,  
    defaultValue: 1,  
    validate: {
      isIn: [[0, 1]], 
    },
  },
   isDeleted: {
    type: DataTypes.TINYINT,  
    defaultValue: 0,  
    validate: {
      isIn: [[0, 1]], 
    },
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});


// User.associate = (models) => {
//   User.belongsToMany(models.Case, {
//     through: models.UserCase,
//     foreignKey: "userId",
//    otherKey: "caseId",
//    // onDelete: "CASCADE",
//   });
//   User.hasOne(models.Token, {
//     foreignKey: "userId",
//     onDelete: "CASCADE",
//   });
// };



User.associate = (models) => {
 
 User.belongsToMany(models.Case, {
    through: { model: models.UserCase, unique: false },
     foreignKey: "userId",
    otherKey: "caseId",
    // onDelete: "CASCADE",
  });
  User.hasOne(models.Token, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });
};


module.exports = User;


