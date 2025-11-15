import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['STUDENT', 'COMPANY', 'FACULTY', 'ADMIN']).withMessage('Invalid role'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/profile', authenticate, getProfile);

export default router;
