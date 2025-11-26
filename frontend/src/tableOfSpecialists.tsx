import React from "react";
import { Card, Flex, Button } from "antd";
import { useSpecialists } from "../hooks/useSpecialists";

const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const { specialists, loading, error, refetch } = useSpecialists();

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка специалистов...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center' }}>
        Ошибка: {error}
        <br />
        <Button type="primary" onClick={refetch} style={{ marginTop: 10 }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <Flex align={"center"} justify={"center"} vertical>
      <Button 
        type="primary" 
        onClick={refetch}
        style={{ marginBottom: 20 }}
      >
        Обновить список
      </Button>
      
      <Flex wrap gap={'middle'} justify={"center"}>
        {specialists.map((item) =>
          <Card key={item.id} title={item.name} style={cardStyle}>
            <p><strong>Специальность:</strong> {item.specialty}</p>
            <p><strong>Опыт:</strong> {item.experience} лет</p>
            <p><strong>Рейтинг:</strong> ⭐ {item.rating}</p>
            <p><strong>Местоположение:</strong> {item.location}</p>
            <p><strong>Цена:</strong> {item.price_per_hour} ₽/час</p>
          </Card>
        )}
      </Flex>
    </Flex>
  );
}

export default TableSpecialists;