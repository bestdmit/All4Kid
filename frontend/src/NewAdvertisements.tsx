import { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Button, Card, message, Space, Typography, Select, Divider } from "antd";
import { type Category, useCategories } from "../hooks/useCategories.ts";
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth.store';
import ImageUpload from './components/ImageUpload';

export interface CreateSpecialistDto {
  name: string;
  specialty: string;
  category: string;
  description: string;
  education: string;
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
    if (error) message.error(error);
  }, [error]);

  const { user, isAuthenticated, logout } = useAuth(); // Добавили logout для очистки невалидного токена
  
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
        logout();
        setLoading(false);
        return;
      }

      const dataToSend: CreateSpecialistDto = {
        name: sanitizeText(values.name),
        specialty: sanitizeText(values.specialty),
        category: values.category,
        description: sanitizeText(values.description),
        education: sanitizeText(values.education),
        location: sanitizeText(values.location),
        experience: values.experience ?? 0,
        price_per_hour: values.price_per_hour ?? 0,
        avatar: avatarFile || undefined,
      };

      const result = await createSpecialist(dataToSend, accessToken);

      if (result.success) {
        message.success(result.message || 'Объявление отправлено на проверку администратором');
        form.resetFields();
        setAvatarFile(null);
      } else {
        message.error('Ошибка при создании специалиста');
      }

      if (user && user.role === 'user') {
        const setUser = useAuthStore.getState().setUser;
        const updatedUser = { ...user, role: 'specialist' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      form.resetFields();
      setAvatarFile(null);
      form.setFieldsValue({
        name: user?.fullName || '',
        category: 'Другое',
        description: '',
        education: '',
        experience: 0,
        price_per_hour: 0,
      });

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
      description: '',
      education: '',
      experience: 0,
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
            description: '',
            education: '',
            experience: 0,
            price_per_hour: 0
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <Divider style={{ fontSize: '20px', fontWeight: 'initial', borderColor: '#a6a4a4' }}>Основная информация</Divider>

            <Form.Item
              label="Имя специалиста"
              name="name"
              rules={[
                { required: true, message: 'Пожалуйста, введите имя специалиста' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.trim().length < 2) {
                      return Promise.reject(new Error('Имя должно содержать минимум 2 символа'));
                    }
                    if (value.trim().length > 50) {
                      return Promise.reject(new Error('Имя слишком длинное (максимум 50 символов)'));
                    }
                    if (/[^a-zA-Zа-яА-ЯёЁ\s-]/.test(value)) {
                      return Promise.reject(new Error('Имя может содержать только буквы, пробелы и дефисы'));
                    }
                    if (/[-]{2,}/.test(value)) {
                      return Promise.reject(new Error('Имя не может содержать несколько дефисов подряд'));
                    }
                    if (/^\s*-|-$|^\s+/.test(value)) {
                      return Promise.reject(new Error('Имя не должно начинаться или заканчиваться дефисом'));
                    }
                    return Promise.resolve();
                  }
                }
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
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.trim().length < 2) {
                      return Promise.reject(new Error('Специальность должна содержать минимум 2 символа'));
                    }
                    if (value.trim().length > 100) {
                      return Promise.reject(new Error('Специальность слишком длинная (максимум 100 символов)'));
                    }
                    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(value)) {
                      return Promise.reject(new Error('Специальность должна содержать хотя бы одну букву'));
                    }
                    if (/(.)\1{4,}/.test(value)) {
                      return Promise.reject(new Error('Избегайте слишком длинных повторяющихся символов'));
                    }
                    return Promise.resolve();
                  }
                }
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
                loading={categoriesLoading}
                allowClear
                disabled={loading || !isAuthenticated}
              >
                {categories.map((item: Category) => (
                  <Select.Option key={item.name} value={item.name}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Местоположение"
              name="location"
              rules={[
                { required: true, message: 'Пожалуйста, введите местоположение' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.trim().length < 2) {
                      return Promise.reject(new Error('Местоположение должно содержать минимум 2 символа'));
                    }
                    if (value.trim().length > 100) {
                      return Promise.reject(new Error('Слишком длинное название (максимум 100 символов)'));
                    }
                    if (/[^a-zA-Zа-яА-ЯёЁ0-9\s.,-]/.test(value)) {
                      return Promise.reject(new Error('Допустимы только буквы, цифры, пробелы и знаки (.,-)'));
                    }
                    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(value)) {
                      return Promise.reject(new Error('Местоположение должно содержать хотя бы одну букву'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                placeholder="Город или район оказания услуг"
                allowClear
                disabled={loading || !isAuthenticated}
              />
            </Form.Item>

            <Form.Item
              label="О специалисте"
              name="description"
              rules={[
                { required: true, message: 'Пожалуйста, заполните информацию о специалисте' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.trim().length < 10) {
                      return Promise.reject(new Error('Минимум 10 символов'));
                    }
                    if (value.trim().length > 2000) {
                      return Promise.reject(new Error('Максимум 2000 символов'));
                    }
                    const words = value.trim().split(/\s+/);
                    if (words.length < 5) {
                      return Promise.reject(new Error('Описание слишком короткое, напишите хотя бы 5 слов'));
                    }
                    if (/(.)\1{5,}/.test(value)) {
                      return Promise.reject(new Error('Описание содержит недопустимое количество повторяющихся символов'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.TextArea
                placeholder="Расскажите о методике, с кем работаете и какой результат даёте детям"
                autoSize={{ minRows: 3, maxRows: 6 }}
                showCount
                maxLength={2000}
                disabled={loading || !isAuthenticated}
              />
            </Form.Item>

            <Form.Item
              label="Образование"
              name="education"
              rules={[
                { required: true, message: 'Пожалуйста, укажите образование' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.trim().length < 5) {
                      return Promise.reject(new Error('Минимум 5 символов'));
                    }
                    if (value.trim().length > 1000) {
                      return Promise.reject(new Error('Максимум 1000 символов'));
                    }
                    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(value)) {
                      return Promise.reject(new Error('Укажите корректное название учебного заведения'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.TextArea
                placeholder="Например: МПГУ, педагогическое образование, 2018"
                autoSize={{ minRows: 2, maxRows: 4 }}
                showCount
                maxLength={1000}
                disabled={loading || !isAuthenticated}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Divider style={{ fontSize: '20px', fontWeight: 'initial', borderColor: '#a6a4a4' }}>Дополнительная информация</Divider>

            <Space align={'center'} style={{ justifyContent: 'center' }}>
              <Space align={'center'} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, width: '100%' }}>
                <Form.Item
                  label="Опыт работы (лет)"
                  name="experience"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value === undefined || value === null) return Promise.resolve();
                        if (typeof value !== 'number') {
                          return Promise.reject(new Error('Опыт должен быть числом'));
                        }
                        if (value < 0 || value > 50) {
                          return Promise.reject(new Error('Опыт должен быть от 0 до 50 лет'));
                        }
                        if (!Number.isInteger(value)) {
                          return Promise.reject(new Error('Опыт должен быть целым числом'));
                        }
                        return Promise.resolve();
                      }
                    }
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
                  label="Цена за час (₽)"
                  name="price_per_hour"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value === undefined || value === null) return Promise.resolve();
                        if (typeof value !== 'number') {
                          return Promise.reject(new Error('Цена должна быть числом'));
                        }
                        if (value < 0) {
                          return Promise.reject(new Error('Цена не может быть отрицательной'));
                        }
                        if (value > 1000000) {
                          return Promise.reject(new Error('Укажите более реалистичную цену (до 1 000 000)'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ width: '100%' }}
                    disabled={loading || !isAuthenticated}
                  />
                </Form.Item>
              </Space>
            </Space>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Divider style={{ fontSize: '20px', fontWeight: 'initial', borderColor: '#a6a4a4' }}>
              Фото
            </Divider>

            <Form.Item label="Фото специалиста">
              <ImageUpload onImageUpload={handleImageUpload} file={avatarFile} />
            </Form.Item>
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