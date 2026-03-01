import React, { useEffect, useState } from "react";
import AppHeader from "../src/Header/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router-dom';
import { Button, message, Card, Typography, Space, Spin } from "antd";
import { useSpecialistStore, type Specialist } from "../stores/specialistStore";
import { useAuthStore } from "../stores/auth.store";
import ProfileTabs from "../src/ProfileTabs";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const updateProfile = useAuthStore(state => state.updateProfile);
  const { getSpecialistsById } = useSpecialistStore();
  const [userSpecialists, setUserSpecialists] = useState<Specialist[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null); // оставляем на будущее

  useEffect(() => {
    if (user?.fullName) {
      const specialists = getSpecialistsById(user.id);
      console.log(user.id,getSpecialistsById(user.id).length);
      setUserSpecialists(specialists);
    }
  }, [user, getSpecialistsById]);

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/auth" />;
  }

  const handleLogout = () => {
    logout();
    message.success("Вы успешно вышли из системы");
  };


  if (isLoading || !user) {
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
              <Text strong>Имя: </Text>
              <Text>{user.fullName}</Text>
            </div>
            
            <div>
              <Text strong>Email: </Text>
              <Text>{user.email}</Text>
            </div>
            
            <div>
              <Text strong>Телефон: </Text>
              <Text>{user.phone || 'Не указан'}</Text>
            </div>
            
            <div>
              <Text strong>Роль: </Text>
              <Text>{user.role}</Text>
            </div>
            {/* вкладки с разделами профиля идут ниже */}

            <Button type="primary" danger onClick={handleLogout}>
              Выйти
            </Button>
          </Space>
        </Card>

        <ProfileTabs
          user={user!}
          userSpecialists={userSpecialists}
          updateProfile={updateProfile}
        />
      </div>
    </>
  );
}

