import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};
