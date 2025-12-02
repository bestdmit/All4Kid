import React, { useState } from "react";
import { Input, Button } from "antd";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  loading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden', // Это важно для объединения
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    }}>
      <Input
        placeholder="Поиск по имени или специальности..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        size="large"
        style={{ 
          flex: 1,
          borderRadius: '8px 0 0 8px', // Закругляем только левую сторону
          borderRight: 'none', // Убираем правую границу
          marginRight: 0,
          border: '1px solid #d9d9d9',
        }}
      />
      <Button 
        type="primary" 
        onClick={handleSearch}
        loading={loading}
        size="large"
        style={{
          borderRadius: '0 8px 8px 0', // Закругляем только правую сторону
          marginLeft: 0,
          border: '1px solid #1890ff',
          borderLeft: 'none', // Убираем левую границу
          boxShadow: 'none'
        }}
      >
        Найти
      </Button>
    </div>
  );
};

export default SearchBar;