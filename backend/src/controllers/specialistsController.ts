import { Request, Response } from 'express';
import { query } from '../database/db';
import { Specialist, CreateSpecialistDto } from '../models/specialist';

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

export const createSpecialist = async (req: Request, res: Response) => {
  try {
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
    }: CreateSpecialistDto = req.body;
    
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

    const result = await query(
      `INSERT INTO specialists 
       (name, specialty, category, description, experience, rating, location, price_per_hour, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        name.trim(), 
        specialty.trim(), 
        category || 'Другое',
        description || '',
        cleanExperience, 
        cleanRating, 
        location.trim(), 
        cleanPrice,
        avatar_url || '/avatars/default.jpg'
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

export const deleteSpecialist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM specialists WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Специалист не найден'
      });
    }
    
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