import { Request, Response } from "express";
import { query } from "../database/db";
import { AuthRequest } from "../middleware/auth";
import path from "path";
import fs from "fs/promises";
import { body, validationResult } from "express-validator";

/* --------------------------------------------------------
    УТИЛИТЫ
-------------------------------------------------------- */

/**
 * Форматирование ошибок валидации
 */
function formatValidationErrors(req: Request) {
  const result = validationResult(req);

  if (result.isEmpty()) return null;

  return result.array().map((err) => {
    switch (err.type) {

      case "field":
        return {
          field: err.path,
          message: err.msg,
          location: err.location,
        };

      case "unknown_fields":
        return {
          field: err.fields.join(", "),
          message: err.msg,
        };

      case "alternative":
        return {
          field: null,
          message: err.msg,
          alternatives: err.nestedErrors.length,
        };

      case "alternative_grouped":
        return {
          field: null,
          message: err.msg,
          alternatives: err.nestedErrors.length,
        };

      default:
        return {
          field: null,
          message: "unknown error",
        };
    }
  });
}
/**
 * Безопасное удаление файла
 */
async function safeDeleteFile(fileUrl: string) {
  if (!fileUrl || fileUrl.includes("default.jpg")) return;

  const safePath = path.join("public", fileUrl.replace(/^\/+/, ""));
  try {
    await fs.unlink(safePath);
  } catch (err) {
    console.warn("Не удалось удалить файл:", safePath, err);
  }
}

/**
 * Нормализация строк
 */
function sanitizeString(value: any) {
  return typeof value === "string"
    ? value.trim().replace(/\s{2,}/g, " ")
    : "";
}

/**
 * Нормализация числовых параметров
 */
function sanitizeNumber(value: any, min = 0, max: number | null = null): number {
  let num = parseFloat(String(value));
  if (isNaN(num)) num = min;
  if (num < min) num = min;
  if (max !== null && num > max) num = max;
  return num;
}

/* --------------------------------------------------------
    ВАЛИДАЦИЯ
-------------------------------------------------------- */

export const validateCreateSpecialist = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Введите имя специалиста")
    .isLength({ min: 2, max: 100 }).withMessage("Имя должно быть от 2 до 100 символов"),

  body("specialty")
    .trim()
    .notEmpty()
    .withMessage("Введите специальность")
    .isLength({ max: 150 }),

  body("category")
    .trim()
    .isLength({ max: 100 }),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Укажите местоположение")
    .isLength({ max: 150 }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }),

  body("experience").optional().isNumeric(),
  body("rating").optional().isNumeric(),
  body("price_per_hour").optional().isNumeric(),
];

/* --------------------------------------------------------
    GET — Все специалисты
-------------------------------------------------------- */

export const getAllSpecialists = async (req: Request, res: Response) => {
  try {
    const search = sanitizeString(req.query.search);
    const category = sanitizeString(req.query.category);

    let sql =
      "SELECT spec.*, cat.slug FROM specialists spec INNER JOIN categories cat ON (spec.category = cat.name)";
    const params: any[] = [];
    const cond: string[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      cond.push(`(LOWER(spec.name) LIKE $${params.length} OR LOWER(spec.specialty) LIKE $${params.length})`);
    }

    if (category) {
      params.push(category.toLowerCase());
      cond.push(`LOWER(cat.slug) = $${params.length}`);
    }

    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " ORDER BY spec.id DESC";

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Ошибка getAllSpecialists:", err);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

/* --------------------------------------------------------
    GET — Специалист по ID
-------------------------------------------------------- */

export const getSpecialistById = async (req: Request, res: Response) => {
  try {
    const id = sanitizeNumber(req.params.id);

    const result = await query("SELECT * FROM specialists WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Специалист не найден",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Ошибка getSpecialistById:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    POST — Создание специалиста
-------------------------------------------------------- */

export const createSpecialist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Требуется авторизация",
      });
    }

    const errors = formatValidationErrors(req);
    if (errors) {
      return res.status(400).json({
        success: false,
        message: "Ошибка валидации",
        errors,
      });
    }

    const {
      name,
      specialty,
      category,
      description,
      experience,
      rating,
      location,
      price_per_hour,
    } = req.body;

    const avatarFile = req.file;

    const cleanName = sanitizeString(name) || req.user.fullName;
    const cleanSpecialty = sanitizeString(specialty);
    const cleanCategory = sanitizeString(category) || "Другое";
    const cleanDescription = sanitizeString(description);
    const cleanLocation = sanitizeString(location);

    const cleanExp = sanitizeNumber(experience);
    const cleanRating = sanitizeNumber(rating, 0, 5);
    const cleanPrice = sanitizeNumber(price_per_hour);

    const avatarUrl = avatarFile
      ? `/uploads/avatars/${avatarFile.filename}`
      : "/uploads/avatars/default.jpg";

    const result = await query(
      `INSERT INTO specialists 
       (name, specialty, category, description, experience, rating, location, 
        price_per_hour, avatar_url, user_id, created_by, is_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        cleanName,
        cleanSpecialty,
        cleanCategory,
        cleanDescription,
        cleanExp,
        cleanRating,
        cleanLocation,
        cleanPrice,
        avatarUrl,
        req.user.id,
        req.user.id,
        req.user.role === "admin",
      ]
    );

    // Если обычный пользователь → делаем его специалистом
    if (req.user.role === "user") {
      await query("UPDATE users SET role = 'specialist' WHERE id = $1", [
        req.user.id,
      ]);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message:
        req.user.role === "admin"
          ? "Специалист создан успешно"
          : "Профиль создан и ожидает подтверждения",
    });
  } catch (err) {
    console.error("Ошибка createSpecialist:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    PATCH — Обновление аватара
-------------------------------------------------------- */

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const id = sanitizeNumber(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Файл не загружен" });
    }

    const result = await query("SELECT avatar_url FROM specialists WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    const currentAvatar = result.rows[0].avatar_url;
    await safeDeleteFile(currentAvatar);

    const newUrl = `/uploads/avatars/${file.filename}`;

    const updated = await query(
      "UPDATE specialists SET avatar_url = $1 WHERE id = $2 RETURNING *",
      [newUrl, id]
    );

    res.json({
      success: true,
      data: updated.rows[0],
      message: "Аватар обновлён",
    });
  } catch (err) {
    console.error("Ошибка updateAvatar:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    DELETE — Удаление аватара
-------------------------------------------------------- */

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const id = sanitizeNumber(req.params.id);

    const result = await query("SELECT avatar_url FROM specialists WHERE id = $1", [
      id,
    ]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    await safeDeleteFile(result.rows[0].avatar_url);

    const def = "/uploads/avatars/default.jpg";
    const updated = await query(
      "UPDATE specialists SET avatar_url = $1 WHERE id = $2 RETURNING *",
      [def, id]
    );

    res.json({
      success: true,
      data: updated.rows[0],
      message: "Аватар удалён",
    });
  } catch (err) {
    console.error("Ошибка deleteAvatar:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    PATCH — Обновление специалиста
-------------------------------------------------------- */

export const updateSpecialist = async (req: Request, res: Response) => {
  try {
    const id = sanitizeNumber(req.params.id);

    const {
      name,
      specialty,
      category,
      description,
      experience,
      rating,
      location,
      price_per_hour,
      avatar_url,
    } = req.body;

    const updated = await query(
      `UPDATE specialists SET
         name = $1,
         specialty = $2,
         category = $3,
         description = $4,
         experience = $5,
         rating = $6,
         location = $7,
         price_per_hour = $8,
         avatar_url = $9
       WHERE id = $10
       RETURNING *`,
      [
        sanitizeString(name),
        sanitizeString(specialty),
        sanitizeString(category),
        sanitizeString(description),
        sanitizeNumber(experience),
        sanitizeNumber(rating, 0, 5),
        sanitizeString(location),
        sanitizeNumber(price_per_hour),
        sanitizeString(avatar_url),
        id,
      ]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    res.json({
      success: true,
      data: updated.rows[0],
      message: "Данные специалиста обновлены",
    });
  } catch (err) {
    console.error("Ошибка updateSpecialist:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    DELETE — Удаление специалиста
-------------------------------------------------------- */

export const deleteSpecialist = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Недостаточно прав",
      });
    }

    const id = sanitizeNumber(req.params.id);

    const result = await query("SELECT * FROM specialists WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    await safeDeleteFile(result.rows[0].avatar_url);

    await query("DELETE FROM specialists WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Специалист удалён",
    });
  } catch (err) {
    console.error("Ошибка deleteSpecialist:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

/* --------------------------------------------------------
    GET — Специалисты текущего пользователя
-------------------------------------------------------- */

export const getMySpecialists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Не авторизован",
      });
    }

    const result = await query(
      "SELECT * FROM specialists WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Ошибка getMySpecialists:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};
