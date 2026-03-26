import { Request, Response } from "express";
import { query, withTransaction } from "../database/db";
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
      `SELECT
         spec.id,
         spec.name,
         spec.specialty,
         spec.category,
         spec.description,
         spec.experience,
         COALESCE(AVG(r.rating), 0)::numeric(3,2) AS rating,
         spec.location,
         spec.price_per_hour,
         spec.avatar_url,
         spec.created_at,
         spec.user_id,
         spec.created_by,
         spec.is_approved,
         cat.slug,
         COUNT(r.id)::int AS reviews_total
       FROM specialists spec
       INNER JOIN categories cat ON (spec.category = cat.name)
       LEFT JOIN reviews r ON (r.specialist_id = spec.id AND r.is_approved = TRUE)`;
    const params: any[] = [];
    const cond: string[] = ['spec.is_deleted_by_admin = FALSE'];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      cond.push(`(LOWER(spec.name) LIKE $${params.length} OR LOWER(spec.specialty) LIKE $${params.length})`);
    }

    if (category) {
      params.push(category.toLowerCase());
      cond.push(`LOWER(cat.slug) = $${params.length}`);
    }

    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " GROUP BY spec.id, cat.slug";
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

    const result = await query(
      `SELECT
         spec.id,
         spec.name,
         spec.specialty,
         spec.category,
         spec.description,
         spec.experience,
         COALESCE(AVG(r.rating), 0)::numeric(3,2) AS rating,
         spec.location,
         spec.price_per_hour,
         spec.avatar_url,
         spec.created_at,
         spec.user_id,
         spec.created_by,
         spec.is_approved,
         spec.is_deleted_by_admin,
         COUNT(r.id)::int AS reviews_total
       FROM specialists spec
       LEFT JOIN reviews r ON (r.specialist_id = spec.id AND r.is_approved = TRUE)
       WHERE spec.id = $1
       GROUP BY spec.id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Специалист не найден",
      });
    }

    const specialist = result.rows[0];
    if (specialist.is_deleted_by_admin) {
      return res.status(410).json({
        success: false,
        message: "Это объявление было удалено администратором",
        deletionReason: specialist.deletion_reason,
      });
    }

    res.json({
      success: true,
      data: specialist,
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
    const cleanRating = 0;
    const cleanPrice = sanitizeNumber(price_per_hour);

    // Определяем аватар для специалиста
    let avatarUrl: string;
    
    if (avatarFile) {
      // Если загружен файл при создании специалиста
      avatarUrl = `/uploads/avatars/${avatarFile.filename}`;
    } else {
      // Получаем аватар пользователя из базы
      const userResult = await query(
        'SELECT avatar_url FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].avatar_url) {
        // Используем аватар пользователя если он есть
        avatarUrl = userResult.rows[0].avatar_url;
      } else {
        // Иначе используем default
        avatarUrl = "/uploads/avatars/default.jpg";
      }
    }

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
         location = $6,
         price_per_hour = $7,
         avatar_url = $8
       WHERE id = $9
       RETURNING *`,
      [
        sanitizeString(name),
        sanitizeString(specialty),
        sanitizeString(category),
        sanitizeString(description),
        sanitizeNumber(experience),
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Требуется авторизация",
      });
    }

    const id = sanitizeNumber(req.params.id);

    const result = await query("SELECT * FROM specialists WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Специалист не найден" });
    }

    const specialist = result.rows[0];

    const isAdmin = req.user.role === "admin";
    const isOwner =
      specialist.user_id === req.user.id ||
      specialist.created_by === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Недостаточно прав для удаления этого специалиста",
      });
    }

    if (isAdmin) {
      const reason = sanitizeString(req.body?.reason);
      if (!reason || reason.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Укажите причину удаления (минимум 5 символов)',
        });
      }

      await withTransaction(async (client) => {
        // Освобождаем слоты для отменяемых записей
        await client.query(
          `UPDATE specialist_slots
           SET is_booked = FALSE
           WHERE id IN (
             SELECT slot_id FROM appointments
             WHERE specialist_id = $1 
               AND status IN ('pending', 'confirmed')
               AND slot_id IS NOT NULL
           )`,
          [id]
        );

        // Отменяем активные записи
        await client.query(
          `UPDATE appointments
           SET status = 'cancelled_by_specialist',
               cancel_reason = $1,
               updated_at = NOW()
           WHERE specialist_id = $2
             AND status IN ('pending', 'confirmed')`,
          [`Администратор удалил профиль: ${reason}`, id]
        );

        // Помечаем специалиста как удаленного
        await client.query(
          `UPDATE specialists
           SET is_deleted_by_admin = TRUE,
               deletion_reason = $1,
               deletion_reason_acknowledged = FALSE,
               deleted_at = NOW()
           WHERE id = $2`,
          [reason, id]
        );

        // Автоматически удаляем (отклоняем) все ожидающие модерацию отзывы при блокировке специалиста
        await client.query(
          `DELETE FROM reviews 
           WHERE specialist_id = $1 AND is_approved = FALSE`,
          [id]
        );
      });

      return res.json({
        success: true,
        message: 'Объявление скрыто администратором',
      });
    }

    await safeDeleteFile(specialist.avatar_url);

    // Use transaction to ensure all cascade operations complete atomically
    await withTransaction(async (client) => {
      // Cancel all active appointments for this specialist FIRST
      // This must happen before deletion to properly record cancellation reason
      const cancelResult = await client.query(
        `UPDATE appointments
         SET status = 'cancelled_by_specialist',
             cancel_reason = 'Specialist deleted',
             updated_at = NOW()
         WHERE specialist_id = $1 
         AND status IN ('pending', 'confirmed')`,
        [id]
      );
      console.log(`Cancelled ${cancelResult.rowCount} appointments for specialist ${id}`);

      // Delete specialist - ON DELETE CASCADE will handle:
      // - specialist_slots deletion
      // - appointments deletion (if not already cancelled)
      // This is the safest approach that respects foreign key constraints
      await client.query("DELETE FROM specialists WHERE id = $1", [id]);
      console.log(`Deleted specialist ${id} and cascaded deletions`);
    });

    res.json({
      success: true,
      message: "Specialist deleted",
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
      "SELECT * FROM specialists WHERE user_id = $1 AND is_deleted_by_admin = FALSE ORDER BY id DESC",
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

export const getMyDeletionNotices = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Не авторизован' });
    }

    const result = await query(
      `SELECT id, name, specialty, deletion_reason, deleted_at
       FROM specialists
       WHERE is_deleted_by_admin = TRUE
         AND deletion_reason_acknowledged = FALSE
         AND (user_id = $1 OR created_by = $1)
       ORDER BY deleted_at DESC, id DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error('Ошибка getMyDeletionNotices:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const acknowledgeDeletionNotice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Не авторизован' });
    }

    const id = sanitizeNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Некорректный id объявления' });
    }

    const updated = await query(
      `UPDATE specialists
       SET deletion_reason_acknowledged = TRUE
       WHERE id = $1
         AND is_deleted_by_admin = TRUE
         AND (user_id = $2 OR created_by = $2)
       RETURNING id`,
      [id, req.user.id]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ success: false, message: 'Уведомление не найдено' });
    }

    return res.json({ success: true, message: 'Уведомление подтверждено' });
  } catch (err) {
    console.error('Ошибка acknowledgeDeletionNotice:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
