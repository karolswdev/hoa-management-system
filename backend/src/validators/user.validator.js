const { body, validationResult } = require('express-validator');

const updateProfileSchema = [
  body('name')
    .optional()
    .notEmpty().withMessage('Name cannot be empty.')
    .isString().withMessage('Name must be a string.')
    .trim()
    .escape(),
  ];
  
  const changePasswordSchema = [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required.')
      .isString().withMessage('Current password must be a string.'),
    body('newPassword')
      .notEmpty().withMessage('New password is required.')
      .isString().withMessage('New password must be a string.')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).*$/)
      .withMessage('New password must include uppercase, lowercase, number, and special character.'),
  ];
  
  const validate = (req, res, next) => {
    const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  validate,
};