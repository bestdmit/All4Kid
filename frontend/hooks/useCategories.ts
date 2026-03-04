import { useEffect, useState } from 'react';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки категорий');
      }
      
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки категорий:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};