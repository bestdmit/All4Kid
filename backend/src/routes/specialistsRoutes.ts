import { Router } from 'express';
import upload from '../storage/storage';
import {
  getAllSpecialists,
  getSpecialistById,
  createSpecialist,
  updateSpecialist,
  deleteSpecialist,
  updateAvatar,
  deleteAvatar,
  getMySpecialists 
} from '../controllers/specialistsController';
import {
  approveReview,
  createReviewForSpecialist,
  getReviewsBySpecialistId,
  getUnapprovedReviews
} from "../controllers/reviewsController";
import {authenticateToken, authorize} from '../middleware/auth';

const router = Router();

// Публичные роуты
router.get('/', getAllSpecialists);
// Защищенные роуты (должны быть выше /:id)
router.get('/my/list', authenticateToken, getMySpecialists);
router.get('/:id/reviews', getReviewsBySpecialistId);
router.get('/:id', getSpecialistById);

router.post('/', authenticateToken, upload.single('avatar'), createSpecialist); // УБРАЛИ authorize('admin')
router.put('/:id', authenticateToken, updateSpecialist);
router.delete('/:id', authenticateToken, deleteSpecialist);
router.patch('/:id/avatar', authenticateToken, upload.single('avatar'), updateAvatar);
router.delete('/:id/avatar', authenticateToken, deleteAvatar);
router.post('/:id/reviews', authenticateToken, createReviewForSpecialist);

export default router;