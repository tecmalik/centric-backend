import { Request, Response, NextFunction } from 'express';
import { Delivery } from './delivery.model';
import { Package } from '../packages/package.model';
import { Journey } from '../journeys/journey.model';
import { Evidence } from '../evidence/evidence.model';
import { Earning } from '../earnings/earning.model';
import { TravelerProfile } from '../users/traveler.model';
import { TrustScoreLog } from '../trust/trust.model';
import { calculateDistance } from '../matching/matching.service';
import { emitDeliveryEvent } from '../../config/socket';
import { AppError } from '../../middleware/error';

// Helper to calculate pricing
const computeEarnings = (weight: number, pickupCoord: [number, number], destCoord: [number, number]) => {
  const distance = calculateDistance(pickupCoord, destCoord);
  const baseFare = 1000; // 1000 NGN
  const distanceFare = distance * 100; // 100 NGN per km
  const weightFare = weight * 200; // 200 NGN per kg
  const totalAmount = parseFloat((baseFare + distanceFare + weightFare).toFixed(2));
  const platformFee = parseFloat((totalAmount * 0.2).toFixed(2)); // 20%
  const payoutAmount = parseFloat((totalAmount * 0.8).toFixed(2)); // 80% to traveler
  return { amount: totalAmount, platformFee, payoutAmount };
};

export const getDeliveryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('package')
      .populate('journey')
      .populate('traveler', 'name email phone')
      .populate('sender', 'name email phone');

    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        delivery,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const recordPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      const error: AppError = new Error('You are not authorized to perform pickup for this delivery');
      error.statusCode = 403;
      return next(error);
    }

    // State machine guard
    if (delivery.status !== 'ASSIGNED') {
      const error: AppError = new Error(`Cannot record pickup. Delivery is currently in state: ${delivery.status}`);
      error.statusCode = 400;
      return next(error);
    }

    const { photoUrl, coordinates, note } = req.body;

    // 1. Create Evidence record
    const evidence = await Evidence.create({
      delivery: delivery._id,
      photoUrl,
      timestamp: new Date(),
      gps: { coordinates },
      note,
    });

    // 2. Update Delivery status and nested evidence
    delivery.status = 'PICKED_UP';
    delivery.pickupEvidence = {
      photoUrl,
      timestamp: new Date(),
      gps: { coordinates },
      note,
    };
    await delivery.save();

    // 3. Update Package status
    await Package.findByIdAndUpdate(delivery.package, { status: 'PICKED_UP' });

    // 4. Emit socket event
    emitDeliveryEvent('delivery:picked_up', delivery._id.toString(), {
      status: delivery.status,
      evidenceId: evidence._id,
    });

    res.status(200).json({
      success: true,
      message: 'Pickup evidence recorded and delivery marked as PICKED_UP',
      data: {
        delivery,
        evidence,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const startTransit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      const error: AppError = new Error('You are not authorized to handle transit for this delivery');
      error.statusCode = 403;
      return next(error);
    }

    // State machine guard
    if (delivery.status !== 'PICKED_UP') {
      const error: AppError = new Error(`Cannot start transit. Delivery is in state: ${delivery.status}`);
      error.statusCode = 400;
      return next(error);
    }

    // 1. Transition status
    delivery.status = 'IN_TRANSIT';
    await delivery.save();

    // 2. Update Package status
    await Package.findByIdAndUpdate(delivery.package, { status: 'IN_TRANSIT' });

    // 3. Emit Socket event
    emitDeliveryEvent('delivery:in_transit', delivery._id.toString(), {
      status: delivery.status,
    });

    res.status(200).json({
      success: true,
      message: 'Delivery marked as IN_TRANSIT',
      data: {
        delivery,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markOutForDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      const error: AppError = new Error('You are not authorized to handle transit for this delivery');
      error.statusCode = 403;
      return next(error);
    }

    // State machine guard
    if (delivery.status !== 'IN_TRANSIT') {
      const error: AppError = new Error(`Cannot mark out for delivery. Delivery is in state: ${delivery.status}`);
      error.statusCode = 400;
      return next(error);
    }

    // 1. Transition status
    delivery.status = 'OUT_FOR_DELIVERY';
    await delivery.save();

    // 2. Update Package status
    await Package.findByIdAndUpdate(delivery.package, { status: 'OUT_FOR_DELIVERY' });

    res.status(200).json({
      success: true,
      message: 'Delivery marked as OUT_FOR_DELIVERY',
      data: {
        delivery,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const delivery = await Delivery.findById(req.params.id)
      .populate('package')
      .populate('journey');

    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      const error: AppError = new Error('You are not authorized to complete verification for this delivery');
      error.statusCode = 403;
      return next(error);
    }

    // State machine check - must be OUT_FOR_DELIVERY or IN_TRANSIT (to be flexible for demo validation)
    if (delivery.status !== 'OUT_FOR_DELIVERY' && delivery.status !== 'IN_TRANSIT') {
      const error: AppError = new Error(`OTP verification is not allowed. Delivery status: ${delivery.status}`);
      error.statusCode = 400;
      return next(error);
    }

    const { otp } = req.body;

    // 1. Check max attempt lockout
    if (delivery.otpFailedAttempts >= 3) {
      const error: AppError = new Error('OTP is blocked due to too many failed attempts (Max 3). Contact support.');
      error.statusCode = 400;
      return next(error);
    }

    // 2. Check expiration
    if (new Date() > delivery.otpExpiresAt) {
      const error: AppError = new Error('OTP has expired.');
      error.statusCode = 400;
      return next(error);
    }

    // 3. Match OTP
    if (delivery.otp !== otp) {
      delivery.otpFailedAttempts += 1;
      await delivery.save();

      const error: AppError = new Error(`Incorrect OTP code. Attempts remaining: ${3 - delivery.otpFailedAttempts}`);
      error.statusCode = 400;
      return next(error);
    }

    // OTP succeeded! Transition delivery to DELIVERED and then COMPLETED
    delivery.status = 'COMPLETED';
    await delivery.save();

    // 4. Update Package status to COMPLETED
    const pkg = await Package.findById(delivery.package._id);
    if (pkg) {
      pkg.status = 'COMPLETED';
      await pkg.save();
    }

    // 5. Update Journey status to COMPLETED
    const journey = await Journey.findById(delivery.journey._id);
    if (journey) {
      journey.status = 'COMPLETED';
      await journey.save();
    }

    // 6. Calculate & log earnings
    const pricing = computeEarnings(
      delivery.package.weight,
      delivery.package.pickupLocation.coordinates,
      delivery.package.destination.coordinates
    );

    const earning = await Earning.create({
      traveler: delivery.traveler,
      delivery: delivery._id,
      amount: pricing.amount,
      platformFee: pricing.platformFee,
      payoutAmount: pricing.payoutAmount,
      status: 'PAID', // Directly PAID to mock payout flow completion
    });

    // 7. Update traveler trust score: +10 points (up to max 100)
    const travelerProfile = await TravelerProfile.findOne({ user: delivery.traveler });
    let newScore = 50;
    if (travelerProfile) {
      const oldScore = travelerProfile.trustScore;
      newScore = Math.min(100, oldScore + 10);
      travelerProfile.trustScore = newScore;
      travelerProfile.completedDeliveries += 1;
      await travelerProfile.save();

      await TrustScoreLog.create({
        traveler: delivery.traveler,
        score: newScore,
        delta: 10,
        reason: `Successful delivery of package: ${delivery.package.description}`,
      });
    }

    // 8. Emit Socket.IO completed event
    emitDeliveryEvent('delivery:completed', delivery._id.toString(), {
      status: delivery.status,
      earningId: earning._id,
      payoutAmount: pricing.payoutAmount,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Delivery completed & Traveler paid.',
      data: {
        delivery,
        earning: {
          totalAmount: earning.amount,
          payoutAmount: earning.payoutAmount,
          status: earning.status,
        },
        trustScore: newScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      const error: AppError = new Error('Delivery not found');
      error.statusCode = 404;
      return next(error);
    }

    // Authorized check: Traveler or Sender
    const isTraveler = delivery.traveler.toString() === req.user._id.toString();
    const isSender = delivery.sender.toString() === req.user._id.toString();
    if (!isTraveler && !isSender) {
      const error: AppError = new Error('You are not authorized to cancel this delivery');
      error.statusCode = 403;
      return next(error);
    }

    // Check cancelable status
    if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(delivery.status)) {
      const error: AppError = new Error(`Cannot cancel delivery. Delivery is already ${delivery.status.toLowerCase()}`);
      error.statusCode = 400;
      return next(error);
    }

    // 1. Set Delivery status to CANCELLED
    delivery.status = 'CANCELLED';
    await delivery.save();

    // 2. Set Package status back to CREATED (so it can be matched again)
    const pkg = await Package.findById(delivery.package);
    if (pkg) {
      pkg.status = 'CREATED';
      await pkg.save();
    }

    // 3. Set Journey status back to CREATED (so it can be matched again)
    const journey = await Journey.findById(delivery.journey);
    if (journey) {
      journey.status = 'CREATED';
      await journey.save();
    }

    // 4. Update trust score if Traveler cancelled
    let newScore = 50;
    if (isTraveler) {
      const travelerProfile = await TravelerProfile.findOne({ user: delivery.traveler });
      if (travelerProfile) {
        newScore = Math.max(0, travelerProfile.trustScore - 15);
        travelerProfile.trustScore = newScore;
        await travelerProfile.save();

        await TrustScoreLog.create({
          traveler: delivery.traveler,
          score: newScore,
          delta: -15,
          reason: 'Delivery cancelled by traveler',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Delivery cancelled successfully. Package and Journey reset to CREATED.',
      data: {
        delivery,
        trustScore: isTraveler ? newScore : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
