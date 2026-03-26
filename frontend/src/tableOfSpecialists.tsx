import { useState, useEffect } from "react";
import { Card, Button, message, Input } from "antd";
import { useSpecialistStore } from "../stores/specialistStore";
import SpecialistCard from "./SpecialistCard";
import { specialistApi, type Specialist } from "./api/specialists";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import "./tableOfSpecialists.css";

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
  const [districtFilter, setDistrictFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const initialCategoryFromUrl = searchParams.get('category') || '';
  const initialSearchFromUrl = searchParams.get('search') || '';
  const initialDistrictFromUrl = searchParams.get('district') || '';
  const initialMinRatingFromUrl = searchParams.get('minRating') || '';
  
  // Инициализируем фильтры из URL и сразу выполняем поиск
  useEffect(() => {
    setSearchTerm(initialSearchFromUrl);
    setSelectedCategory(initialCategoryFromUrl);
    setDistrictFilter(initialDistrictFromUrl);
    setMinRatingFilter(initialMinRatingFromUrl);
    performSearch(initialSearchFromUrl, initialCategoryFromUrl);
  }, []);

  const syncFiltersToUrl = (search: string, category: string, district: string, minRating: string) => {
    const nextParams = new URLSearchParams();
    if (search.trim()) nextParams.set('search', search.trim());
    if (category) nextParams.set('category', category);
    if (district.trim()) nextParams.set('district', district.trim());
    if (minRating.trim()) nextParams.set('minRating', minRating.trim());
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
    syncFiltersToUrl(term, selectedCategory, districtFilter, minRatingFilter);
    performSearch(term, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    syncFiltersToUrl(searchTerm, category, districtFilter, minRatingFilter);
    performSearch(searchTerm, category);
  };

  const handleDistrictChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setDistrictFilter(nextValue);
    syncFiltersToUrl(searchTerm, selectedCategory, nextValue, minRatingFilter);
  };

  const handleMinRatingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setMinRatingFilter(nextValue);
    syncFiltersToUrl(searchTerm, selectedCategory, districtFilter, nextValue);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDistrictFilter('');
    setMinRatingFilter('');
    setSearchParams({}, { replace: true });
    fetchSpecialists(); // Загружаем всех специалистов заново
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

  const normalizedDistrictFilter = districtFilter.trim().toLowerCase();
  const parsedMinRating = Number(minRatingFilter);

  const displayData = specialists.filter((item) => {
    const districtMatch =
      !normalizedDistrictFilter ||
      item.location.toLowerCase().includes(normalizedDistrictFilter);
    const ratingMatch =
      !minRatingFilter.trim() ||
      (!Number.isNaN(parsedMinRating) && item.rating >= parsedMinRating);

    return districtMatch && ratingMatch;
  });

  const hasActiveFilters = Boolean(searchTerm || selectedCategory || districtFilter || minRatingFilter);
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
    <div className="specialists-page">
      <div className="specialists-page-inner">
        <SearchBar
          value={searchTerm}
          onSearch={handleSearch}
          loading={isSearching}
        />

        <Card className="filters-card" size="small">
          <div className="filters-title">Фильтры</div>

          <div className="filter-item">
            <div className="filter-label">Категория</div>
            <CategoryFilter
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={isSearching}
            />
          </div>

          <div className="filter-item">
            <div className="filter-label">Район</div>
            <Input
              placeholder="Все районы"
              value={districtFilter}
              onChange={handleDistrictChange}
              disabled={isSearching}
              size="large"
            />
          </div>

          <div className="filter-item">
            <div className="filter-label">Минимальный рейтинг</div>
            <Input
              placeholder="0.0"
              value={minRatingFilter}
              onChange={handleMinRatingChange}
              disabled={isSearching}
              size="large"
              type="number"
              min={0}
              max={5}
              step={0.1}
            />
          </div>

          <div className="filters-actions">
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
              <Button onClick={handleResetFilters} disabled={isSearching} block>
                Сбросить фильтры
              </Button>
            )}
          </div>
        </Card>

        {displayData.length === 0 ? (
          <div className="empty-state">
            {hasActiveFilters
              ? "По вашим фильтрам ничего не найдено"
              : "Специалисты не найдены"}
          </div>
        ) : (
          <div className="cards-grid">
            {displayData.map((item: Specialist) => (
              <SpecialistCard
                key={item.id}
                specialist={item}
                onClick={handleSpecialistSelect}
                forDelete={user?.role === "admin"}
                onDelete={handleAdminDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TableSpecialists;