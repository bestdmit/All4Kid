import { useState } from 'react'
import React from "react";

// types.ts - типы для специалиста
export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  experience?: number;
  rating?: number;
  location: string;
  price_per_hour?: number;
}

export interface Specialist extends CreateSpecialistDto {
  id: number;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

// specialistsApi.ts - API функции
const API_BASE_URL = 'http://localhost:5000/api';

export const createSpecialist = async (
  specialistData: CreateSpecialistDto
): Promise<ApiResponse<Specialist>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/specialists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(specialistData),
    });

    const result: ApiResponse<Specialist> = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Ошибка при создании специалиста');
    }

    return result;
  } catch (error) {
    console.error('Ошибка при создании специалиста:', error);
    throw error;
  }
};

// Пример использования в компоненте React
export default function NewAdvertisements(){
  const [formData, setFormData] = useState<CreateSpecialistDto>({
    name: '',
    specialty: '',
    experience: 0,
    rating: 0,
    location: '',
    price_per_hour: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await createSpecialist(formData);
      
      if (result.success) {
        setMessage('Специалист успешно создан!');
        // Очистка формы или перенаправление
        setFormData({
          name: '',
          specialty: '',
          experience: 0,
          rating: 0,
          location: '',
          price_per_hour: 0,
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'specialty' || name === 'location' 
        ? value 
        : Number(value)
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Имя:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label>Специальность:</label>
        <input
          type="text"
          name="specialty"
          value={formData.specialty}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label>Местоположение:</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label>Опыт (лет):</label>
        <input
          type="number"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label>Рейтинг:</label>
        <input
          type="number"
          name="rating"
          step="0.1"
          value={formData.rating}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label>Цена за час:</label>
        <input
          type="number"
          name="price_per_hour"
          value={formData.price_per_hour}
          onChange={handleChange}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать специалиста'}
      </button>
      
      {message && <div>{message}</div>}
    </form>
  );
};