import React, { useState, useEffect } from "react";
import { Card, Flex, Button, message, Space, Layout } from "antd";
import { useSpecialistStore } from "../stores/specialistStore";
import SpecialistCard from "./SpecialistCard";
import type { Specialist } from "./api/specialists";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

const { Content, Sider } = Layout;

function TableSpecialists() {
  const { 
    specialists, 
    loading, 
    error, 
    fetchSpecialists, 
    searchSpecialists 
  } = useSpecialistStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Загружаем специалистов при монтировании компонента
  useEffect(() => {
    fetchSpecialists();
  }, []);

  const performSearch = async (search: string, category: string) => {
    setIsSearching(true);
    
    try {
      await searchSpecialists(search, category);
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
    fetchSpecialists(); // Загружаем всех специалистов заново
  };

  const hasActiveFilters = searchTerm || selectedCategory;
  const displayData = specialists;
  const displayLoading = hasActiveFilters ? isSearching : loading;

  if (displayLoading && displayData.length === 0) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  if (error && !hasActiveFilters) {
    return (
      <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
        Ошибка: {error}
        <br />
        <Button type="primary" onClick={fetchSpecialists} style={{ marginTop: 10 }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <Layout style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#FFFFFF',
      padding: '0 24px'
    }}>
      <Layout style={{ 
        backgroundColor: 'transparent',
        flexDirection: 'row' 
      }}>
        {/* Левая панель - фильтры и управление */}
        <Sider 
          width={300}
          style={{ 
            backgroundColor: 'transparent',
            marginRight: '24px',
            paddingTop: '0',
          }}
        >
          <Card
            size="small"
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(105, 103, 103, 0.98)',
              color: 'white',
              marginTop: "15vh",
              paddingTop: 0,
              boxShadow: "3px 3px 3px rgba(105, 103, 103, 0.98)"
            }}
            styles={{
              header: { 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            {/* Фильтр категорий */}
            <div style={{ marginBottom: '16px' }}>
              <CategoryFilter 
                value={selectedCategory}
                onChange={handleCategoryChange}
                disabled={isSearching}
              />
            </div>
            
            {/* Кнопки управления */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '16px' }}>
              <Button 
                type="primary" 
                onClick={fetchSpecialists}
                loading={loading && !hasActiveFilters}
                disabled={isSearching}
                block
              >
                Обновить список
              </Button>
              
              {hasActiveFilters && (
                <Button 
                  onClick={handleResetFilters}
                  disabled={isSearching}
                  block
                >
                  Сбросить все фильтры
                </Button>
              )}
            </div>
            
          </Card>
        </Sider>

        {/* Правая часть - карточки специалистов */}
        <Content style={{ 
          backgroundColor: 'transparent',
          flex: 1
        }}>
          {/* Поиск над карточками специалистов */}
          <div style={{ 
            marginTop: '1vh',
            width: '100%'
          }}>
            <SearchBar 
              onSearch={handleSearch}
              loading={isSearching}
            />
          </div>

          {/* Заголовок таблицы карточек */}
          <div style={{ 
            color: 'white', 
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {hasActiveFilters 
              ? `Результаты поиска${searchTerm ? ` по запросу "${searchTerm}"` : ''}${selectedCategory ? ' в категории "' + selectedCategory + '"' : ''}`
              : 'Все специалисты'}
          </div>

          {/* Карточки специалистов */}
          {displayData.length === 0 ? (
            <div style={{ 
              color: 'white', 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              {hasActiveFilters 
                ? `Не найдено специалистов${searchTerm ? ` по запросу "${searchTerm}"` : ''}${selectedCategory ? ' в выбранной категории' : ''}`
                : 'Специалисты не найдены'}
            </div>
          ) : (
            <Flex wrap gap="middle" justify="start">
              {displayData.map((item: Specialist) => (
                <SpecialistCard key={item.id} specialist={item} />
              ))}
            </Flex>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default TableSpecialists;