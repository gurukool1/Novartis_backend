const { Sequelize } = require("sequelize");
const fs = require('fs');
const sequelize = new Sequelize("gurukooltraining_Gurukool_database", "gurukooltraining_Gurukool", "Gurukool@1234", {
  host: "localhost",
  port:3306,
  dialect: "mysql",
  });


async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database.");
  } catch (error) {
    console.error("Error connecting to the database: ", error);
  }
}

module.exports = { sequelize, connectDB };
