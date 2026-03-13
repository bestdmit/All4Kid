import { Request, Response } from "express";
import { query } from "../database/db";
import { AuthRequest } from "../middleware/auth";

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

export const getUnapprovedReviews = async (req: Request, res: Response) => {
  try {
    const result = await query(
        `SELECT *
       FROM reviews
       WHERE is_approved = FALSE
       ORDER BY created_at DESC`
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

export const getReviewsBySpecialistId = async (req: Request, res: Response) => {
  try {
    const specialistId = sanitizeNumber(req.params.id, 0);
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

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      average_rating: Number(avgRes.rows[0]?.average_rating ?? 0),
    });
  } catch (err) {
    console.error("Ошибка getReviewsBySpecialistId:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
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

    const specs = await query(
        'SELECT specialist_id FROM reviews WHERE id = $1',
        [reviewId]
    );

    await recomputeSpecialistRating(specs.rows[0].specialist_id);

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
      return res.status(401).json({ success: false, message: "Требуется авторизация" });
    }

    const reviewId = sanitizeNumber(req.body.id, 0);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: "Некорректный id отзыва" });
    }

    const deleted = await query(
        `DELETE FROM reviews WHERE id = $1 RETURNING *`,
        [reviewId]
    );

    res.json({
      success: true,
      data: deleted.rows,
    });
  } catch (err) {
    console.error("Ошибка deleteReview:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
}

export const createReviewForSpecialist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Требуется авторизация" });
    }

    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: "Некорректный id специалиста" });
    }

    const rating = sanitizeNumber(req.body?.rating, 1, 5);
    const comment = sanitizeString(req.body?.comment);
    if (!comment) {
      return res.status(400).json({ success: false, message: "Комментарий обязателен" });
    }

    // Проверяем, что специалист существует
    const spec = await query("SELECT id FROM specialists WHERE id = $1", [specialistId]);
    if (!spec.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    const inserted = await query(
      `INSERT INTO reviews (specialist_id, user_id, rating, comment, is_verified, is_approved)
       VALUES ($1, $2, $3, $4, FALSE, FALSE)
       RETURNING *`,
      [specialistId, req.user.id, rating, comment]
    );

    const average = await recomputeSpecialistRating(specialistId);

    const enriched = await query(
      `SELECT
         r.*,
         u.full_name AS user_name,
         u.avatar_url AS user_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [inserted.rows[0].id]
    );

    return res.status(201).json({
      success: true,
      data: enriched.rows[0],
      average_rating: average,
      message: "Отзыв добавлен",
    });
  } catch (err) {
    console.error("Ошибка createReviewForSpecialist:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

