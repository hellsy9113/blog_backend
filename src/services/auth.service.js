const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  createdAt: user.createdAt,
});

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email is already registered', 400);

  const user = await User.create({ name, email, password });
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', 401);
  if (!user.isActive)
    throw new AppError('Your account has been deactivated.', 403);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw new AppError('Refresh token is required', 401);

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingRefreshToken)
    throw new AppError('Refresh token mismatch or user not found', 401);

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return sanitizeUser(user);
};

module.exports = { register, login, refreshAccessToken, logout, getMe, cookieOptions };
