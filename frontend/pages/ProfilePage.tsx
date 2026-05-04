import { useEffect, useState } from "react";
import AppHeader from "../src/Header/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router-dom';
import { Button, Flex, message, Card, Typography, Space, Spin, Form, Input, Avatar, Modal, Alert } from "antd";
import { DeleteOutlined } from '@ant-design/icons';
import { useSpecialistStore, type Specialist } from "../stores/specialistStore";
import SpecialistCard from "../src/SpecialistCard";
import { specialistApi, type SpecialistDeletionNotice } from "../src/api/specialists";
import ProfileTabs from "../src/ProfileTabs";
import SpecialistSlotsManager from "../src/components/specialist/SpecialistSlotsManager";
import "./profilePage.css";
import ImageUpload from "../src/components/ImageUpload";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile, clearError, uploadAvatar, deleteAvatar } = useAuth();
  const { getSpecialistsById, updateNameForCreator, removeSpecialistById, fetchSpecialists } = useSpecialistStore();
  const [userSpecialists, setUserSpecialists] = useState<Specialist[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [specSaving, setSpecSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletionNotices, setDeletionNotices] = useState<SpecialistDeletionNotice[]>([]);
  const [acknowledgingNoticeId, setAcknowledgingNoticeId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form] = Form.useForm();
  const [editSpecModalVisible, setEditSpecModalVisible] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [specAvatarFile, setSpecAvatarFile] = useState<File | null>(null);
  const [specForm] = Form.useForm<{
    name: string;
    specialty: string;
    category: string;
    experience: number;
    location: string;
    price_per_hour: number;
    description?: string;
  }>();
  const { updateSpecialistInStore } = useSpecialistStore();

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

  const roleLabel =
    user?.role === "admin"
      ? "Администратор"
      : user?.role === "specialist"
        ? "Специалист"
        : user?.role === "user"
          ? "Пользователь"
          : (user?.role ?? "");

  const handleLogout = () => {
    logout();
    message.success("Вы успешно вышли из системы");
  };

  const handleEditSpecialist = (spec: Specialist) => {
    setEditingSpecialist(spec);
    setSpecAvatarFile(null);
    specForm.setFieldsValue({
      name: spec.name,
      specialty: spec.specialty,
      category: spec.category,
      experience: spec.experience,
      location: spec.location,
      price_per_hour: spec.price_per_hour,
      description: spec.description,
    });
    setEditSpecModalVisible(true);
  };

  const handleSpecAvatarUpload = (file: File) => {
    setSpecAvatarFile(file);
  };

  const handleDeleteSpecialistAvatar = () => {
    if (!editingSpecialist) return;

    Modal.confirm({
      title: 'Удалить фото объявления?',
      content: 'Фото будет сброшено на стандартное. Продолжить?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          setSpecSaving(true);
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            message.error("Сессия истекла");
            logout();
            return;
          }

          const updated = await specialistApi.deleteAvatar(editingSpecialist.id, accessToken);
          updateSpecialistInStore(updated);
          setUserSpecialists((prev) => prev.map(s => s.id === updated.id ? updated : s));
          setEditingSpecialist(updated);
          setSpecAvatarFile(null);
          message.success('Фото удалено');
        } catch (error: unknown) {
          const err = error instanceof Error ? error : null;
          if (err?.message === 'UNAUTHORIZED') {
            message.error("Сессия истекла");
            logout();
            return;
          }
          message.error(err?.message || 'Не удалось удалить фото');
        } finally {
          setSpecSaving(false);
        }
      }
    });
  };

  const handleUpdateSpecialist = async (values: {
    name: string;
    specialty: string;
    category: string;
    experience: number;
    location: string;
    price_per_hour: number;
    description?: string;
  }) => {
    if (!editingSpecialist) return;

    try {
      setSpecSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error("Сессия истекла");
        logout();
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("specialty", values.specialty);
      formData.append("category", values.category || "Другое");
      formData.append("experience", String(values.experience));
      formData.append("location", values.location);
      formData.append("price_per_hour", String(values.price_per_hour));
      if (values.description) {
        formData.append("description", values.description);
      }
      if (specAvatarFile) {
        formData.append("avatar", specAvatarFile);
      }

      const updated = await specialistApi.update(editingSpecialist.id, formData, accessToken);
      updateSpecialistInStore(updated);
      setUserSpecialists((prev) => prev.map(s => s.id === updated.id ? updated : s));

      message.success("Объявление обновлено");
      setEditSpecModalVisible(false);
      setEditingSpecialist(null);
      setSpecAvatarFile(null);
      specForm.resetFields();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      message.error(err?.message || "Ошибка при обновлении объявления");
    } finally {
      setSpecSaving(false);
    }
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      if (err?.message === 'UNAUTHORIZED') {
        message.error("Сессия истекла. Войдите заново");
        logout();
      } else if (err?.message) {
        message.error(err.message);
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      if (err?.message !== 'UNAUTHORIZED') {
        console.error('Не удалось загрузить уведомления об удалении:', err ?? error);
      }
    }
  };

  const acknowledgeNotice = async (id: number) => {
    try {
      setAcknowledgingNoticeId(id);
      await specialistApi.acknowledgeDeletionNotice(id);
      setDeletionNotices((prev) => prev.filter((item) => item.id !== id));
      message.success('Уведомление отмечено как ознакомлен');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      message.error(err?.message || 'Не удалось подтвердить уведомление');
    } finally {
      setAcknowledgingNoticeId(null);
    }
  };

  const handleAvatarUpload = (file: File) => {
    setAvatarFile(file);
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
        } catch {
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
                <div className="profile-photo-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: 16 }}>{user.fullName}</Text>
                  <Text type="secondary">{user.email}</Text>
                  <Text type="secondary" style={{ marginTop: 2 }}>
                    {roleLabel}
                  </Text>
                </div>

                <div className="profile-fields">
                  {user.role === 'admin' && (
                    <div className="profile-field-row">
                      <Text strong className="profile-field-label">ID: </Text>
                      <Text className="profile-field-value">{user.id}</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Space>
              <Button type="primary" onClick={() => setIsModalVisible(true)}>
                Редактировать профиль
              </Button>
              <Button danger onClick={handleLogout}>
                Выйти
              </Button>
            </Space>
          </Space>
        </Card>

        <Modal
          title="Редактировать профиль"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setAvatarFile(null);
          }}
          destroyOnClose
          footer={null}
        >
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
                  if (avatarFile) {
                    await uploadAvatar(avatarFile);
                  }
                  message.success('Профиль обновлен');
                  setIsModalVisible(false);
                } else {
                  message.error('Не удалось обновить профиль');
                }
              } catch {
                message.error('Ошибка при обновлении профиля');
              } finally {
                setSaving(false);
                setAvatarFile(null);
              }
            }}
          >
            <Flex justify="center" align="center" vertical style={{ marginBottom: "1rem" }}>
              <ImageUpload 
                onImageUpload={handleAvatarUpload} 
                initialImage={user.avatarUrl} 
                file={avatarFile} 
              />
              {(user.avatarUrl || avatarFile) && (
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    if (avatarFile) {
                      setAvatarFile(null); // отменяем локально выбранный файл
                    } else {
                      handleDeleteAvatar(); // удаляем с сервера
                    }
                  }}
                  style={{ marginTop: "0.5rem" }}
                  danger
                  loading={uploadingAvatar}
                >
                  {avatarFile ? 'Отменить выбор' : 'Удалить аватар'}
                </Button>
              )}
            </Flex>

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
            </Flex>
          </Form>
        </Modal>

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
                  onEdit={user.role === 'specialist' ? handleEditSpecialist : undefined}
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

        <Modal
          title="Редактировать объявление"
          open={editSpecModalVisible}
          onCancel={() => {
            setEditSpecModalVisible(false);
            setEditingSpecialist(null);
            setSpecAvatarFile(null);
          }}
          footer={null}
          destroyOnClose
        >
          {editingSpecialist && (
            <Form
              form={specForm}
              layout="vertical"
              onFinish={handleUpdateSpecialist}
            >
              <Flex justify="center" align="center" vertical style={{ marginBottom: "1rem" }}>
                <ImageUpload
                  onImageUpload={handleSpecAvatarUpload}
                  initialImage={editingSpecialist.avatar_url}
                  file={specAvatarFile}
                />
                {(specAvatarFile || (editingSpecialist.avatar_url && !editingSpecialist.avatar_url.includes("default.jpg"))) && (
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      if (specAvatarFile) {
                        setSpecAvatarFile(null);
                      } else {
                        handleDeleteSpecialistAvatar();
                      }
                    }}
                    style={{ marginTop: "0.5rem" }}
                    danger
                    loading={specSaving}
                  >
                    {specAvatarFile ? 'Отменить выбор фото' : 'Удалить фото'}
                  </Button>
                )}
              </Flex>

              <Form.Item name="name" label="ФИО специалиста" rules={[{ required: true }]}>
                <Input placeholder="Например: Иванов Иван Иванович" />
              </Form.Item>

              <Form.Item name="specialty" label="Специальность" rules={[{ required: true }]}>
                <Input placeholder="Например: Логопед-дефектолог" />
              </Form.Item>

              <Form.Item name="category" label="Категория" rules={[{ required: true }]}>
                <Input placeholder="Например: Врачи" />
              </Form.Item>

              <Form.Item name="experience" label="Опыт работы (лет)" rules={[{ required: true }]}>
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item name="location" label="Место приема" rules={[{ required: true }]}>
                <Input placeholder="Адрес кабинета или 'Онлайн'" />
              </Form.Item>

              <Form.Item name="price_per_hour" label="Стоимость занятия (₽/час)" rules={[{ required: true }]}>
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item name="description" label="О себе">
                <Input.TextArea rows={4} placeholder="Опишите свои навыки и методы работы..." />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={specSaving} block>
                  Сохранить изменения
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
        
      </div>
    </>
  );
}