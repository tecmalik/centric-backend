import { Router } from 'express';
import { createPackage, getMyPackages, getAllPackages, getPackageById } from './package.controller';
import { createPackageSchema } from './package.validation';
import { validate } from '../../middleware/validate';
import { protect, restrictTo } from '../../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('SENDER'), validate(createPackageSchema), createPackage);
router.get('/', protect, getAllPackages);
router.get('/mine', protect, restrictTo('SENDER'), getMyPackages);
router.get('/:id', protect, getPackageById);

export default router;
