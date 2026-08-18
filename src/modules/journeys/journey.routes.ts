import { Router } from 'express';
import { createJourney, getMyJourneys, getAllJourneys } from './journey.controller';
import { createJourneySchema } from './journey.validation';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('TRAVELER'), validate(createJourneySchema), createJourney);
router.get('/', protect, getAllJourneys);
router.get('/mine', protect, restrictTo('TRAVELER'), getMyJourneys);

export default router;
