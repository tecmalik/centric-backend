import { Request, Response, NextFunction } from 'express';
import { TrustScoreLog } from './trust.model';
import { TravelerProfile } from '../users/traveler.model';
import { AppError } from '../../middleware/error';

export const getTrustHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    if (req.user.role !== 'TRAVELER') {
      const error: AppError = new Error('Only travelers can view trust score logs');
      error.statusCode = 403;
      return next(error);
    }

    const logs = await TrustScoreLog.find({ traveler: req.user._id }).sort({ createdAt: -1 });

    const profile = await TravelerProfile.findOne({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        currentTrustScore: profile ? profile.trustScore : 50,
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};
