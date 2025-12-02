import { Router } from 'express';
import upload from '../storage/storage';
import {
  getAllSpecialists,
  getSpecialistById,
  createSpecialist,
  updateSpecialist,
  deleteSpecialist,
  updateAvatar,
  deleteAvatar
} from '../controllers/specialistsController';

const router = Router();

// GET /api/specialists
router.get('/', getAllSpecialists);

// GET /api/specialists/:id
router.get('/:id', getSpecialistById);

// POST /api/specialists - создание с загрузкой файла
router.post('/', upload.single('avatar'), createSpecialist);

// PUT /api/specialists/:id
router.put('/:id', updateSpecialist);

// DELETE /api/specialists/:id
router.delete('/:id', deleteSpecialist);

// PATCH /api/specialists/:id/avatar - обновить аватар
router.patch('/:id/avatar', upload.single('avatar'), updateAvatar);

// DELETE /api/specialists/:id/avatar - удалить аватар
router.delete('/:id/avatar', deleteAvatar);

export default router;