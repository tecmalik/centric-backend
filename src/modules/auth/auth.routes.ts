import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { registerSchema, loginSchema } from './auth.validation';
import { validate } from '../../middleware/validate';
import { protect } from '../../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
