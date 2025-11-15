import { Router } from 'express';
import {
  createLogbookEntry,
  syncLogbookEntries,
  getLogbookEntries,
  updateLogbookEntry,
  deleteLogbookEntry,
} from '../controllers/logbookController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), createLogbookEntry);
router.post('/sync', authenticate, authorize('STUDENT'), syncLogbookEntries);
router.get('/:applicationId', authenticate, getLogbookEntries);
router.put('/:id', authenticate, authorize('STUDENT'), updateLogbookEntry);
router.delete('/:id', authenticate, authorize('STUDENT'), deleteLogbookEntry);

export default router;
