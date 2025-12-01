import React, { useState, useEffect } from "react";
import { Card, Flex, Button, message } from "antd";
import SearchBar from "./SearchBar";
import { useSpecialists } from "../hooks/useSpecialists";

const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSpecialists, setFilteredSpecialists] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { specialists, loading, error, refetch } = useSpecialists();

  useEffect(() => {
    if (specialists.length > 0 && !searchTerm) {
      setFilteredSpecialists(specialists);
    }
  }, [specialists, searchTerm]);

  // Поиск специалистов
  const handleSearch = async (search: string) => {
    if (!search.trim()) {
      // Если поиск пустой - показываем всех
      setSearchTerm('');
      setFilteredSpecialists(specialists);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchTerm(search);
      
      const url = `/api/specialists?search=${encodeURIComponent(search)}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Ошибка поиска');
      
      const result = await response.json();
      if (result.success) {
        setFilteredSpecialists(result.data);
      }
    } catch (err) {
      message.error('Ошибка при поиске специалистов');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredSpecialists(specialists);
  };

  if (loading && !filteredSpecialists.length) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка специалистов...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center' }}>
        Ошибка: {error}
        <br />
        <Button type="primary" onClick={refetch} style={{ marginTop: 10 }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <Flex align={"center"} justify={"center"} vertical>
      <SearchBar 
        onSearch={handleSearch}
        loading={searchLoading || loading}
      />
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
        <Button 
          type="primary" 
          onClick={refetch}
          loading={loading}
        >
          Обновить список
        </Button>
        
        {searchTerm && (
          <Button 
            onClick={handleResetSearch}
            disabled={loading}
          >
            Сбросить поиск
          </Button>
        )}
      </div>
      
      {filteredSpecialists.length === 0 ? (
        <div style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>
          {searchTerm 
            ? `Не найдено специалистов по запросу: "${searchTerm}"`
            : 'Специалисты не найдены'}
        </div>
      ) : (
        <>
          <div style={{ color: 'white', marginBottom: 20 }}>
            Найдено специалистов: {filteredSpecialists.length}
            {searchTerm && ` по запросу "${searchTerm}"`}
          </div>
          
          <Flex wrap gap={'middle'} justify={"center"}>
            {filteredSpecialists.map((item) => (
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
        </>
      )}
    </Flex>
  );
}

export default TableSpecialists;