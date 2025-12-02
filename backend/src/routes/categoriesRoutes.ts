import { Router } from 'express';
import {
  getAllCategories,
  getCategoryBySlug
} from '../controllers/categoriesController';

const router = Router();

router.get('/', getAllCategories);

router.get('/:slug', getCategoryBySlug);

export default router;