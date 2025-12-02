import { Request, Response } from 'express';
import { query } from '../database/db';
import { Specialist, CreateSpecialistDto } from '../models/specialist';
import { AuthRequest } from '../middleware/auth'; 
import path from 'path';
import fs from 'fs/promises';

export const getAllSpecialists = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    
    let sql = 'SELECT * FROM specialists';
    const params: any[] = [];
    let conditions: string[] = [];
    
    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR specialty ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
  
    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY id DESC';
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Ошибка при получении специалистов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};


export const getSpecialistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM specialists WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при получении специалиста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

export const createSpecialist = async (req: AuthRequest, res: Response) => {
  try {

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для создания специалиста'
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
      price_per_hour 
    } = req.body;
    
    // Получаем загруженный файл
    const avatarFile = req.file;
    
    // Валидация обязательных полей
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Поле "Имя" обязательно для заполнения'
      });
    }

    if (!specialty?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Поле "Специальность" обязательно для заполнения'
      });
    }
    
    if (!location?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Поле "Местоположение" обязательно для заполнения'
      });
    }
    
    // Безопасное преобразование числовых полей
    const cleanExperience = experience !== undefined && experience !== null 
      ? Math.max(0, parseInt(String(experience)) || 0)
      : 0;
    
    const cleanRating = rating !== undefined && rating !== null
      ? Math.max(0, Math.min(5, parseFloat(String(rating)) || 0))
      : 0;
    
    const cleanPrice = price_per_hour !== undefined && price_per_hour !== null
      ? Math.max(0, parseInt(String(price_per_hour)) || 0)
      : 0;

    
    let avatarUrl = '/uploads/avatars/default.jpg';
    if (avatarFile) {
      avatarUrl = `/uploads/avatars/${avatarFile.filename}`;
    }

    const result = await query(
      `INSERT INTO specialists 
       (name, specialty, category, description, experience, rating, location, price_per_hour, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        name.trim(), 
        specialty.trim() || '', 
        category || 'Другое',
        description || '',
        cleanExperience, 
        cleanRating, 
        location.trim() || '', 
        cleanPrice,
        avatarUrl
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Специалист создан успешно'
    });
  } catch (error) {
    console.error('Ошибка при создании специалиста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании специалиста'
    });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const avatarFile = req.file;
    
    if (!avatarFile) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }
    
    // Получаем текущую аватарку
    const currentResult = await query('SELECT avatar_url FROM specialists WHERE id = $1', [id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
    const currentAvatar = currentResult.rows[0].avatar_url;
    
    // Удаляем старый файл, если это не дефолтная аватарка
    if (currentAvatar && !currentAvatar.includes('default.jpg')) {
      try {
        const filePath = path.join('public', currentAvatar);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Не удалось удалить старый файл:', error);
      }
    }
    
    // Обновляем запись в базе
    const avatarUrl = `/uploads/avatars/${avatarFile.filename}`;
    const result = await query(
      'UPDATE specialists SET avatar_url = $1 WHERE id = $2 RETURNING *',
      [avatarUrl, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Аватар обновлен успешно'
    });
  } catch (error) {
    console.error('Ошибка при обновлении аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};


export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Получаем текущую аватарку
    const currentResult = await query('SELECT avatar_url FROM specialists WHERE id = $1', [id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
    const currentAvatar = currentResult.rows[0].avatar_url;
    
    // Удаляем файл, если это не дефолтная аватарка
    if (currentAvatar && !currentAvatar.includes('default.jpg')) {
      try {
        const filePath = path.join('public', currentAvatar);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Не удалось удалить файл:', error);
      }
    }
    
    // Устанавливаем дефолтную аватарку
    const defaultAvatar = '/uploads/avatars/default.jpg';
    const result = await query(
      'UPDATE specialists SET avatar_url = $1 WHERE id = $2 RETURNING *',
      [defaultAvatar, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Аватар удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

export const updateSpecialist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      specialty, 
      category, 
      description, 
      experience, 
      rating, 
      location, 
      price_per_hour,
      avatar_url 
    } = req.body;
    
    const result = await query(
      `UPDATE specialists 
       SET name = $1, 
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
        name, 
        specialty, 
        category, 
        description, 
        experience, 
        rating, 
        location, 
        price_per_hour,
        avatar_url,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Специалист обновлен успешно'
    });
  } catch (error) {
    console.error('Ошибка при обновлении специалиста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

export const deleteSpecialist = async (req: AuthRequest, res: Response) => {
  try {
    // Проверяем права доступа
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для удаления специалиста'
      });
    }
    const { id } = req.params;
    
    // Получаем специалиста перед удалением
    const specialistResult = await query('SELECT * FROM specialists WHERE id = $1', [id]);
    
    if (specialistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
    const specialist = specialistResult.rows[0];
    
    // Удаляем файл аватарки, если это не дефолтная
    if (specialist.avatar_url && !specialist.avatar_url.includes('default.jpg')) {
      try {
        const filePath = path.join('public', specialist.avatar_url);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Не удалось удалить файл аватарки:', error);
      }
    }
    
    // Удаляем запись из базы
    await query('DELETE FROM specialists WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Специалист удален успешно'
    });
  } catch (error) {
    console.error('Ошибка при удалении специалиста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Получение специалистов текущего пользователя
export const getMySpecialists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }
    
    const result = await query(
      'SELECT * FROM specialists WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Ошибка при получении специалистов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};