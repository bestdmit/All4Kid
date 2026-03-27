import { useEffect, useMemo, useState } from "react";
import { Card, Button, Input, Select, message, Typography } from "antd";
import { useSpecialistStore } from "../stores/specialistStore";
import SpecialistCard from "./SpecialistCard";
import { specialistApi, type Specialist } from "./api/specialists";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

import "./tableOfSpecialists.css";

const { Text } = Typography;

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
  const [district, setDistrict] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [minRating, setMinRating] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const initialCategoryFromUrl = searchParams.get('category') || '';
  const initialSearchFromUrl = searchParams.get('search') || '';
  
  // Инициализируем фильтры из URL и сразу выполняем поиск
  useEffect(() => {
    setSearchTerm(initialSearchFromUrl);
    setSelectedCategory(initialCategoryFromUrl);
    performSearch(initialSearchFromUrl, initialCategoryFromUrl);
  }, []);

  const syncFiltersToUrl = (search: string, category: string) => {
    const nextParams = new URLSearchParams();
    if (search?.trim()) nextParams.set('search', search?.trim());
    if (category) nextParams.set('category', category);
    setSearchParams(nextParams, { replace: true });
  };

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
    syncFiltersToUrl(term, selectedCategory);
    performSearch(term, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    syncFiltersToUrl(searchTerm, category);
    performSearch(searchTerm, category);
  };

  const handleSpecialistSelect = (id: number) => {
    navigate(`/specialists/${id}`)
  };

  const handleAdminDelete = async (id: number) => {
    if (user?.role !== 'admin') return;

    const reason = window.prompt('Укажите причину удаления объявления (минимум 5 символов):')?.trim();
    if (!reason || reason.length < 5) {
      message.error('Удаление отменено: нужна причина от 5 символов');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      message.error('Сессия истекла. Войдите заново');
      return;
    }

    try {
      await specialistApi.deleteById(id, accessToken, reason);
      message.success('Объявление удалено администратором');
      await fetchSpecialists();
    } catch (error: any) {
      message.error(error?.message || 'Не удалось удалить объявление');
    }
  };

  const normalizedDistrict = district?.trim().toLowerCase();
  const normalizedSpecialty = specialty?.trim().toLowerCase();
  const parsedMinRating = Number(minRating);

  const displayData = useMemo(() => {
    return specialists.filter((item) => {
      const districtOk = !normalizedDistrict || (item.location || '').toLowerCase().includes(normalizedDistrict);
      const specialtyOk = !normalizedSpecialty || (item.specialty || '').toLowerCase().includes(normalizedSpecialty);
      const ratingOk = !minRating?.trim() || (!Number.isNaN(parsedMinRating) && item.rating >= parsedMinRating);
      return districtOk && specialtyOk && ratingOk;
    });
  }, [specialists, normalizedDistrict, normalizedSpecialty, minRating, parsedMinRating]);

  const hasActiveFilters = Boolean(searchTerm || selectedCategory || district || specialty || minRating);
  const displayLoading = (isSearching || loading) && specialists.length === 0;


  const districtOptions = useMemo(() => {
    const uniq = new Set(specialists.map((s) => s.location).filter(Boolean));
    return Array.from(uniq);
  }, [specialists]);

  const specialtyOptions = useMemo(() => {
    const uniq = new Set(specialists.map((s) => s.specialty).filter(Boolean));
    return Array.from(uniq);
  }, [specialists]);


  if (displayLoading) {
    return <div className="specialists-loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="specialists-error">
        <Text type="danger">Ошибка: {error}</Text>
        <Button type="primary" onClick={fetchSpecialists} className="specialists-error-btn">
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="specialists-page">
      <div className="specialists-search-area">
        <SearchBar onSearch={handleSearch} loading={isSearching} />
      </div>

      <div className="specialists-layout">
        <Card size="small" className="specialists-filters-card">
          <div className="specialists-filters-title">Фильтры</div>

          <div className="specialists-filter-group">
            <div className="specialists-filter-label">Категория</div>
            <CategoryFilter
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={isSearching}
            />
          </div>

          <div className="specialists-filter-group">
            <div className="specialists-filter-label">Район</div>
            <Select
              placeholder="Все районы"
              value={district || undefined}
              onChange={(val) => setDistrict(val)}
              allowClear
              className="specialists-filter-select"
              disabled={isSearching}
            >
              <Select.Option value="">Все районы</Select.Option>
              {districtOptions.map((d) => (
                <Select.Option key={d} value={d}>
                  {d}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="specialists-filter-group">
            <div className="specialists-filter-label">Вид специализации</div>
            <Select
              placeholder="Все специализации"
              value={specialty || undefined}
              onChange={(val) => setSpecialty(val)}
              allowClear
              className="specialists-filter-select"
              disabled={isSearching}
            >
              <Select.Option value="">Все специализации</Select.Option>
              {specialtyOptions.map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="specialists-filter-group specialists-filter-group-last">
            <div className="specialists-filter-label">Минимальный рейтинг</div>
            <Input
              placeholder="0.0"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              disabled={isSearching}
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="specialists-filter-input"
              size="large"
            />
          </div>
        </Card>

        <div className="specialists-results">
          {displayData.length === 0 ? (
            <div className="specialists-empty">
              {hasActiveFilters ? "Ничего не найдено по выбранным фильтрам" : "Специалисты не найдены"}
            </div>
          ) : (
            <div className="specialists-cards-grid">
              {displayData.map((item: Specialist) => (
                <SpecialistCard
                  key={item.id}
                  specialist={item}
                  onClick={handleSpecialistSelect}
                  forDelete={user?.role === 'admin'}
                  onDelete={handleAdminDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TableSpecialists;