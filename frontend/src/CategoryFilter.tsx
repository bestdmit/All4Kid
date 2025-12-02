import React from 'react';
import { Select } from 'antd';
import { useCategories } from '../hooks/useCategories';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const { categories, loading } = useCategories();

  return (
    <Select
      placeholder="Все категории"
      value={value || undefined}
      onChange={onChange}
      loading={loading}
      allowClear
      style={{ width: 200 }}
      size="large"
      disabled={disabled}
    >
      <Select.Option value="">Все категории</Select.Option>
      {categories.map((category) => (
        <Select.Option key={category.id} value={category.slug}>
          {category.name}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CategoryFilter;