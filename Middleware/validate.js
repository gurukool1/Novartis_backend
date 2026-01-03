// const validate = (schema) => async (req, res, next) => {
//   try {
//     await schema.validateAsync(req.body, { abortEarly: false });
//     next();
//   } catch (err) {
//     return res.status(400).json({
//       message: 'Validation failed',
//       errors: err.details.map(detail => detail.message)
//     });
//   }
// };

// module.exports = validate;






const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err) {
    // Check if err.details is available and is an array before using map
    const errorDetails = err.details && Array.isArray(err.details) ? err.details.map(detail => detail.message) : ['Unknown validation error'];
    return res.status(200).json({
      status: false,
      message: 'Validation failed',
      errors: JSON.stringify(errorDetails)
    });
  }
};

module.exports = validate;
 