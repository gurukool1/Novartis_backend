const Joi  = require('joi');


const registerSchema = Joi.object({
  investigatorName: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Investigator name must be at least 3 characters long.',
    'string.max': 'Investigator name cannot exceed 30 characters.',
  }),
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Username must be at least 3 characters long.',
    'string.max': 'Username cannot exceed 30 characters.',
  }),
  company_name: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Company name must be at least 3 characters long.',
    'string.max': 'Company name cannot exceed 30 characters.',
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
  study_name: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Study name must be at least 3 characters long.',
    'string.max': 'Study name cannot exceed 30 characters.',
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