import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../database/db';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponse,
  RefreshTokenDto 
} from '../models/user';
import { AuthRequest } from '../middleware/auth';

// Регистрация нового пользователя
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone }: RegisterDto = req.body;

    // Валидация
    if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Все обязательные поля должны быть заполнены'
      });
    }

    // Проверяем email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат email'
      });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Создаем пользователя
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, phone, avatar_url, role`,
      [email, passwordHash, fullName.trim(), phone?.trim()]
    );

    const user = result.rows[0];

    // Генерируем токены
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'refresh'
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] }
    );

    // Сохраняем refresh токен в базе
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role
      },
      accessToken,
      refreshToken
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'Регистрация успешна'
    });

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
};

// Вход в систему
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDto = req.body;

    // Валидация
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }

    // Ищем пользователя
    const result = await query(
      `SELECT id, email, password_hash, full_name, phone, avatar_url, role, is_active 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    const user = result.rows[0];

    // Проверяем активен ли пользователь
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Аккаунт деактивирован'
      });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Генерируем токены
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'refresh'
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] }
    );

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    // Удаляем старые refresh токены (больше 5 на пользователя)
    await query(
      `DELETE FROM refresh_tokens 
       WHERE user_id = $1 AND id NOT IN (
         SELECT id FROM refresh_tokens 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5
       )`,
      [user.id]
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role
      },
      accessToken,
      refreshToken
    };

    res.json({
      success: true,
      data: response,
      message: 'Вход выполнен успешно'
    });

  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

// Обновление токена
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken }: RefreshTokenDto = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh токен обязателен'
      });
    }

    // Проверяем токен в базе
    const tokenResult = await query(
      `SELECT rt.*, u.id as user_id, u.email, u.role, u.is_active 
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh токен'
      });
    }

    const { user_id, email, role, is_active } = tokenResult.rows[0];

    if (!is_active) {
      return res.status(401).json({
        success: false,
        message: 'Аккаунт деактивирован'
      });
    }

    // Генерируем новый access токен
    const newAccessToken = jwt.sign(
      {
        userId: user_id,
        email,
        role
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      },
      message: 'Токен обновлен'
    });

  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Выход из системы
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken }: RefreshTokenDto = req.body;

    if (refreshToken) {
      // Удаляем refresh токен из базы
      await query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
    }

    // Если пользователь аутентифицирован, также удаляем все его токены
    if (req.user) {
      await query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });

  } catch (error) {
    console.error('Ошибка при выходе:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }

    const result = await query(
      `SELECT id, email, full_name, phone, avatar_url, role, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};