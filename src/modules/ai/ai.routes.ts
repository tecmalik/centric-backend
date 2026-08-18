import { Router } from 'express';
import { classifyPackage } from './ai.controller';
import { protect } from '../../middleware/auth';

const router = Router();

// Allow authenticated users to classify packages
router.post('/classify', protect, classifyPackage);

export default router;
