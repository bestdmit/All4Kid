import React, { useState, useEffect } from "react";
import { Card, Flex, Button, message } from "antd";
import SearchBar from "./SearchBar";

const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка всех специалистов
  const fetchAllSpecialists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/specialists');
      const result = await response.json();
      
      if (result.success) {
        setSpecialists(result.data);
      }
    } catch (err) {
      message.error('Ошибка загрузки специалистов');
    } finally {
      setLoading(false);
    }
  };

  // Поиск специалистов
  const handleSearch = async (search: string) => {
    try {
      setLoading(true);
      setSearchTerm(search);
      
      const url = search 
        ? `/api/specialists?search=${encodeURIComponent(search)}`
        : '/api/specialists';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setSpecialists(result.data);
      }
    } catch (err) {
      message.error('Ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при первом открытии
  useEffect(() => {
    fetchAllSpecialists();
  }, []);

  return (
    <Flex align={"center"} justify={"center"} vertical>
      <SearchBar 
        onSearch={handleSearch}
        loading={loading}
      />
      
      {searchTerm && (
        <Button 
          onClick={() => {
            setSearchTerm('');
            fetchAllSpecialists();
          }}
          style={{ marginBottom: 20 }}
        >
          Сбросить поиск
        </Button>
      )}
      
      {loading ? (
        <div style={{ color: 'white' }}>Загрузка...</div>
      ) : specialists.length === 0 ? (
        <div style={{ color: 'white' }}>
          {searchTerm ? 'Ничего не найдено' : 'Нет специалистов'}
        </div>
      ) : (
        <Flex wrap gap={'middle'} justify={"center"}>
          {specialists.map((item) => (
            <Card key={item.id} title={item.name} style={cardStyle}>
              <p><strong>Специальность:</strong> {item.specialty}</p>
              <p><strong>Категория:</strong> {item.category || 'Другое'}</p>
              <p><strong>Опыт:</strong> {item.experience} лет</p>
              <p><strong>Рейтинг:</strong> ⭐ {item.rating}</p>
              <p><strong>Местоположение:</strong> {item.location}</p>
              <p><strong>Цена:</strong> {item.price_per_hour} ₽/час</p>
            </Card>
          ))}
        </Flex>
      )}
      
      {specialists.length > 0 && !loading && (
        <div style={{ color: 'white', marginTop: 20 }}>
          Показано: {specialists.length} специалистов
        </div>
      )}
    </Flex>
  );
}

export default TableSpecialists;