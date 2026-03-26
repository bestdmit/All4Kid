import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../database/db";
import { AuthRequest } from "../middleware/auth";

// --- Helper Functions ---

function sanitizeNumber(value: any, min = 0, max: number | null = null): number {
  let num = parseFloat(String(value));
  if (isNaN(num)) num = min;
  if (num < min) num = min;
  if (max !== null && num > max) num = max;
  return num;
}

function sanitizeString(value: any) {
  return typeof value === "string"
    ? value.trim().replace(/\s{2,}/g, " ")
    : "";
}

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

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function recomputeSpecialistRating(specialistId: number) {
  const agg = await query(
    `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS avg_rating
     FROM reviews
     WHERE specialist_id = $1 AND is_approved = TRUE`,
    [specialistId]
  );
  const avg = agg.rows[0]?.avg_rating ?? 0;
  await query("UPDATE specialists SET rating = $1 WHERE id = $2", [avg, specialistId]);
  return Number(avg);
}

// --- Validation Middleware ---

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

// --- Controllers ---

export const getUnapprovedReviews = async (req: Request, res: Response) => {
  try {
    const result = await query(
        `SELECT r.*, u.full_name as user_name, u.avatar_url as user_avatar, s.name as specialist_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN specialists s ON r.specialist_id = s.id
       WHERE r.is_approved = FALSE
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Ошибка getUnapprovedReviews:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

export const getSpecialistReviews = async (req: Request, res: Response) => {
  try {
    const specialistId = sanitizeNumber(req.params.specialistId || req.params.id, 0); 
    if (!specialistId) {
      return res.status(400).json({ success: false, message: "Некорректный id специалиста" });
    }

    const result = await query(
      `SELECT
         r.*,
         u.full_name AS user_name,
         u.avatar_url AS user_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.specialist_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC`,
      [specialistId]
    );

    const avgRes = await query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating
       FROM reviews
       WHERE specialist_id = $1 AND is_approved = TRUE`,
      [specialistId]
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      average_rating: Number(avgRes.rows[0]?.average_rating ?? 0),
    });
  } catch (error) {
    console.error('Ошибка getSpecialistReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
};

// Functions from HEAD but updated to use recomputeSpecialistRating
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

    const specialistId = parsePositiveInt(req.params.specialistId || req.params.id);
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
       VALUES ($1, $2, $3, $4, FALSE, FALSE)
       RETURNING id, specialist_id, user_id, rating, comment, is_verified, is_approved, created_at, updated_at`,
      [specialistId, req.user.id, rating, comment]
    );

    // await recomputeSpecialistRating(specialistId); // Rating doesn't change until approved

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
       RETURNING *`,
      [nextRating, nextComment, reviewId]
    );

    if (updated.rows.length > 0) {
        await recomputeSpecialistRating(review.specialist_id);
    }
    
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

export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Требуется авторизация" });
    }

    const reviewId = sanitizeNumber(req.body.id, 0);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: "Некорректный id отзыва" });
    }

    const updated = await query(
        `UPDATE reviews SET is_approved = $1
       WHERE id = $2 RETURNING *`,
        [true, reviewId]
    );

    if (updated.rows.length === 0) {
       return res.status(404).json({ success: false, message: "Отзыв не найден" });
    }

    const specs = await query(
        'SELECT specialist_id FROM reviews WHERE id = $1',
        [reviewId]
    );
    
    if (specs.rows.length > 0) {
        await recomputeSpecialistRating(specs.rows[0].specialist_id);
    }

    res.json({
      success: true,
      data: updated.rows,
    });
  } catch (err) {
    console.error("Ошибка approveReview:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
}

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    const reviewId = parsePositiveInt(req.params.id) || parsePositiveInt(req.body.id);
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
    
    await recomputeSpecialistRating(review.specialist_id);

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
