import React, { useState, useEffect } from "react";
import { Card, Flex, Button, message } from "antd";
import { useSpecialists } from "../hooks/useSpecialists";
import SpecialistCard from "./SpecialistCard";
import type { Specialist } from "../stores/specialistStore";
import SearchBar from "./SearchBar";

const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const { specialists, loading, error, refetch } = useSpecialists();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (specialists.length > 0 && !searchTerm) {
      setSearchResults([]); // Сбрасываем результаты поиска при загрузке всех
    }
  }, [specialists, searchTerm]);


  // Функция поиска
  const handleSearch = async (term: string) => {
    if (!term.trim()) {

      setSearchTerm('');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchTerm(term);
    
    try {
      const response = await fetch(`/api/specialists?search=${encodeURIComponent(term)}`);
      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (err) {
      message.error('Ошибка при поиске');
    } finally {
      setIsSearching(false);
    }
  };

  // Какие данные показывать?
  const displayData = searchTerm ? searchResults : specialists;
  const displayLoading = searchTerm ? isSearching : loading;

  if (displayLoading && displayData.length === 0) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (error && !searchTerm) {
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
      {/* Поисковая строка */}
      <SearchBar 
        onSearch={handleSearch}
        loading={isSearching}
      />
      
      {/* Кнопки управления */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
        <Button 
          type="primary" 
          onClick={refetch}
          loading={loading && !searchTerm}
          disabled={isSearching}
        >
          Обновить список
        </Button>
        
        {searchTerm && (
          <Button 
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
            }}
            disabled={isSearching}
          >
            Сбросить поиск
          </Button>
        )}
      </div>
      
      {/* Отображение результатов */}
      {displayData.length === 0 ? (
        <div style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>
          {searchTerm 
            ? `Не найдено специалистов по запросу: "${searchTerm}"`
            : 'Специалисты не найдены'}
        </div>
      ) : (
        <>
          <div style={{ color: 'white', marginBottom: 20 }}>
            {searchTerm 
              ? `Найдено ${displayData.length} специалистов по запросу "${searchTerm}"`
              : `Всего специалистов: ${displayData.length}`}
          </div>
          
          <Flex wrap gap={'middle'} justify={"center"}>
            {displayData.map((item) => (
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