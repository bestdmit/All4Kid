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
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// Публичные роуты
router.get('/', getAllSpecialists);
router.get('/:id', getSpecialistById);

// Защищенные роуты
router.get('/my/list', authenticateToken, getMySpecialists); // НОВОЕ
router.post('/', authenticateToken, authorize('admin'), upload.single('avatar'), createSpecialist);
router.put('/:id', authenticateToken, authorize('admin'), updateSpecialist);
router.delete('/:id', authenticateToken, authorize('admin'), deleteSpecialist);
router.patch('/:id/avatar', authenticateToken, authorize('admin'), upload.single('avatar'), updateAvatar);
router.delete('/:id/avatar', authenticateToken, authorize('admin'), deleteAvatar);

export default router;