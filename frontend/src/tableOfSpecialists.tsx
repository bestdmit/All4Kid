import { useState, useEffect } from "react";
import { List, Card } from "antd";

interface Specialist {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  location: string;
  price_per_hour: number;
  created_at: string;
}

function TableSpecialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = "";

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/specialists`);

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      // ИСПРАВЛЕНИЕ: правильный парсинг ответа API
      const result = await response.json();
      if (result.success && result.data) {
        setSpecialists(result.data);
      } else {
        throw new Error(result.message || "Ошибка формата данных");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      console.error("Ошибка при загрузке специалистов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
    console.log("Fetching specialists from:", `${API_BASE_URL}/api/specialists`);
  }, []);

  // ДОБАВЛЯЕМ обработку состояний
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка специалистов...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center' }}>Ошибка: {error}</div>;
  }

  return (
    <List
      grid={{ gutter: 16, column: 4 }}
      dataSource={specialists}
      renderItem={(item) => (
        <List.Item>
          <Card title={item.name}>
            {/* ИСПРАВЛЕНИЕ: specialty вместо speciality */}
            <p><strong>Специальность:</strong> {item.specialty}</p>
            <p><strong>Опыт:</strong> {item.experience} лет</p>
            <p><strong>Рейтинг:</strong> ⭐ {item.rating}</p>
            <p><strong>Местоположение:</strong> {item.location}</p>
            <p><strong>Цена:</strong> {item.price_per_hour} ₽/час</p>
          </Card>
        </List.Item>
      )}
    />
  );
}

export default TableSpecialists;