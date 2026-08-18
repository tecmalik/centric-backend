import { Router } from 'express';
import { getTravelerEarnings } from './earnings.controller';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.get('/', protect, restrictTo('TRAVELER'), getTravelerEarnings);

export default router;
