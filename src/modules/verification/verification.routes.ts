import { Router } from 'express';
import { verifyTraveler } from './verification.controller';
import { verifySchema } from './verification.validation';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.post('/verify', protect, restrictTo('TRAVELER'), validate(verifySchema), verifyTraveler);

export default router;
