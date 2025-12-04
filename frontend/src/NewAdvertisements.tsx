import { useState } from 'react'
import React from "react";
import { Form, Input, InputNumber, Button, Card, message, Space, Typography, Select } from "antd";
import { useAuth } from '../hooks/useAuth';

export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  category: string;
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

const API_BASE_URL = 'http://localhost:5000/api';

export const createSpecialist = async (
  specialistData: CreateSpecialistDto,
  accessToken: string | null
): Promise<ApiResponse<Specialist>> => {
  try {
    console.log('📤 Отправляю данные на бэкенд:', specialistData);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Добавляем токен авторизации, если он есть
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      throw new Error('Требуется авторизация');
    }
    
    const response = await fetch(`${API_BASE_URL}/specialists`, {
      method: 'POST',
      headers,
      body: JSON.stringify(specialistData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Неавторизован. Пожалуйста, войдите в систему');
      }
      const errorText = await response.text();
      console.error('❌ Ошибка сервера:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Specialist> = await response.json();
    console.log('✅ Ответ от бэкенда:', result);

    return result;
  } catch (error) {
    console.error('❌ Ошибка при создании специалиста:', error);
    throw error;
  }
};

const { Title } = Typography;

export default function NewAdvertisements() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const {user, isAuthenticated, logout} = useAuth(); // Добавили logout для очистки невалидного токена
  
  const handleSubmit = async (values: CreateSpecialistDto) => {
    if (!isAuthenticated) {
      message.error('Для создания специалиста необходимо войти в систему');
      return;
    }
    
    setLoading(true);
    
    try {
      const dataToSend = {
        ...values,
        experience: values.experience || 0,
        rating: values.rating || 0,
        price_per_hour: values.price_per_hour || 0
      };
      
      console.log('📦 Отправляемые данные:', dataToSend);
      
      // Получаем токен из localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        message.error('Токен авторизации не найден. Пожалуйста, войдите заново');
        logout(); // Очищаем состояние
        return;
      }
      
      const result = await createSpecialist(dataToSend, accessToken);
      
      if (result.success) {
        message.success('Специалист успешно создан!');
        form.resetFields();
        form.setFieldsValue({
          name: user?.fullName || '',
          category: 'Другое',
          experience: 0,
          rating: 0,
          price_per_hour: 0
        });
      } else {
        message.error(result.message || 'Ошибка при создании специалиста');
      }
    } catch (error: any) {
      console.error('Ошибка при создании специалиста:', error);
      
      if (error.message.includes('401') || error.message.includes('Неавторизован')) {
        message.error('Сессия истекла. Пожалуйста, войдите заново');
        logout(); // Очищаем невалидную сессию
      } else {
        message.error(`Произошла ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      name: user?.fullName || '',
      category: 'Другое',
      experience: 0,
      rating: 0,
      price_per_hour: 0
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Добавить нового специалиста
        </Title>
        
        {!isAuthenticated && (
          <div style={{ 
            backgroundColor: '#fff7e6', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            border: '1px solid #ffd591'
          }}>
            <p style={{ margin: 0, color: '#d46b08' }}>
              ⚠️ Для создания специалиста необходимо войти в систему
            </p>
          </div>
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading || !isAuthenticated}
          size="large"
          initialValues={{
            name: user?.fullName || '',
            category: 'Другое',
            experience: 0,
            rating: 0,
            price_per_hour: 0
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>Основная информация</Title>
            
            <Form.Item
              label="Имя специалиста"
              name="name"
              rules={[
                { required: true, message: 'Пожалуйста, введите имя специалиста' },
                { min: 2, message: 'Имя должно содержать минимум 2 символа' }
              ]}
            >
              <Input 
                allowClear
                disabled={loading}
                placeholder="Имя будет автоматически заполнено из вашего профиля"
              />
            </Form.Item>

            <Form.Item
              label="Специальность"
              name="specialty"
              rules={[
                { required: true, message: 'Пожалуйста, введите специальность' },
                { min: 2, message: 'Специальность должна содержать минимум 2 символа' }
              ]}
            >
              <Input 
                placeholder="Например: Тренер, Бэйбиситтер, Аниматор ..." 
                allowClear
                disabled={loading || !isAuthenticated}
              />
            </Form.Item>

            <Form.Item
              label="Категория"
              name="category"
              rules={[
                { required: true, message: 'Пожалуйста, выберите категорию' }
              ]}
            >
              <Select 
                placeholder="Выберите категорию специалиста"
                allowClear
                disabled={loading || !isAuthenticated}
              >
                <Select.Option value="Врачи">Врачи</Select.Option>
                <Select.Option value="Образование">Образование</Select.Option>
                <Select.Option value="Спорт">Спорт</Select.Option>
                <Select.Option value="Развитие">Развитие</Select.Option>
                <Select.Option value="Творчество">Творчество</Select.Option>
                <Select.Option value="Уход">Уход</Select.Option>
                <Select.Option value="Другое">Другое</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Местоположение"
              name="location"
              rules={[
                { required: true, message: 'Пожалуйста, введите местоположение' },
                { min: 2, message: 'Местоположение должно содержать минимум 2 символа' }
              ]}
            >
              <Input 
                placeholder="Город или район оказания услуг" 
                allowClear
                disabled={loading || !isAuthenticated}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>Дополнительная информация</Title>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item
                label="Опыт работы (лет)"
                name="experience"
                rules={[
                  { type: 'number', min: 0, max: 50, message: 'Опыт должен быть от 0 до 50 лет' }
                ]}
              >
                <InputNumber 
                  min={0}
                  max={50}
                  placeholder="0"
                  style={{ width: '100%' }}
                  disabled={loading || !isAuthenticated}
                />
              </Form.Item>

              <Form.Item
                label="Рейтинг"
                name="rating"
                rules={[
                  { type: 'number', min: 0, max: 5, message: 'Рейтинг должен быть от 0 до 5' }
                ]}
              >
                <InputNumber 
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="0.0"
                  style={{ width: '100%' }}
                  disabled={loading || !isAuthenticated}
                />
              </Form.Item>

              <Form.Item
                label="Цена за час (₽)"
                name="price_per_hour"
                rules={[
                  { type: 'number', min: 0, message: 'Цена не может быть отрицательной' }
                ]}
              >
                <InputNumber 
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                  disabled={loading || !isAuthenticated}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item>
            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                style={{ minWidth: 120 }}
                disabled={!isAuthenticated}
              >
                {loading ? 'Создание...' : 'Создать'}
              </Button>
              
              <Button 
                htmlType="button" 
                onClick={handleReset}
                size="large"
                disabled={loading || !isAuthenticated}
              >
                Очистить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}