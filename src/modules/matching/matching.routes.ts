import { Router } from 'express';
import {
  getOnDemandMatches,
  getMatchesByPackage,
  getMatchesByJourney,
  acceptMatch,
} from './matching.controller';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.get('/package/:packageId/on-demand', protect, getOnDemandMatches);
router.get('/package/:packageId', protect, getMatchesByPackage);
router.get('/journey/:journeyId', protect, getMatchesByJourney);
router.post('/:id/accept', protect, restrictTo('TRAVELER'), acceptMatch);

export default router;
