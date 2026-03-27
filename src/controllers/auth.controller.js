const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({ name, email, password });
  res
    .cookie('refreshToken', refreshToken, { ...authService.cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .status(201)
    .json({ success: true, message: 'Registration successful', data: { user, accessToken } });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });
  res
    .cookie('refreshToken', refreshToken, { ...authService.cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .status(200)
    .json({ success: true, message: 'Login successful', data: { user, accessToken } });
});

const refreshToken = catchAsync(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(incomingToken);
  res
    .cookie('refreshToken', newRefreshToken, { ...authService.cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .status(200)
    .json({ success: true, message: 'Token refreshed', data: { accessToken } });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Logged out successfully' });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { register, login, refreshToken, logout, getMe };
