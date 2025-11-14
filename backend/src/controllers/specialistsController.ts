import { Request, Response } from 'express';
import { query } from '../database/db';
import { Specialist, CreateSpecialistDto } from '../models/specialist';

export const getAllSpecialists = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM specialists ORDER BY id DESC');
    
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
