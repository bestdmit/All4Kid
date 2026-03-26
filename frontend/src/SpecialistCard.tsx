import { Card, Typography, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { Specialist } from "../src/api/specialists";
import "./specialistCard.css";

const { Title, Text } = Typography;

interface SpecialistCardProps {
  specialist: Specialist;
  forDelete?: boolean;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
  isLoading?: boolean;
}

const cardStyle: React.CSSProperties = {
  width: "100%",
  position: "relative",
  cursor: "pointer",
  border: "1px solid #d9d9d9",
  borderRadius: "12px",
  overflow: "hidden",
};

const coverStyle: React.CSSProperties = {
  height: "110px",
  objectFit: 'cover',
  width: "100%",
  margin: 0,
  backgroundColor: "#E9E6E6",
  position: "relative",
};

const ratingBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: "4px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const deleteButtonStyle: React.CSSProperties = {
  marginTop: "12px",
  width: "100%",
};

export default function SpecialistCard({ 
  specialist, 
  forDelete = false, 
  onDelete, onClick,
  isLoading = false 
}: SpecialistCardProps) {
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(specialist.id);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(specialist.id);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const confirmDelete = () => {
    handleDelete();
  };

  const avatarSrc = specialist.avatar_url && specialist.avatar_url.trim() 
    ? specialist.avatar_url 
    : '/uploads/avatars/default.jpg';

  return (
    <Card
      variant="borderless"
      style={cardStyle}
      styles={{ body: { padding: 12 } }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Открыть страницу специалиста ${specialist.name}` : undefined}
      cover={
        <div style={{ ...coverStyle, position: 'relative' }}>
          <img 
            src={avatarSrc}
            alt={specialist.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              objectPosition: 'center 18%'
            }}
            onError={(e) => {
              e.currentTarget.src = '/uploads/avatars/default.jpg';
            }}
          />
          <div style={ratingBadgeStyle}>
            <span>★</span>
            <span>
              {specialist.rating}({specialist.reviews_total ?? 0})
            </span>
          </div>
        </div>
      }
    >
      <div className="specialist-card-body">
        <Title level={4} className="specialist-card-name">
          {specialist.name || "ФИО"}
        </Title>
        <Text className="specialist-card-specialty">{specialist.specialty || "Вид специалиста"}</Text>

        <div className="specialist-card-price">
          <Text type="secondary" className="specialist-card-price-label">
            Стоимость за час
          </Text>
          <Text className="specialist-card-price-value">
            {specialist.price_per_hour} ₽/час
          </Text>
        </div>
      
        {forDelete && (
          <Popconfirm
            title="Удалить специалиста"
            description="Вы уверены, что хотите удалить этого специалиста?"
            onConfirm={confirmDelete}
            okText="Да"
            cancelText="Нет"
          >
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
              loading={isLoading}
              style={deleteButtonStyle}
              onClick={(e) => e.stopPropagation()}
            >
              Удалить
            </Button>
          </Popconfirm>
        )}
      </div>
    </Card>
  );
}