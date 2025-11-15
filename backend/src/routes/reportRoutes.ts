import { Router } from 'express';
import { generateReport } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/:applicationId', authenticate, authorize('STUDENT', 'FACULTY', 'ADMIN'), generateReport);

export default router;
