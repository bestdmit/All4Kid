import { Router } from 'express';

import {
  getAllSpecialists,
} from '../controllers/specialistsController';


const router = Router();


// GET /api/specialists - получить всех специалистов
router.get('/', getAllSpecialists);

export default router;