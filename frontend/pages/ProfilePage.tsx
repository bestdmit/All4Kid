import React, { useEffect, useState } from "react";
import AppHeader from "../src/Header/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router-dom';
import { Button, Flex, message, Card, Typography, Space, Spin, Form, Input } from "antd";
import { useSpecialistStore, type Specialist } from "../stores/specialistStore";
import SpecialistCard from "../src/SpecialistCard";
import { specialistApi } from "../src/api/specialists";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile, clearError } = useAuth();
  const { specialists, getSpecialistsById, updateNameForCreator, removeSpecialistById } = useSpecialistStore();
  const [userSpecialists, setUserSpecialists] = useState<Specialist[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      const list = getSpecialistsById(user.id);
      setUserSpecialists(list);
    }
  }, [user, specialists, getSpecialistsById]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const isInitialLoading = isLoading && !user;

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/auth" />;
  }

  const handleLogout = () => {
    logout();
    message.success("Вы успешно вышли из системы");
  };

  const handleDeleteSpecialist = async (id: number) => {
    try {
      setDeleting(id);
      
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error("Сессия истекла. Войдите заново");
        logout();
        return;
      }

      await specialistApi.deleteById(id, accessToken);
      removeSpecialistById(id);

      if (user) {
        const updated = getSpecialistsById(user.id);
        setUserSpecialists(updated);
      }

      message.success("Специалист удален");
    } catch (error) {
      message.error("Ошибка при удалении специалиста");
    } finally {
      setDeleting(null);
    }
  };

  if (isInitialLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Card style={{ marginBottom: '24px' }}>
          <Title level={2}>Профиль пользователя</Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>ID: </Text>
              <Text>{user.id}</Text>
            </div>
            
            <div>
              <Text strong>Email: </Text>
              <Text>{user.email}</Text>
            </div>

            <div>
              <Text strong>Роль: </Text>
              <Text>{user.role}</Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={async (values) => {
                try {
                  setSaving(true);
                  clearError();
                  const success = await updateProfile(values);

                  if (success) {
                    updateNameForCreator(user.id, values.fullName);
                    message.success('Профиль обновлен');
                  } else {
                    message.error('Не удалось обновить профиль');
                  }
                } catch (err) {
                  message.error('Ошибка при обновлении профиля');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Form.Item
                name="fullName"
                label="Имя"
                rules={[
                  { required: true, message: 'Введите имя' },
                  {
                    pattern: /^[а-яА-ЯёЁ\- ]+$/,
                    message: 'Допустима только кириллица, пробел и дефис',
                  },
                  { min: 2, message: 'Минимум 2 символа' },
                  { max: 50, message: 'Максимум 50 символов' },
                ]}
              >
                <Input placeholder="Ваше имя" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Телефон"
                rules={[
                  {
                    pattern: /^[\d\s\-+()]{10,15}$/,
                    message: 'Укажите телефон в формате 10-15 символов',
                  },
                ]}
              >
                <Input placeholder="Например, +7 999 123-45-67" />
              </Form.Item>

              <Flex gap="small" wrap>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Сохранить
                </Button>
                <Button danger onClick={handleLogout}>
                  Выйти
                </Button>
              </Flex>
            </Form>
          </Space>
        </Card>

        {userSpecialists.length > 0 && (
          <Card>
            <Title level={3}>Мои объявления ({userSpecialists.length})</Title>
            <Flex wrap gap="middle" justify="start">
              {userSpecialists.map((spec) => (
                <SpecialistCard 
                  key={spec.id}
                  specialist={spec} 
                  forDelete={true}
                  onDelete={handleDeleteSpecialist}
                  isLoading={deleting === spec.id}
                />
              ))}
            </Flex>
          </Card>
        )}
      </div>
    </>
  );
}