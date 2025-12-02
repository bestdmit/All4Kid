import React from "react";
import { Card, Typography, Rate } from "antd";
import type { Specialist } from "../stores/specialistStore";

const { Title,Text } = Typography;

interface SpecialistCardProps {
  specialist: Specialist;
}

const cardStyle: React.CSSProperties = {
  width: "15rem",
  position: "relative", // Добавляем для контейнера
};

const coverStyle: React.CSSProperties = {
  height: "11vh",
  objectFit: 'cover',
  width: "auto",
  margin: 0,
  backgroundColor: "#E9E6E6",
  position: "relative", // Для позиционирования рейтинга внутри
};

const ratingBadgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "8px",
  left: "8px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

export default function SpecialistCard({ specialist }: SpecialistCardProps) {
  return (
    <Card variant="borderless" style={cardStyle} 
      cover={
        <div style={coverStyle}>
          <div style={ratingBadgeStyle}>
            <span>★</span>
            <span>{specialist.rating}</span>
          </div>
        </div>
      }
    >
      <Title level={4} style={{ marginTop: 0 }}>{specialist.name}</Title>
      <Text >{specialist.specialty}</Text>
      <br />
      <Text >{specialist.price_per_hour} ₽/час</Text>
    </Card>
  );
}