import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes';
import verificationRouter from '../modules/verification/verification.routes';
import journeyRouter from '../modules/journeys/journey.routes';
import packageRouter from '../modules/packages/package.routes';
import matchingRouter from '../modules/matching/matching.routes';
import deliveryRouter from '../modules/deliveries/delivery.routes';
import earningsRouter from '../modules/earnings/earnings.routes';
import trustRouter from '../modules/trust/trust.routes';
import aiRouter from '../modules/ai/ai.routes';
import { Evidence } from '../modules/evidence/evidence.model';
import { protect } from '../middleware/auth';

const router = Router();

// Mount all modules
router.use('/auth', authRouter);
router.use('/verification', verificationRouter);
router.use('/journeys', journeyRouter);
router.use('/packages', packageRouter);
router.use('/matching', matchingRouter);
router.use('/matches', matchingRouter); // Handles matches operations like accept
router.use('/deliveries', deliveryRouter);
router.use('/earnings', earningsRouter);
router.use('/trust', trustRouter);
router.use('/ai', aiRouter);

// Basic evidence endpoint to fetch evidence records for a delivery
router.get('/evidence/:deliveryId', protect, async (req, res, next) => {
  try {
    const evidence = await Evidence.findOne({ delivery: req.params.deliveryId });
    if (!evidence) {
      res.status(404).json({
        success: false,
        message: 'No evidence found for this delivery ID',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
