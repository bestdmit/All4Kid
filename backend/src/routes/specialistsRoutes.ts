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
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Публичные роуты
router.get('/', getAllSpecialists);
router.get('/:id', getSpecialistById);

// Защищенные роуты
router.get('/my/list', authenticateToken, getMySpecialists);
router.post('/', authenticateToken, upload.single('avatar'), createSpecialist); // УБРАЛИ authorize('admin')
router.put('/:id', authenticateToken, updateSpecialist);
router.delete('/:id', authenticateToken, deleteSpecialist);
router.patch('/:id/avatar', authenticateToken, upload.single('avatar'), updateAvatar);
router.delete('/:id/avatar', authenticateToken, deleteAvatar);

export default router;