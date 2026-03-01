import React, { useEffect, useState } from "react";
import AppHeader from "../src/Header/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router-dom';
import { Button, Flex, message, Card, Typography, Space, Spin, Input } from "antd";
import { useSpecialistStore, type Specialist } from "../stores/specialistStore";
import SpecialistCard from "../src/SpecialistCard";
import { useAuthStore } from "../stores/auth.store";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const updateProfile = useAuthStore(state => state.updateProfile);
  const { getSpecialistsById} = useSpecialistStore();
  const [userSpecialists, setUserSpecialists] = useState<Specialist[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [childName, setChildName] = useState('');
  const [childBirth, setChildBirth] = useState('');
  const [adding, setAdding] = useState(false);

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

  const handleDeleteSpecialist = async (id: number) => {
    try {
      setDeleting(id);
      // Здесь будет реальный вызов API
      await deleteSpecialist(id);
      message.success("Специалист удален");
      
      if (user?.fullName) {
        
        const specialists = getSpecialistsById(user.id);
        setUserSpecialists(specialists);
      }
    } catch (error) {
      message.error("Ошибка при удалении специалиста");
    } finally {
      setDeleting(null);
    }
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
            <div>
              <Text strong>Дети: </Text>
              <div style={{ marginTop: 8 }}>
                {(user.children && user.children.length > 0) ? (
                  <Space direction="vertical">
                    {user.children.map((c: any, idx: number) => (
                      <div key={idx}>
                        <Text>{c.name}</Text>
                        <Text style={{ marginLeft: 8, color: '#888' }}>{c.birthDate ? ` — ${c.birthDate}` : ''}</Text>
                      </div>
                    ))}
                  </Space>
                ) : (
                  <Text>Не добавлены</Text>
                )}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <Input placeholder="Имя ребенка" value={childName} onChange={e => setChildName(e.target.value)} style={{ width: 240, marginRight: 8 }} />
              <Input type="date" value={childBirth} onChange={e => setChildBirth(e.target.value)} style={{ width: 180, marginRight: 8 }} />
              <Button type="primary" onClick={async () => {
                if (!childName.trim()) { message.error('Введите имя ребенка'); return; }
                try {
                  setAdding(true);
                  const newChildren = [ ...(user.children || []), { name: childName.trim(), birthDate: childBirth || null } ];
                  await updateProfile({ children: newChildren });
                  message.success('Ребенок добавлен');
                  setChildName(''); setChildBirth('');
                } catch (err) {
                  console.error(err);
                  message.error('Ошибка при добавлении');
                } finally { setAdding(false); }
              }} loading={adding}>Добавить</Button>
            </div>

            <Button type="primary" danger onClick={handleLogout}>
              Выйти
            </Button>
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

// Временные функции-заглушки (нужно будет заменить на реальные API вызовы)
async function deleteSpecialist(id: number) {
  // Здесь должен быть реальный API вызов
  console.log(`Удаление специалиста с ID: ${id}`);
  throw new Error("API для удаления еще не реализован");
}