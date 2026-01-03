const {sequelize} = require('../config/database');
const {DataTypes} = require('sequelize');


const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  jwt_token: {
    type: DataTypes.STRING,
    allowNull: false,
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
}); 

Token.associate = (models) => {
  Token.belongsTo(models.User, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });
};

module.exports = Token;