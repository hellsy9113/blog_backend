const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next(new AppError('Access denied. Please log in.', 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return next(new AppError('Your session has expired. Please log in again.', 401));
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists.', 401));
  if (!user.isActive) return next(new AppError('Your account has been deactivated.', 403));
  if (user.changedPasswordAfter(decoded.iat))
    return next(new AppError('Password was recently changed. Please log in again.', 401));

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError('You do not have permission to perform this action.', 403));
  next();
};

module.exports = { protect, restrictTo };
