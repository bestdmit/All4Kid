import { Request, Response } from 'express';
import { query } from '../database/db';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const result = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при получении категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};