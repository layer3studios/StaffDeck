const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    // Validate and REPLACE req.body/query/params with the sanitized/defaulted versions
    if (schema.shape.body) {
      req.body = schema.shape.body.parse(req.body);
    }
    if (schema.shape.query) {
      req.query = schema.shape.query.parse(req.query);
    }
    if (schema.shape.params) {
      req.params = schema.shape.params.parse(req.params);
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Defensive check: ensure error.errors exists
      const details = error.errors ? error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      })) : [{ message: error.message }];

      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: details
      });
    }
    // Pass non-validation errors to the global error handler
    next(error);
  }
};

module.exports = validate;