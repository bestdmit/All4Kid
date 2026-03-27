import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, withTransaction } from '../database/db';
import { PoolClient } from 'pg';

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_parent'
  | 'cancelled_by_specialist'
  | 'completed'
  | 'no_show';

class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const PARENT_CANCEL_STATUSES: AppointmentStatus[] = ['cancelled_by_parent'];
const SPECIALIST_STATUSES: AppointmentStatus[] = ['confirmed', 'cancelled_by_specialist', 'completed', 'no_show'];
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled_by_parent', 'cancelled_by_specialist'],
  confirmed: ['completed', 'no_show', 'cancelled_by_parent', 'cancelled_by_specialist'],
  cancelled_by_parent: [],
  cancelled_by_specialist: [],
  completed: [],
  no_show: [],
};

function sanitizeNumber(value: any, min = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) return min;
  return num < min ? min : num;
}

function sanitizeString(value: any): string {
  return typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : '';
}

function parseDateTime(value: any): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toISODate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function getSpecialistOrThrow(specialistId: number, client?: PoolClient) {
  const db = client ?? { query };
  const result = await db.query('SELECT id, user_id, created_by, price_per_hour FROM specialists WHERE id = $1', [specialistId]);
  if (!result.rows.length) {
    throw new HttpError(404, 'Специалист не найден');
  }
  return result.rows[0] as {
    id: number;
    user_id: number | null;
    created_by: number | null;
    price_per_hour: string | number;
  };
}

function assertCanManageSpecialist(req: AuthRequest, specialistUserId: number | null, specialistCreatedBy: number | null) {
  if (!req.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  if (req.user.role === 'admin') {
    return;
  }

  const isOwnerByUser = !!specialistUserId && specialistUserId === req.user.id;
  const isOwnerByCreator = !!specialistCreatedBy && specialistCreatedBy === req.user.id;

  if (!isOwnerByUser && !isOwnerByCreator) {
    throw new HttpError(403, 'Недостаточно прав для управления расписанием');
  }
}

export const getSpecialistSlots = async (req: AuthRequest, res: Response) => {
  try {
    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: 'Некорректный id специалиста' });
    }

    await getSpecialistOrThrow(specialistId);

    const date = sanitizeString(req.query.date);
    let sql = `
      SELECT id, specialist_id, starts_at, ends_at, price, is_booked
      FROM specialist_slots
      WHERE specialist_id = $1
        AND starts_at >= NOW()
        AND is_booked = FALSE
    `;
    const params: any[] = [specialistId];

    if (date) {
      params.push(date);
      sql += ` AND starts_at::date = $${params.length}::date`;
    }

    sql += ' ORDER BY starts_at ASC';

    const result = await query(sql, params);

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error('Ошибка getSpecialistSlots:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createSpecialistSlot = async (req: AuthRequest, res: Response) => {
  try {
    const specialistId = sanitizeNumber(req.params.id, 0);
    if (!specialistId) {
      return res.status(400).json({ success: false, message: 'Некорректный id специалиста' });
    }

    const startsAt = parseDateTime(req.body.startsAt);
    const endsAt = parseDateTime(req.body.endsAt);
    const price = sanitizeNumber(req.body.price, 0);

    if (!startsAt || !endsAt) {
      return res.status(400).json({ success: false, message: 'Некорректные startsAt/endsAt' });
    }

    if (endsAt <= startsAt) {
      return res.status(400).json({ success: false, message: 'Время окончания должно быть позже начала' });
    }

    if (startsAt <= new Date()) {
      return res.status(400).json({ success: false, message: 'Нельзя создавать слот в прошлом' });
    }

    const specialist = await getSpecialistOrThrow(specialistId);
    assertCanManageSpecialist(req, specialist.user_id, specialist.created_by);

    const overlapCheck = await query(
      `SELECT id
       FROM specialist_slots
       WHERE specialist_id = $1
         AND NOT ($3 <= starts_at OR $2 >= ends_at)
       LIMIT 1`,
      [specialistId, startsAt.toISOString(), endsAt.toISOString()]
    );

    if (overlapCheck.rows.length) {
      return res.status(409).json({ success: false, message: 'Слот пересекается с существующим' });
    }

    const result = await query(
      `INSERT INTO specialist_slots (specialist_id, starts_at, ends_at, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [specialistId, startsAt.toISOString(), endsAt.toISOString(), price]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Слот создан',
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error('Ошибка createSpecialistSlot:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteSpecialistSlot = async (req: AuthRequest, res: Response) => {
  try {
    const specialistId = sanitizeNumber(req.params.id, 0);
    const slotId = sanitizeNumber(req.params.slotId, 0);

    if (!specialistId || !slotId) {
      return res.status(400).json({ success: false, message: 'Некорректные id' });
    }

    const specialist = await getSpecialistOrThrow(specialistId);
    assertCanManageSpecialist(req, specialist.user_id, specialist.created_by);

    const deleted = await query(
      `DELETE FROM specialist_slots
       WHERE id = $1 AND specialist_id = $2 AND is_booked = FALSE
       RETURNING *`,
      [slotId, specialistId]
    );

    if (!deleted.rows.length) {
      return res.status(404).json({ success: false, message: 'Слот не найден или уже забронирован' });
    }

    return res.json({ success: true, data: deleted.rows[0], message: 'Слот удален' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error('Ошибка deleteSpecialistSlot:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const specialistId = sanitizeNumber(req.params.id, 0);
    const slotId = sanitizeNumber(req.body.slotId, 0);
    const childName = sanitizeString(req.body.childName);
    const childBirthDateRaw = sanitizeString(req.body.childBirthDate);
    const comment = sanitizeString(req.body.comment);

    if (!specialistId || !slotId) {
      return res.status(400).json({ success: false, message: 'Некорректные id специалиста или слота' });
    }

    if (!childName || childName.length < 2) {
      return res.status(400).json({ success: false, message: 'Укажите имя ребенка (минимум 2 символа)' });
    }

    if (childBirthDateRaw && Number.isNaN(new Date(childBirthDateRaw).getTime())) {
      return res.status(400).json({ success: false, message: 'Некорректная дата рождения ребенка' });
    }

    const data = await withTransaction(async (client) => {
      await getSpecialistOrThrow(specialistId, client);

      const slotRes = await client.query(
        `SELECT id, specialist_id, starts_at, ends_at, is_booked, price
         FROM specialist_slots
         WHERE id = $1 AND specialist_id = $2
         FOR UPDATE`,
        [slotId, specialistId]
      );

      if (!slotRes.rows.length) {
        throw new HttpError(404, 'Слот не найден');
      }

      const slot = slotRes.rows[0] as {
        id: number;
        specialist_id: number;
        starts_at: string;
        ends_at: string;
        is_booked: boolean;
        price: string;
      };

      if (slot.is_booked) {
        throw new HttpError(409, 'Слот уже забронирован');
      }

      if (new Date(slot.starts_at) <= new Date()) {
        throw new HttpError(400, 'Нельзя записаться на слот в прошлом');
      }

      const inserted = await client.query(
        `INSERT INTO appointments (
          specialist_id,
          parent_user_id,
          slot_id,
          child_name,
          child_birth_date,
          comment,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *`,
        [
          specialistId,
          req.user!.id,
          slotId,
          childName,
          childBirthDateRaw || null,
          comment,
        ]
      );

      await client.query('UPDATE specialist_slots SET is_booked = TRUE WHERE id = $1', [slotId]);

      const enriched = await client.query(
        `SELECT
           a.*,
           s.name AS specialist_name,
           ss.starts_at,
           ss.ends_at,
           ss.price,
           u.full_name AS parent_name
         FROM appointments a
         JOIN specialists s ON s.id = a.specialist_id
         JOIN specialist_slots ss ON ss.id = a.slot_id
         JOIN users u ON u.id = a.parent_user_id
         WHERE a.id = $1`,
        [inserted.rows[0].id]
      );

      return enriched.rows[0];
    });

    return res.status(201).json({
      success: true,
      data,
      message: 'Запись создана',
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    if (error?.code === '23505') {
      console.warn('Booking conflict:', error.detail, error.constraint);
      return res.status(409).json({ success: false, message: 'Слот уже забронирован' });
    }

    console.error('Ошибка createAppointment:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const result = await query(
      `SELECT
         a.*,
         s.name AS specialist_name,
         s.specialty AS specialist_specialty,
         s.avatar_url AS specialist_avatar_url,
         ss.starts_at,
         ss.ends_at,
         ss.price
       FROM appointments a
       JOIN specialists s ON s.id = a.specialist_id
       JOIN specialist_slots ss ON ss.id = a.slot_id
       WHERE a.parent_user_id = $1
         AND a.hidden_for_parent = FALSE
       ORDER BY ss.starts_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Ошибка getMyAppointments:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getMySpecialistAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const includeAllForAdmin = req.user.role === 'admin' && req.query.adminMode === 'true';

    let sql = `
      SELECT
        a.*,
        s.name AS specialist_name,
        s.specialty AS specialist_specialty,
        ss.starts_at,
        ss.ends_at,
        ss.price,
        u.full_name AS parent_name,
        u.phone AS parent_phone,
        su.phone AS specialist_phone
      FROM appointments a
      JOIN specialists s ON s.id = a.specialist_id
      JOIN specialist_slots ss ON ss.id = a.slot_id
      JOIN users u ON u.id = a.parent_user_id
      LEFT JOIN users su ON su.id = s.user_id
    `;
    const params: any[] = [];

    if (!includeAllForAdmin) {
      params.push(req.user.id);
      sql += ` WHERE (s.user_id = $${params.length} OR s.created_by = $${params.length}) AND a.hidden_for_specialist = FALSE`;
    } else {
      sql += ' WHERE a.hidden_for_specialist = FALSE';
    }

    sql += ' ORDER BY ss.starts_at DESC';

    const result = await query(sql, params);

    return res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Ошибка getMySpecialistAppointments:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const appointmentId = sanitizeNumber(req.params.id, 0);
    const status = sanitizeString(req.body.status) as AppointmentStatus;
    const cancelReason = sanitizeString(req.body.cancelReason);

    if (!appointmentId || !status) {
      return res.status(400).json({ success: false, message: 'Некорректные параметры' });
    }

    if (!Object.keys(ALLOWED_TRANSITIONS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Неизвестный статус' });
    }

    const updated = await withTransaction(async (client) => {
      const currentRes = await client.query(
        `SELECT
           a.*,
           s.user_id AS specialist_owner_id,
           s.created_by AS specialist_created_by,
           ss.starts_at
         FROM appointments a
         JOIN specialists s ON s.id = a.specialist_id
         JOIN specialist_slots ss ON ss.id = a.slot_id
         WHERE a.id = $1
         FOR UPDATE`,
        [appointmentId]
      );

      if (!currentRes.rows.length) {
        throw new HttpError(404, 'Запись не найдена');
      }

      const current = currentRes.rows[0] as {
        id: number;
        parent_user_id: number;
        specialist_owner_id: number | null;
        specialist_created_by: number | null;
        status: AppointmentStatus;
        slot_id: number;
        starts_at: string;
      };

      const isAdmin = req.user!.role === 'admin';
      const isParent = current.parent_user_id === req.user!.id;
      const isSpecialistOwner =
        (!!current.specialist_owner_id && current.specialist_owner_id === req.user!.id) ||
        (!!current.specialist_created_by && current.specialist_created_by === req.user!.id);

      if (!isAdmin && !isParent && !isSpecialistOwner) {
        throw new HttpError(403, 'Недостаточно прав для изменения записи');
      }

      if (isParent && !isAdmin && !PARENT_CANCEL_STATUSES.includes(status)) {
        throw new HttpError(403, 'Родитель может только отменить запись со своей стороны');
      }

      if (isSpecialistOwner && !SPECIALIST_STATUSES.includes(status) && !PARENT_CANCEL_STATUSES.includes(status)) {
        throw new HttpError(403, 'Недостаточно прав для этого статуса');
      }

      if (!ALLOWED_TRANSITIONS[current.status].includes(status)) {
        throw new HttpError(409, `Нельзя изменить статус ${current.status} -> ${status}`);
      }

      if (status === 'cancelled_by_parent') {
        const startsAt = new Date(current.starts_at);
        if (startsAt.getTime() - Date.now() < 3 * 60 * 60 * 1000 && !isAdmin) {
          throw new HttpError(409, 'Отмена возможна минимум за 3 часа до начала');
        }
      }

      // Сохраняем, кем инициирована отмена, чтобы корректно отображать это в UI.
      let effectiveCancelReason: string | null = cancelReason || null;
      if (status === 'cancelled_by_specialist' && isAdmin && !effectiveCancelReason) {
        effectiveCancelReason = 'cancelled_by_admin';
      }

      const result = await client.query(
        `UPDATE appointments
         SET status = $1,
             cancel_reason = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, effectiveCancelReason, appointmentId]
      );

      if (status.startsWith('cancelled')) {
        await client.query(
          `UPDATE specialist_slots
           SET is_booked = FALSE
           WHERE id = $1 AND starts_at > NOW()`,
          [current.slot_id]
        );
      }

      const enriched = await client.query(
        `SELECT
           a.*,
           s.name AS specialist_name,
           ss.starts_at,
           ss.ends_at,
           ss.price,
           u.full_name AS parent_name
         FROM appointments a
         JOIN specialists s ON s.id = a.specialist_id
         JOIN specialist_slots ss ON ss.id = a.slot_id
         JOIN users u ON u.id = a.parent_user_id
         WHERE a.id = $1`,
        [result.rows[0].id]
      );

      return enriched.rows[0];
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Статус обновлен',
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error('Ошибка updateAppointmentStatus:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const hideAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const appointmentId = sanitizeNumber(req.params.id, 0);
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Некорректный id записи' });
    }

    const updated = await withTransaction(async (client) => {
      const currentRes = await client.query(
        `SELECT
           a.id,
           a.parent_user_id,
           a.status,
           s.user_id AS specialist_owner_id,
           s.created_by AS specialist_created_by
         FROM appointments a
         JOIN specialists s ON s.id = a.specialist_id
         WHERE a.id = $1
         FOR UPDATE`,
        [appointmentId]
      );

      if (!currentRes.rows.length) {
        throw new HttpError(404, 'Запись не найдена');
      }

      const current = currentRes.rows[0] as {
        id: number;
        parent_user_id: number;
        status: AppointmentStatus;
        specialist_owner_id: number | null;
        specialist_created_by: number | null;
      };

      const terminalStatuses: AppointmentStatus[] = ['completed', 'cancelled_by_parent', 'cancelled_by_specialist', 'no_show'];
      if (!terminalStatuses.includes(current.status)) {
        throw new HttpError(409, 'Скрыть можно только завершенную или отмененную запись');
      }

      const isAdmin = req.user!.role === 'admin';
      const isParent = current.parent_user_id === req.user!.id;
      const isSpecialistOwner =
        (!!current.specialist_owner_id && current.specialist_owner_id === req.user!.id) ||
        (!!current.specialist_created_by && current.specialist_created_by === req.user!.id);

      if (!isAdmin && !isParent && !isSpecialistOwner) {
        throw new HttpError(403, 'Недостаточно прав для скрытия записи');
      }

      let setClause = '';
      if (isParent && !isSpecialistOwner && !isAdmin) {
        setClause = 'hidden_for_parent = TRUE';
      } else if (isSpecialistOwner && !isParent && !isAdmin) {
        setClause = 'hidden_for_specialist = TRUE';
      } else if (isParent && isSpecialistOwner) {
        setClause = 'hidden_for_parent = TRUE, hidden_for_specialist = TRUE';
      } else if (isAdmin) {
        setClause = 'hidden_for_specialist = TRUE';
      }

      const result = await client.query(
        `UPDATE appointments
         SET ${setClause},
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [appointmentId]
      );

      return result.rows[0];
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Запись скрыта',
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error('Ошибка hideAppointment:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteAppointmentsByChild = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const childName = sanitizeString(req.body.childName);
    const childBirthDateRaw = sanitizeString(req.body.childBirthDate);

    if (!childName) {
      return res.status(400).json({ success: false, message: 'Некорректное имя ребенка' });
    }

    const normalizedBirthDate = childBirthDateRaw || null;

    const data = await withTransaction(async (client) => {
      const matched = await client.query(
        `SELECT a.id, a.slot_id
         FROM appointments a
         WHERE a.parent_user_id = $1
           AND LOWER(TRIM(a.child_name)) = LOWER($2)
           AND COALESCE(a.child_birth_date::text, '') = COALESCE($3, '')`,
        [req.user!.id, childName, normalizedBirthDate]
      );

      if (!matched.rows.length) {
        return { deletedCount: 0 };
      }

      const appointmentIds = matched.rows.map((row: { id: number }) => row.id);
      const slotIds = matched.rows
        .map((row: { slot_id: number | null }) => row.slot_id)
        .filter((value): value is number => Number.isFinite(value));

      await client.query(
        `DELETE FROM appointments WHERE id = ANY($1::int[])`,
        [appointmentIds]
      );

      if (slotIds.length) {
        await client.query(
          `UPDATE specialist_slots
           SET is_booked = FALSE
           WHERE id = ANY($1::int[])
             AND starts_at > NOW()`,
          [slotIds]
        );
      }

      return { deletedCount: appointmentIds.length };
    });

    return res.json({
      success: true,
      data,
      message: data.deletedCount > 0 ? 'Записи ребенка удалены' : 'Записи ребенка не найдены',
    });
  } catch (error) {
    console.error('Ошибка deleteAppointmentsByChild:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const validateAppointmentDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toISODate(parsed);
};
