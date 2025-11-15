import { Router } from 'express';
import {
  applyForInternship,
  getMyApplications,
  getApplicationsForInternship,
  updateApplicationStatus,
  completeInternship,
} from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), applyForInternship);
router.get('/my-applications', authenticate, authorize('STUDENT'), getMyApplications);
router.get('/internship/:internshipId', authenticate, authorize('COMPANY'), getApplicationsForInternship);
router.patch('/:id/status', authenticate, authorize('COMPANY', 'FACULTY', 'ADMIN'), updateApplicationStatus);
router.post('/:id/complete', authenticate, authorize('FACULTY', 'ADMIN'), completeInternship);

export default router;
