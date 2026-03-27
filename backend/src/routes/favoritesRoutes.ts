import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  addFavorite,
  getFavoriteStatus,
  getMyFavorites,
  removeFavorite,
} from '../controllers/favoritesController';

const router = Router();

router.get('/my', authenticateToken, getMyFavorites);
router.get('/:id/status', authenticateToken, getFavoriteStatus);
router.post('/:id', authenticateToken, addFavorite);
router.delete('/:id', authenticateToken, removeFavorite);

export default router;
