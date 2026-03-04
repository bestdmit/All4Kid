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
import { body, validationResult } from 'express-validator';
import { verifyEmailDeliverability } from '../services/emailValidation';

/**
 * Helper: формирует единый ответ об ошибках валидации
 */
function formatValidationErrors(req: Request) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map(err => {
    const field = (err as any).param ?? (err as any).path ?? null;
    return {
      field,
      message: err.msg
    };
  });
}

/**
 * Helper: генерация access + refresh токенов
 */
function generateTokens(payload: Record<string, any>) {
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
}

/**
 * Валидационные middleware (express-validator)
 * Примечание: мы не дублируем проверки в контроллерах — используем validationResult
 */
export const validateRegistration = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Неверный формат email')
    .isLength({ max: 100 }).withMessage('Email не должен превышать 100 символов')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Пароль обязателен')
    .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
    .isLength({ max: 100 }).withMessage('Пароль не должен превышать 100 символов')
    // только английские буквы + цифры и спец. символы; требуем минимум одну строчную, одну заглавную и одну цифру
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать минимум одну заглавную букву, одну строчную и одну цифру')
    .custom((password: string) => {
      // Явно запрещаем кириллицу в пароле
      if (/[а-яА-ЯёЁ]/.test(password)) {
        throw new Error('Пароль не должен содержать кириллицу');
      }
      return true;
    }),

  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Подтверждение пароля обязательно')
    .custom((confirmPassword: string, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Пароли не совпадают');
      }
      return true;
    }),

  body('fullName')
    .trim()
    .notEmpty().withMessage('Полное имя обязательно')
    // Только кириллица, дефисы и пробелы
    .matches(/^[а-яА-ЯёЁ\- ]+$/).withMessage('Имя должно содержать только кириллицу, пробелы и дефисы')
    .isLength({ min: 2 }).withMessage('Имя должно быть не менее 2 символов')
    .isLength({ max: 50 }).withMessage('Имя не должно превышать 50 символов'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s\-+()]{10,15}$/).withMessage('Неверный формат телефона')
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Неверный формат email')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty().withMessage('Пароль обязателен')
];

export const validateRefreshToken = [
  body('refreshToken')
    .trim()
    .notEmpty().withMessage('Refresh токен обязателен')
];

export const validateProfileUpdate = [
  body('fullName')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[а-яА-ЯёЁ\- ]+$/).withMessage('Имя должно содержать только кириллицу, пробелы и дефисы')
    .isLength({ min: 2 }).withMessage('Имя должно быть не менее 2 символов')
    .isLength({ max: 50 }).withMessage('Имя не должно превышать 50 символов'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s\-+()]{10,15}$/).withMessage('Неверный формат телефона')
];

/**
 * Контроллер: регистрация
 */
export const register = async (req: Request, res: Response) => {
  try {
    const formattedErrors = formatValidationErrors(req);
    if (formattedErrors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: formattedErrors
      });
    }

    const { email, password, fullName, phone }: RegisterDto = req.body;

    // Проверка валидности email через внешний сервис (apilayer)
    const emailCheck = await verifyEmailDeliverability(email);
    if (!emailCheck.isDeliverable) {
      const reason = emailCheck.reason || 'Email недоступен или не прошел SMTP-проверку';
      return res.status(400).json({
        success: false,
        message: 'Email недействителен',
        errors: [{ field: 'email', message: reason }]
      });
    }

    // Нормализация fullName: trim + collapse multiple spaces -> single
    const normalizedFullName = (fullName ?? '').trim().replace(/\s{2,}/g, ' ');

    // Проверяем, существует ли пользователь
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
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
      [email, passwordHash, normalizedFullName, phone ? phone.trim() : null]
    );

    const user = result.rows[0];

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Сохраняем refresh токен в базе
    const expiresAt = new Date();
    // парсинг config.jwt.refreshExpiresIn может быть строкой вроде '7d' в конфиге — но в текущем коде у вас это число/строка для jwt. Для DB оставим 7 дней как в прежнем коде
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, expiresAt]
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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };

    return res.status(201).json({
      success: true,
      data: response,
      message: 'Регистрация успешна'
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
};

/**
 * Контроллер: вход
 */
export const login = async (req: Request, res: Response) => {
  try {
    const formattedErrors = formatValidationErrors(req);
    if (formattedErrors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: formattedErrors
      });
    }

    const { email, password }: LoginDto = req.body;

    // Ищем пользователя по email
    const result = await query(
      `SELECT id, email, password_hash, full_name, phone, avatar_url, role, is_active 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Аккаунт деактивирован' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, expiresAt]
    );

    // Оставляем максимум 5 refresh токенов на пользователя (удаляем старые)
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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };

    return res.json({
      success: true,
      data: response,
      message: 'Вход выполнен успешно'
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера при входе' });
  }
};

/**
 * Контроллер: обновление access токена через refresh token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const formattedErrors = formatValidationErrors(req);
    if (formattedErrors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: formattedErrors
      });
    }

    const { refreshToken }: RefreshTokenDto = req.body;

    // Проверяем токен в базе (и его срок)
    const tokenResult = await query(
      `SELECT rt.*, u.id as user_id, u.email, u.role, u.is_active 
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Недействительный refresh токен' });
    }

    const { user_id, email, role, is_active } = tokenResult.rows[0];

    if (!is_active) {
      return res.status(401).json({ success: false, message: 'Аккаунт деактивирован' });
    }

    const newAccessToken = jwt.sign(
      { userId: user_id, email, role },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] }
    );

    return res.json({
      success: true,
      data: { accessToken: newAccessToken },
      message: 'Токен обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

/**
 * Контроллер: выход (logout)
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken }: RefreshTokenDto = req.body;

    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    if (req.user) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    }

    return res.json({ success: true, message: 'Выход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

/**
 * Контроллер: обновление профиля текущего пользователя
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Пользователь не аутентифицирован' });
    }

    const formattedErrors = formatValidationErrors(req);
    if (formattedErrors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: formattedErrors
      });
    }

    const { fullName, phone } = req.body as { fullName?: string; phone?: string | null };

    // Проверяем, что есть что обновлять
    if (typeof fullName === 'undefined' && typeof phone === 'undefined') {
      return res.status(400).json({ success: false, message: 'Нет полей для обновления' });
    }

    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    let normalizedName: string | undefined;

    if (typeof fullName !== 'undefined') {
      normalizedName = (fullName ?? '')
        .trim()
        .replace(/\s{2,}/g, ' ');
      updates.push(`full_name = $${updates.length + 1}`);
      values.push(normalizedName);
    }

    if (typeof phone !== 'undefined') {
      updates.push(`phone = $${updates.length + 1}`);
      values.push(phone ? phone.trim() : null);
    }

    updates.push(`updated_at = NOW()`);

    // Добавляем id пользователя для WHERE
    values.push(req.user.id);

    const placeholdersCount = values.length;
    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${placeholdersCount}
      RETURNING id, email, full_name, phone, avatar_url, role, created_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const user = result.rows[0];

    if (normalizedName !== undefined) {
      await query(
        'UPDATE specialists SET name = $1 WHERE created_by = $2',
        [normalizedName, req.user.id]
      );
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role,
        createdAt: user.created_at
      },
      message: 'Профиль обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера при обновлении профиля' });
  }
};

/**
 * Контроллер: получить текущего пользователя
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Пользователь не аутентифицирован' });
    }

    const result = await query(
      `SELECT id, email, full_name, phone, avatar_url, role, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const user = result.rows[0];

    return res.json({
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
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
