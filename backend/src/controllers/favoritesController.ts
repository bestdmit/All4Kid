import { Response } from 'express';
import { query } from '../database/db';
import { AuthRequest } from '../middleware/auth';

function sanitizeNumber(value: any, min = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) return min;
  return num < min ? min : num;
}

async function ensureSpecialistExists(specialistId: number) {
  const result = await query(
    'SELECT id, is_deleted_by_admin FROM specialists WHERE id = $1',
    [specialistId]
  );

  if (!result.rows.length) {
    return { exists: false, isDeleted: false };
  }

  return {
    exists: true,
    isDeleted: Boolean(result.rows[0].is_deleted_by_admin),
  };
}

export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: 'Некорректный id специалиста' });
    }

    const specialist = await ensureSpecialistExists(specialistId);
    if (!specialist.exists) {
      return res.status(404).json({ success: false, message: 'Специалист не найден' });
    }

    if (specialist.isDeleted) {
      return res.status(410).json({ success: false, message: 'Специалист удален' });
    }

    await query(
      `INSERT INTO user_favorite_specialists (user_id, specialist_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, specialist_id) DO NOTHING`,
      [req.user.id, specialistId]
    );

    return res.json({ success: true, message: 'Добавлено в избранное' });
  } catch (error) {
    console.error('Ошибка addFavorite:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: 'Некорректный id специалиста' });
    }

    await query(
      'DELETE FROM user_favorite_specialists WHERE user_id = $1 AND specialist_id = $2',
      [req.user.id, specialistId]
    );

    return res.json({ success: true, message: 'Удалено из избранного' });
  } catch (error) {
    console.error('Ошибка removeFavorite:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getMyFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const result = await query(
      `SELECT
         spec.id,
         spec.name,
         spec.specialty,
         spec.experience,
         COALESCE(AVG(r.rating), 0)::numeric(3,2) AS rating,
         COUNT(r.id)::int AS reviews_total,
         spec.location,
         spec.price_per_hour,
         spec.avatar_url,
         spec.created_at,
         spec.created_by,
         spec.description,
         MAX(fav.created_at) AS favorited_at
       FROM user_favorite_specialists fav
       JOIN specialists spec ON spec.id = fav.specialist_id
       LEFT JOIN reviews r ON (r.specialist_id = spec.id AND r.is_approved = TRUE)
       WHERE fav.user_id = $1
         AND spec.is_deleted_by_admin = FALSE
       GROUP BY spec.id
       ORDER BY favorited_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Ошибка getMyFavorites:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getFavoriteStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: 'Некорректный id специалиста' });
    }

    const result = await query(
      `SELECT 1
       FROM user_favorite_specialists
       WHERE user_id = $1 AND specialist_id = $2
       LIMIT 1`,
      [req.user.id, specialistId]
    );

    return res.json({
      success: true,
      data: { isFavorite: result.rows.length > 0 },
    });
  } catch (error) {
    console.error('Ошибка getFavoriteStatus:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
