import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({ windowMs: 60_000, max: 5 });

const router = Router();

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
