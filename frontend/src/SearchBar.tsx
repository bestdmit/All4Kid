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
    <div style={{ display: 'flex', gap: '8px' }}>
      <Input
        placeholder="Поиск по имени или специальности..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        size="large"
        style={{ width: '300px' }}
      />
      <Button 
        type="primary" 
        onClick={handleSearch}
        loading={loading}
        size="large"
      >
        Найти
      </Button>
    </div>
  );
};

export default SearchBar;