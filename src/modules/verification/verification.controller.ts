import { Request, Response, NextFunction } from 'express';
import { Verification } from './verification.model';
import { TravelerProfile } from '../users/traveler.model';
import { TrustScoreLog } from '../trust/trust.model';
import { AppError } from '../../middleware/error';

export const verifyTraveler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    if (req.user.role !== 'TRAVELER') {
      const error: AppError = new Error('Only travelers can undergo verification');
      error.statusCode = 403;
      return next(error);
    }

    const { documentType, documentNumber } = req.body;

    const profile = await TravelerProfile.findOne({ user: req.user._id });
    if (!profile) {
      const error: AppError = new Error('Traveler profile not found');
      error.statusCode = 404;
      return next(error);
    }

    if (profile.isVerified) {
      res.status(200).json({
        success: true,
        message: 'Traveler is already verified',
        data: { profile },
      });
      return;
    }

    // Create or update verification entry
    const verification = await Verification.findOneAndUpdate(
      { user: req.user._id },
      {
        status: 'VERIFIED',
        documentType,
        documentNumber,
        verifiedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // Update Traveler Profile
    const oldScore = profile.trustScore;
    const delta = 20;
    const newScore = Math.min(100, oldScore + delta);

    profile.isVerified = true;
    profile.trustScore = newScore;
    profile.verificationDetails = {
      documentType,
      documentNumber,
      verifiedAt: new Date(),
    };
    await profile.save();

    // Create Trust Score Log
    await TrustScoreLog.create({
      traveler: req.user._id,
      score: newScore,
      delta,
      reason: 'Traveler identity verified successfully (KYC Mock)',
    });

    res.status(200).json({
      success: true,
      message: 'Traveler verification successful',
      data: {
        verification,
        profile: {
          isVerified: profile.isVerified,
          trustScore: profile.trustScore,
          completedDeliveries: profile.completedDeliveries,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
