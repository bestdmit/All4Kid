import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createReview,
  deleteReview,
  getMyReviews,
  getSpecialistReviews,
  updateReview,
  validateCreateReview,
  validateUpdateReview,
} from '../controllers/reviewsController';

const router = Router();

router.get('/specialist/:specialistId', getSpecialistReviews);
router.get('/my', authenticateToken, getMyReviews);
router.post('/specialist/:specialistId', authenticateToken, validateCreateReview, createReview);
router.patch('/:id', authenticateToken, validateUpdateReview, updateReview);
router.delete('/:id', authenticateToken, deleteReview);

export default router;
