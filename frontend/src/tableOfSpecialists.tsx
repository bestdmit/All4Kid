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
  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/specialists");

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: Specialist[] = await response.json();
      setSpecialists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      console.error("Ошибка при загрузке специалистов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);
  return (
    <List
      grid={{ gutter: 16, column: 4 }}
      dataSource={specialists}
      renderItem={(item) => (
        <List.Item>
          <Card title={item.name}>item.speciality</Card>
        </List.Item>
      )}
    />
  );
}

export default TableSpecialists;
