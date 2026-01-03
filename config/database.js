const { Sequelize } = require("sequelize");
const fs = require('fs');
const sequelize = new Sequelize("gurukool_backend", "root", "Rahulsql", {
  host: "localhost",
  port:3300,
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
