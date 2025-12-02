import React, { useState } from "react";
import { Input, Button } from "antd";

const SearchBar = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "20px", maxWidth: "500px" }}>
      <Input
        placeholder="Поиск по имени или специальности..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        size="large"
        style={{ flex: 1 }}
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