import { Router } from 'express';
import {
  createInternship,
  getInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
} from '../controllers/internshipController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('COMPANY'), createInternship);
router.get('/', authenticate, getInternships);
router.get('/:id', authenticate, getInternshipById);
router.put('/:id', authenticate, authorize('COMPANY'), updateInternship);
router.delete('/:id', authenticate, authorize('COMPANY'), deleteInternship);

export default router;
