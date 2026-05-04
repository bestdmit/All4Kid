import {useEffect, useState} from 'react'
import {Form, Input, InputNumber, Button, Card, message, Space, Typography, Select, Divider} from "antd";
import {type Category, useCategories} from "../hooks/useCategories.ts";
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth.store';
import ImageUpload from './components/ImageUpload';

export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  category: string;
  experience?: number;
  location: string;
  price_per_hour?: number;
  avatar?: File;
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

const API_BASE_URL = '/api';

const sanitizeText = (value?: string) =>
  value ? value.replace(/[<>]/g, '').trim() : '';

export const createSpecialist = async (
  specialistData: CreateSpecialistDto,
  accessToken: string | null
): Promise<ApiResponse<Specialist>> => {
  try {
    console.log('📤 Отправляю данные на бэкенд:', specialistData);

    const formData = new FormData();
    Object.entries(specialistData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'avatar' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'avatar') {
          formData.append(key, String(value));
        }
      }
    });
    
    const headers: Record<string, string> = {};
    
    // Добавляем токен авторизации, если он есть
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      throw new Error('Требуется авторизация');
    }
    
    const response = await fetch(`${API_BASE_URL}/specialists`, {
      method: 'POST',
      headers,
      body: formData,
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
  const { error, loading: categoriesLoading, categories } = useCategories();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if(error) message.error(error);
  }, [error]);

  const {user, isAuthenticated, logout} = useAuth(); // Добавили logout для очистки невалидного токена
  
  const handleImageUpload = (file: File) => {
    setAvatarFile(file);
  };

  const handleSubmit = async (values: CreateSpecialistDto) => {
  if (!isAuthenticated || loading) {
    message.error('Необходимо войти в систему');
    return;
  }

  setLoading(true);

  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      message.error('Сессия истекла. Войдите заново');
      logout(); // Очищаем состояние, если токен невалиден
      setLoading(false);
      return;
    }

    const specialistDataWithAvatar: CreateSpecialistDto = {
      ...values,
      avatar: avatarFile || undefined,
    };

    const result = await createSpecialist(specialistDataWithAvatar, accessToken);

    if (result.success) {
      message.success('Специалист успешно создан!');
      
      // Обновляем роль пользователя на specialist если он был user
      if (user && user.role === 'user') {
        const setUser = useAuthStore.getState().setUser;
        const updatedUser = { ...user, role: 'specialist' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      form.resetFields();
      setAvatarFile(null); // Сброс файла после успешной загрузки
      // Возможно, стоит очистить и превью в ImageUpload, если это необходимо
    }
  } catch (error: any) {
    if (
      error.message?.includes('401') ||
      error.message?.includes('UNAUTHORIZED')
    ) {
      message.error('Сессия истекла. Войдите заново');
      logout();
    } else {
      message.error('Ошибка при создании специалиста');
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
      price_per_hour: 0
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>Создать новое объявление</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ remember: true }}
        >
          <Form.Item
            label="Имя"
            name="name"
            rules={[{ required: true, message: 'Пожалуйста, введите имя!' }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Специальность"
            name="specialty"
            rules={[{ required: true, message: 'Пожалуйста, введите специальность!' }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Категория"
            name="category"
            rules={[{ required: true, message: 'Пожалуйста, выберите категорию!' }]}>
            <Select loading={categoriesLoading} placeholder="Выберите категорию">
              {categories.map((category: Category) => (
                <Select.Option key={category.id} value={category.name}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Опыт работы (лет)"
            name="experience"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Местоположение"
            name="location"
            rules={[{ required: true, message: 'Пожалуйста, введите местоположение!' }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Цена за час"
            name="price_per_hour"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Фото специалиста">
            <ImageUpload 
              onImageUpload={handleImageUpload} 
              file={avatarFile} 
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Создать
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}