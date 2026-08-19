import { Router } from 'express';
import {
  getDeliveryById,
  recordPickup,
  startTransit,
  markOutForDelivery,
  verifyOtp,
  cancelDelivery,
} from './delivery.controller';
import { pickupEvidenceSchema, verifyOtpSchema } from './delivery.validation';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.get('/:id', protect, getDeliveryById);
router.post('/:id/pickup', protect, restrictTo('TRAVELER'), validate(pickupEvidenceSchema), recordPickup);
router.post('/:id/transit', protect, restrictTo('TRAVELER'), startTransit);
router.post('/:id/out-for-delivery', protect, restrictTo('TRAVELER'), markOutForDelivery);
router.post('/:id/verify-otp', protect, restrictTo('TRAVELER'), validate(verifyOtpSchema), verifyOtp);
router.post('/:id/cancel', protect, cancelDelivery);

export default router;
