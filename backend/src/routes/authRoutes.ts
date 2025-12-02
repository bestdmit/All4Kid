import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - регистрация
router.post('/register', register);

// POST /api/auth/login - вход
router.post('/login', login);

// POST /api/auth/refresh - обновление токена
router.post('/refresh', refreshToken);

// POST /api/auth/logout - выход (требует аутентификации)
router.post('/logout', authenticateToken, logout);

// GET /api/auth/me - получение текущего пользователя (требует аутентификации)
router.get('/me', authenticateToken, getCurrentUser);

export default router;