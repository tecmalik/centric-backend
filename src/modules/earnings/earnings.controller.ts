import { Request, Response, NextFunction } from 'express';
import { Earning } from './earning.model';
import { TravelerProfile } from '../users/traveler.model';
import { AppError } from '../../middleware/error';

export const getTravelerEarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    if (req.user.role !== 'TRAVELER') {
      const error: AppError = new Error('Only travelers can view earnings information');
      error.statusCode = 403;
      return next(error);
    }

    const earnings = await Earning.find({ traveler: req.user._id }).sort({ createdAt: -1 });

    const totalPayout = earnings.reduce((acc, curr) => acc + curr.payoutAmount, 0);

    const travelerProfile = await TravelerProfile.findOne({ user: req.user._id });
    const completedCount = travelerProfile ? travelerProfile.completedDeliveries : earnings.length;

    res.status(200).json({
      success: true,
      data: {
        totalEarnings: parseFloat(totalPayout.toFixed(2)),
        completedDeliveriesCount: completedCount,
        earnings,
      },
    });
  } catch (error) {
    next(error);
  }
};
