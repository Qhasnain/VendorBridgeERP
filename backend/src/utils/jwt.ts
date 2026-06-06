import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge-enterprise-secret-key-987654321-core';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vendorbridge-enterprise-refresh-secret-987654321-core';

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  name: string;
}

export function generateAccessToken(user: TokenPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user: TokenPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
