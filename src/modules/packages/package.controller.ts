import { Request, Response, NextFunction } from 'express';
import { Package } from './package.model';
import { findMatchesForPackage } from '../matching/matching.service';
import { AppError } from '../../middleware/error';

export const createPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const { pickupLocation, destination, description, category, weight, declaredValue, recipient } = req.body;

    const pkg = await Package.create({
      user: req.user._id,
      pickupLocation,
      destination,
      description,
      category,
      weight,
      declaredValue,
      recipient,
      status: 'CREATED',
    });

    // Run matching engine synchronously for the MVP response
    const matches = await findMatchesForPackage(pkg);

    res.status(201).json({
      success: true,
      message: 'Package created and matched successfully',
      data: {
        package: pkg,
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const packages = await Package.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        packages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPackages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const packages = await Package.find().populate('user', 'name email phone').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        packages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pkg = await Package.findById(req.params.id).populate('user', 'name email phone');
    if (!pkg) {
      const error: AppError = new Error('Package not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        package: pkg,
      },
    });
  } catch (error) {
    next(error);
  }
};
