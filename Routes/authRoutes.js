const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const adminController = require('../Controllers/adminController');
const userController = require('../Controllers/userController');
const authController = require('../Controllers/authController');
const verifyToken = require('../Middleware/verifyToken');
const {registerSchema, loginSchema} = require('../validations/registrationSchema');
const validate = require('../Middleware/validate');


const router  = express.Router();

router.post('/register',validate(registerSchema), authController.register);
router.post('/select-country', authController.selectCountry);
router.post('/login',validate(loginSchema), authController.login);
router.post('/master-login', authController.masterLogin);
router.post('/fetch-user', verifyToken, authController.profile);
router.post('/delete', verifyToken, authController.deleteAccount)
router.post('/forgot-password', authController.forgotPassword);
router.post('/update-profile', verifyToken, authController.updateProfile);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;