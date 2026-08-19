import { Request, Response, NextFunction } from 'express';
import { Journey } from './journey.model';
import { TravelerProfile } from '../users/traveler.model';
import { AppError } from '../../middleware/error';

export const createJourney = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    // Check verification status
    const profile = await TravelerProfile.findOne({ user: req.user._id });
    if (!profile || !profile.isVerified) {
      const error: AppError = new Error('Your profile must be verified before you can create journeys.');
      error.statusCode = 403;
      return next(error);
    }

    const { origin, destination, departureTime, availableCapacity } = req.body;

    const journey = await Journey.create({
      user: req.user._id,
      origin,
      destination,
      departureTime: new Date(departureTime),
      availableCapacity,
      status: 'CREATED',
    });

    res.status(201).json({
      success: true,
      data: {
        journey,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyJourneys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const journeys = await Journey.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        journeys,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllJourneys = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const journeys = await Journey.find().populate('user', 'name email phone').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        journeys,
      },
    });
  } catch (error) {
    next(error);
  }
};
