import { Router } from 'express';

import {
  getAllSpecialists,
  getSpecialistById,
  createSpecialist,
  updateSpecialist,
  deleteSpecialist
} from '../controllers/specialistsController';


const router = Router();


// GET /api/specialists - получить всех специалистов
router.get('/', getAllSpecialists);

// GET /api/specialists/1 - получить специалиста с ID 1
router.get('/:id', getSpecialistById);

// POST /api/specialists - создать нового специалиста
router.post('/', createSpecialist);

// PUT /api/specialists/1 - обновить специалиста с ID 1
router.put('/:id', updateSpecialist);

// DELETE /api/specialists/1 - удалить специалиста с ID 1
router.delete('/:id', deleteSpecialist);

export default router;