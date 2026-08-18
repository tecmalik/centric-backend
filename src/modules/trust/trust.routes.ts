import { Router } from 'express';
import { getTrustHistory } from './trust.controller';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.get('/history', protect, restrictTo('TRAVELER'), getTrustHistory);

export default router;
