import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../database/db';
import { AuthRequest } from '../middleware/auth';

function formatValidationErrors(req: Request) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;

  return errors.array().map((err) => {
    const field = (err as any).param ?? (err as any).path ?? null;
    return {
      field,
      message: err.msg,
    };
  });
}

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : '';
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function recalculateSpecialistRating(specialistId: number) {
  await query(
    `UPDATE specialists
     SET rating = COALESCE((
       SELECT ROUND(AVG(rating)::numeric, 2)
       FROM reviews
       WHERE specialist_id = $1 AND is_approved = TRUE
     ), 0)
     WHERE id = $1`,
    [specialistId]
  );
}

export const validateCreateReview = [
  body('rating')
    .notEmpty()
    .withMessage('Оценка обязательна')
    .isInt({ min: 1, max: 5 })
    .withMessage('Оценка должна быть от 1 до 5'),

  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Комментарий обязателен')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен быть от 10 до 1000 символов'),
];

export const validateUpdateReview = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Оценка должна быть от 1 до 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен быть от 10 до 1000 символов'),
];

export const getSpecialistReviews = async (req: Request, res: Response) => {
  try {
    const specialistId = parsePositiveInt(req.params.specialistId);
    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный id специалиста',
      });
    }

    const specialistResult = await query('SELECT id FROM specialists WHERE id = $1', [
      specialistId,
    ]);

    if (!specialistResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден',
      });
    }

    const reviewsResult = await query(
      `SELECT
         r.id,
         r.specialist_id,
         r.user_id,
         r.rating,
         r.comment,
         r.is_approved,
         r.created_at,
         u.full_name AS user_name,
         u.avatar_url AS user_avatar
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.specialist_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC`,
      [specialistId]
    );

    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS total,
         COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating
       FROM reviews
       WHERE specialist_id = $1 AND is_approved = TRUE`,
      [specialistId]
    );

    return res.json({
      success: true,
      data: reviewsResult.rows,
      total: statsResult.rows[0].total,
      average_rating: Number(statsResult.rows[0].average_rating),
    });
  } catch (error) {
    console.error('Ошибка getSpecialistReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    const errors = formatValidationErrors(req);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors,
      });
    }

    const specialistId = parsePositiveInt(req.params.specialistId);
    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный id специалиста',
      });
    }

    const specialistResult = await query(
      'SELECT id, user_id FROM specialists WHERE id = $1',
      [specialistId]
    );

    if (!specialistResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден',
      });
    }

    const specialist = specialistResult.rows[0];
    if (specialist.user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя оставить отзыв самому себе',
      });
    }

    const rating = Number(req.body.rating);
    const comment = sanitizeString(req.body.comment);

    const existingReview = await query(
      'SELECT id FROM reviews WHERE specialist_id = $1 AND user_id = $2',
      [specialistId, req.user.id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Вы уже оставляли отзыв этому специалисту',
      });
    }

    const createdReview = await query(
      `INSERT INTO reviews (specialist_id, user_id, rating, comment, is_verified, is_approved)
       VALUES ($1, $2, $3, $4, FALSE, TRUE)
       RETURNING id, specialist_id, user_id, rating, comment, is_verified, is_approved, created_at, updated_at`,
      [specialistId, req.user.id, rating, comment]
    );

    await recalculateSpecialistRating(specialistId);

    return res.status(201).json({
      success: true,
      data: createdReview.rows[0],
      message: 'Отзыв успешно добавлен',
    });
  } catch (error) {
    console.error('Ошибка createReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    const result = await query(
      `SELECT
         r.id,
         r.specialist_id,
         r.user_id,
         r.rating,
         r.comment,
         r.is_verified,
         r.is_approved,
         r.created_at,
         r.updated_at,
         s.name AS specialist_name,
         s.specialty AS specialist_specialty
       FROM reviews r
       INNER JOIN specialists s ON s.id = r.specialist_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Ошибка getMyReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    const errors = formatValidationErrors(req);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors,
      });
    }

    const reviewId = parsePositiveInt(req.params.id);
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный id отзыва',
      });
    }

    const reviewResult = await query(
      'SELECT id, specialist_id, user_id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (!reviewResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден',
      });
    }

    const review = reviewResult.rows[0];
    const isOwner = review.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав',
      });
    }

    const nextRating = req.body.rating !== undefined ? Number(req.body.rating) : null;
    const nextComment = req.body.comment !== undefined ? sanitizeString(req.body.comment) : null;

    if (nextRating === null && nextComment === null) {
      return res.status(400).json({
        success: false,
        message: 'Нет данных для обновления',
      });
    }

    const updated = await query(
      `UPDATE reviews
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, specialist_id, user_id, rating, comment, is_verified, is_approved, created_at, updated_at`,
      [nextRating, nextComment, reviewId]
    );

    await recalculateSpecialistRating(review.specialist_id);

    return res.json({
      success: true,
      data: updated.rows[0],
      message: 'Отзыв обновлен',
    });
  } catch (error) {
    console.error('Ошибка updateReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    const reviewId = parsePositiveInt(req.params.id);
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный id отзыва',
      });
    }

    const reviewResult = await query(
      'SELECT id, specialist_id, user_id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (!reviewResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден',
      });
    }

    const review = reviewResult.rows[0];
    const isOwner = review.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав',
      });
    }

    await query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    await recalculateSpecialistRating(review.specialist_id);

    return res.json({
      success: true,
      message: 'Отзыв удален',
    });
  } catch (error) {
    console.error('Ошибка deleteReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};
