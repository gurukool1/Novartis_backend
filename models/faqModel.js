const {DataTypes} = require("sequelize");
const {sequelize} = require("../config/database");

const Faq = sequelize.define("Faq",{
    question: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    answer: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    creattedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
})

module.exports = Faq