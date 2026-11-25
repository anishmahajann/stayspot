import jwt from 'jsonwebtoken';

/**
 * Generate Access Token and Refresh Token for authenticated user.
 * 
 * @param {Object} user - User document
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

/**
 * Get standard cookie options for refresh token.
 */
export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
};

export default { generateTokens, getRefreshTokenCookieOptions };
