import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { generateTokens, getRefreshTokenCookieOptions } from '../utils/tokenUtils.js';

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists', 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'guest',
  });

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  res.status(201).json({
    status: 'success',
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    status: 'success',
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) {
    return next(new AppError('Refresh token required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    const tokens = generateTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      status: 'success',
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, avatar } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar !== undefined) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

export const logout = (req, res) => {
  res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Sign in or register with Google OAuth (ID token credential or accessToken).
 * POST /api/auth/google
 */
export const googleLogin = catchAsync(async (req, res, next) => {
  const { credential, accessToken: googleAccessToken, role } = req.body;

  if (!credential && !googleAccessToken) {
    return next(new AppError('Google credential or access token is required', 400));
  }

  let googleUser;
  if (credential) {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) {
      return next(new AppError('Invalid or expired Google ID token', 401));
    }
    const payload = await verifyRes.json();
    if (
      process.env.GOOGLE_CLIENT_ID &&
      payload.aud &&
      payload.aud !== process.env.GOOGLE_CLIENT_ID
    ) {
      return next(new AppError('Google token audience mismatch', 401));
    }
    googleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'Google User',
      avatar: payload.picture || '',
    };
  } else {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!userInfoRes.ok) {
      return next(new AppError('Invalid or expired Google access token', 401));
    }
    const payload = await userInfoRes.json();
    googleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'Google User',
      avatar: payload.picture || '',
    };
  }

  if (!googleUser?.email) {
    return next(new AppError('Google account did not return an email address', 400));
  }

  let user = await User.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email.toLowerCase() }],
  });

  if (user) {
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      updated = true;
    }
    if (!user.avatar && googleUser.avatar) {
      user.avatar = googleUser.avatar;
      updated = true;
    }
    if (updated) await user.save();
  } else {
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email.toLowerCase(),
      googleId: googleUser.googleId,
      authProvider: 'google',
      avatar: googleUser.avatar,
      role: role === 'owner' ? 'owner' : 'guest',
    });
  }

  const { accessToken, refreshToken } = generateTokens(user);
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    status: 'success',
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

export default {
  register,
  login,
  googleLogin,
  refreshToken,
  getMe,
  updateProfile,
  logout,
};
