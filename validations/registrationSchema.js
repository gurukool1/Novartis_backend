const Joi  = require('joi');


const registerSchema = Joi.object({
  investigatorName: Joi.string().min(2).required().messages({
    'string.min': 'Investigator name must be at least 2 characters long.',
  }),
  username: Joi.string().min(2).required().messages({
    'string.min': 'Username must be at least 2 characters long.',
  }),
  company_name: Joi.string().min(2).required().messages({
    'string.min': 'Company name must be at least 2 characters long.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
  }),
  confirmPassword: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
  }),
  role: Joi.string().valid('admin', 'user').default('user'),
  siteNo: Joi.string().messages({
    'any.required': 'Site number is required.',
  }),
  study_name: Joi.string().min(2).required().messages({
    'string.min': 'Study name must be at least 2 characters long.',
  }),
  country: Joi.string().required().messages({
    'any.required': 'Country is required.',
  }),
 
}); 
 

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format.',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long.',
    }),
})

module.exports = { registerSchema ,loginSchema};