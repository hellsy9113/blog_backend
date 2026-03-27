const AppError = require('../utils/AppError');

const notFound = (req, res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404));

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} is already taken.`, 400);
};
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation error: ${messages.join('. ')}`, 400);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired. Please log in again.', 401);

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err, message: err.message, name: err.name };
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFieldsError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({ success: false, message: error.message, stack: err.stack });
  }

  if (error.isOperational) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }

  console.error('💥 UNHANDLED ERROR:', err);
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
};

module.exports = { errorHandler, notFound };
