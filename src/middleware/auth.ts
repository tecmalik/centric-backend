import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../modules/users/user.model';
import { AppError } from './error';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error: AppError = new Error('You are not logged in. Please log in to get access.');
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production') as DecodedToken;

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      const error: AppError = new Error('The user belonging to this token no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    const authError: AppError = new Error('Invalid token or token has expired.');
    authError.statusCode = 401;
    next(authError);
  }
};

export const restrictTo = (...roles: ('SENDER' | 'TRAVELER')[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required.');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error: AppError = new Error('You do not have permission to perform this action.');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};
