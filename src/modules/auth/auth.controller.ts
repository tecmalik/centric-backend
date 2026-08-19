import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { TravelerProfile } from '../users/traveler.model';
import { AppError } from '../../middleware/error';

const signToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
    }
  );
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error: AppError = new Error('Email is already registered');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    // If traveler, initialize traveler profile
    if (role === 'TRAVELER') {
      await TravelerProfile.create({
        user: user._id,
        isVerified: false,
        trustScore: 50,
        completedDeliveries: 0,
      });
    }

    const token = signToken(user._id.toString(), user.role);

    // Remove password from output
    const userJson = user.toJSON();
    delete userJson.password;

    res.status(201).json({
      success: true,
      token,
      data: {
        user: userJson,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      const error: AppError = new Error('Incorrect email or password');
      error.statusCode = 401;
      return next(error);
    }

    const token = signToken(user._id.toString(), user.role);

    const userJson = user.toJSON();
    delete userJson.password;

    res.status(200).json({
      success: true,
      token,
      data: {
        user: userJson,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Not authenticated');
      error.statusCode = 401;
      return next(error);
    }

    let profile = null;
    if (req.user.role === 'TRAVELER') {
      profile = await TravelerProfile.findOne({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        ...(profile && { travelerProfile: profile }),
      },
    });
  } catch (error) {
    next(error);
  }
};
