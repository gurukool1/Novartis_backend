const User = require('./userModel');
const Case = require('./caseModel');
const UserCase = require('./userCaseModel');
const Token = require('./tokensModel');
const Form = require('./formsModel');

const models = { User, Case, UserCase, Token , Form};

Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models;
