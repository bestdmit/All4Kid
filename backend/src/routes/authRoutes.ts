import { Router } from 'express';
import upload from '../storage/storage';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  validateProfileUpdate,
  updateAvatarUser,
  deleteAvatarUser
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - регистрация
router.post('/register', upload.single('avatar'), register);

// POST /api/auth/login - вход
router.post('/login', login);

// POST /api/auth/refresh - обновление токена
router.post('/refresh', refreshToken);

// POST /api/auth/logout - выход (требует аутентификации)
router.post('/logout', authenticateToken, logout);

// GET /api/auth/me - получение текущего пользователя (требует аутентификации)
router.get('/me', authenticateToken, getCurrentUser);

// PATCH /api/auth/me - обновление профиля (требует аутентификации)
router.patch('/me', authenticateToken, validateProfileUpdate, updateProfile);

// PATCH /api/auth/me/avatar - загрузка аватара (требует аутентификации)
router.patch('/me/avatar', authenticateToken, upload.single('avatar'), updateAvatarUser);

// DELETE /api/auth/me/avatar - удаление аватара (требует аутентификации)
router.delete('/me/avatar', authenticateToken, deleteAvatarUser);

export default router;