import React, { useState } from "react";
import { Card, Flex, Button, message, Space } from "antd";
import { useSpecialists } from "../hooks/useSpecialists";
import SpecialistCard from "./SpecialistCard";
import type { Specialist } from "../stores/specialistStore";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const { specialists, loading, error, refetch } = useSpecialists();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('');

  const performSearch = async (search: string, category: string) => {
    setIsSearching(true);
    
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (category) params.append('category', category);
      
      const url = `/api/specialists${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Ошибка поиска');
      
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    performSearch(term, selectedCategory);
  };


  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    performSearch(searchTerm, category);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSearchResults([]);
  };

  const hasActiveFilters = searchTerm || selectedCategory;
  const displayData = hasActiveFilters ? searchResults : specialists;
  const displayLoading = hasActiveFilters ? isSearching : loading;

  if (displayLoading && displayData.length === 0) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (error && !hasActiveFilters) {
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
      {/* Панель фильтров */}
      <div style={{ 
        marginBottom: '24px',
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Строка с поиском и фильтром категорий */}
        <Space size="middle" style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          <SearchBar 
            onSearch={handleSearch}
            loading={isSearching}
          />
          <CategoryFilter 
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={isSearching}
          />
        </Space>
        
        {/* Кнопки управления */}
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={refetch}
            loading={loading && !hasActiveFilters}
            disabled={isSearching}
          >
            Обновить список
          </Button>
          
          {hasActiveFilters && (
            <Button 
              onClick={handleResetFilters}
              disabled={isSearching}
            >
              Сбросить все фильтры
            </Button>
          )}
        </Space>
      </div>
      
      {/* Отображение результатов */}
      {displayData.length === 0 ? (
        <div style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>
          {hasActiveFilters 
            ? `Не найдено специалистов${searchTerm ? ` по запросу "${searchTerm}"` : ''}${selectedCategory ? ' в выбранной категории' : ''}`
            : 'Специалисты не найдены'}
        </div>
      ) : (
        <>
          <div style={{ color: 'white', marginBottom: 20, textAlign: 'center' }}>
            {hasActiveFilters 
              ? `Найдено ${displayData.length} специалистов${searchTerm ? ` по запросу "${searchTerm}"` : ''}${selectedCategory ? ' в выбранной категории' : ''}`
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