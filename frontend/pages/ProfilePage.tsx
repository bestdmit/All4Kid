import { useEffect, useState } from "react";
import AppHeader from "../src/Header/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router-dom';
import { Button, Flex, message, Card, Typography, Space, Spin, Form, Input, Avatar, Upload, Modal, Alert } from "antd";
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSpecialistStore, type Specialist } from "../stores/specialistStore";
import SpecialistCard from "../src/SpecialistCard";
import { specialistApi, type SpecialistDeletionNotice } from "../src/api/specialists";
import ProfileTabs from "../src/ProfileTabs";
import SpecialistSlotsManager from "../src/components/specialist/SpecialistSlotsManager";
import "./profilePage.css";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile, clearError, uploadAvatar, deleteAvatar } = useAuth();
  const { getSpecialistsById, updateNameForCreator, removeSpecialistById, fetchSpecialists } = useSpecialistStore();
  const [userSpecialists, setUserSpecialists] = useState<Specialist[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletionNotices, setDeletionNotices] = useState<SpecialistDeletionNotice[]>([]);
  const [acknowledgingNoticeId, setAcknowledgingNoticeId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!user) return;

    const bootstrapProfileData = async () => {
      await fetchSpecialists();
      const list = getSpecialistsById(user.id);
      setUserSpecialists(list);
      await loadDeletionNotices();
    };

    bootstrapProfileData();
  }, [user, fetchSpecialists, getSpecialistsById]);

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

      let reason: string | undefined;
      if (user?.role === 'admin') {
        reason = window.prompt('Укажите причину удаления объявления (минимум 5 символов):')?.trim();
        if (!reason || reason.length < 5) {
          message.error('Удаление отменено: нужна причина от 5 символов');
          return;
        }
      }

      await specialistApi.deleteById(id, accessToken, reason);
      removeSpecialistById(id);

      if (user) {
        const updated = getSpecialistsById(user.id);
        setUserSpecialists(updated);
      }

      message.success("Специалист удален");

      if (user?.role === 'admin') {
        await loadDeletionNotices();
      }
    } catch (error: any) {
      if (error?.message === 'UNAUTHORIZED') {
        message.error("Сессия истекла. Войдите заново");
        logout();
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      } else {
        message.error("Ошибка при удалении специалиста");
      }
    } finally {
      setDeleting(null);
    }
  };

  const loadDeletionNotices = async () => {
    try {
      if (!user) return;
      const notices = await specialistApi.getMyDeletionNotices();
      setDeletionNotices(notices);
    } catch (error: any) {
      if (error?.message !== 'UNAUTHORIZED') {
        console.error('Не удалось загрузить уведомления об удалении:', error);
      }
    }
  };

  const acknowledgeNotice = async (id: number) => {
    try {
      setAcknowledgingNoticeId(id);
      await specialistApi.acknowledgeDeletionNotice(id);
      setDeletionNotices((prev) => prev.filter((item) => item.id !== id));
      message.success('Уведомление отмечено как ознакомлен');
    } catch (error: any) {
      message.error(error?.message || 'Не удалось подтвердить уведомление');
    } finally {
      setAcknowledgingNoticeId(null);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const success = await uploadAvatar(file);
      if (success) {
        message.success('Аватар загружен');
      } else {
        message.error('Не удалось загрузить аватар');
      }
    } catch (err) {
      message.error('Ошибка при загрузке аватара');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = () => {
    Modal.confirm({
      title: 'Удалить аватар?',
      content: 'Вы уверены, что хотите удалить свой аватар?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          setUploadingAvatar(true);
          const success = await deleteAvatar();
          if (success) {
            message.success('Аватар удален');
          } else {
            message.error('Не удалось удалить аватар');
          }
        } catch (err) {
          message.error('Ошибка при удалении аватара');
        } finally {
          setUploadingAvatar(false);
        }
      }
    });
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
      <div className="profile-page-container">
        {deletionNotices.length > 0 && (
          <Card className="profile-card profile-notices-card">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0 }}>Уведомления администратора</Title>
              {deletionNotices.map((notice) => (
                <Alert
                  key={notice.id}
                  type="warning"
                  showIcon
                  message={`Объявление «${notice.name}» удалено администратором`}
                  description={
                    <div>
                      <div>Причина: {notice.deletion_reason}</div>
                      <Button
                        size="small"
                        style={{ marginTop: 8 }}
                        loading={acknowledgingNoticeId === notice.id}
                        onClick={() => acknowledgeNotice(notice.id)}
                      >
                        Ознакомлен
                      </Button>
                    </div>
                  }
                />
              ))}
            </Space>
          </Card>
        )}

        <Card className="profile-card profile-main-card">
          <Title level={2} className="profile-main-title">Профиль пользователя</Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Аватар и управление */}
            <div className="profile-user-header">
              <Avatar
                size={80}
                src={user.avatarUrl}
                alt={user.fullName}
                style={{ backgroundColor: '#1890ff' }}
              >
                {user.fullName?.[0]?.toUpperCase()}
              </Avatar>
              <div className="profile-user-info">
                <div className="profile-photo-controls">
                  <Text strong style={{ fontSize: 16 }}>Фото профиля</Text>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Upload
                    maxCount={1}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('Выберите изображение');
                        return false;
                      }
                      const isLt5M = file.size / 1024 / 1024 < 5;
                      if (!isLt5M) {
                        message.error('Размер файла не должен превышать 5MB');
                        return false;
                      }
                      handleUploadAvatar(file);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                      {user.avatarUrl ? 'Изменить' : 'Загрузить'}
                    </Button>
                  </Upload>
                  {user.avatarUrl && (
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      loading={uploadingAvatar}
                      onClick={handleDeleteAvatar}
                    >
                      Удалить
                    </Button>
                  )}
                  </div>
                </div>

                <div className="profile-fields">
                  {user.role === 'admin' && (
                    <div className="profile-field-row">
                      <Text strong className="profile-field-label">ID: </Text>
                      <Text className="profile-field-value">{user.id}</Text>
                    </div>
                  )}

                  <div className="profile-field-row">
                    <Text strong className="profile-field-label">Email: </Text>
                    <Text className="profile-field-value">{user.email}</Text>
                  </div>

                  <div className="profile-field-row">
                    <Text strong className="profile-field-label">Роль: </Text>
                    <Text className="profile-field-value">{user.role}</Text>
                  </div>
                </div>
              </div>
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

              <Flex gap="small" wrap className="profile-actions">
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

      <Card className="profile-card profile-tabs-card">
          <ProfileTabs user={user} updateProfile={updateProfile} />
        </Card>

        {userSpecialists.length > 0 && (
          <Card className="profile-card profile-specialists-card">
            <Title level={3}>Мои объявления ({userSpecialists.length})</Title>
            <div className="profile-specialists-grid">
              {userSpecialists.map((spec) => (
                <SpecialistCard 
                  key={spec.id}
                  specialist={spec} 
                  forDelete={true}
                  onDelete={handleDeleteSpecialist}
                  isLoading={deleting === spec.id}
                />
              ))}
            </div>
          </Card>
        )}

        {userSpecialists.length > 0 && (
          <Card className="profile-card profile-schedule-card">
            <Title level={3}>Управление расписанием</Title>
            <Text type="secondary">
              Добавляйте свободные интервалы для каждого объявления. Родители увидят их на странице специалиста.
            </Text>

            {userSpecialists.map((spec) => (
              <SpecialistSlotsManager key={`slots-${spec.id}`} specialist={spec} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}