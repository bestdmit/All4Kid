import { Button, message, Rate, Space, Typography, Card, Avatar, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Review, reviewsApi } from "../../api/reviews";

const { Title, Text } = Typography;

type Props = {
  title?: string;
  cardStyle?: React.CSSProperties;
};

export default function ReviewsModerationPanel({
  title = "Отзывы, ожидающие подтверждения",
  cardStyle,
}: Props) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const count = useMemo(() => reviews?.length ?? 0, [reviews]);

  useEffect(() => {
    let cancelled = false;

    const fetchUnapproved = async () => {
      try {
        setLoading(true);
        const res = await reviewsApi.fetchUnapproved();

        if (!res.success) {
          throw new Error(res.message || "Ошибка получения отзывов");
        }

        if (!cancelled) {
          setReviews(res.data ?? []);
        }
      } catch (e: any) {
        message.error(e instanceof Error ? e.message : "Ошибка при получении отзывов");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUnapproved();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleApproveReview = async (id: number) => {
    try {
      const res = await reviewsApi.approve(id);
      if (!res.success) {
        throw new Error(res.message || "Не удалось подтвердить отзыв");
      }
      message.success("Отзыв подтверждён");
      setRefreshKey((x) => x + 1);
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") {
        message.error("Сессия истекла. Войдите заново");
        navigate("/auth");
        return;
      }
      message.error(e instanceof Error ? e.message : "Ошибка при подтверждении отзыва");
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      const res = await reviewsApi.delete(id);
      if (!res.success) {
        throw new Error(res.message || "Не удалось удалить отзыв");
      }
      message.success("Отзыв отклонён");
      setRefreshKey((x) => x + 1);
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") {
        message.error("Сессия истекла. Войдите заново");
        navigate("/auth");
        return;
      }
      message.error(e instanceof Error ? e.message : "Ошибка при отклонении отзыва");
    }
  };

  return (
    <Card style={cardStyle} loading={loading}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{count}</Text>
      </div>

      <div style={{ marginTop: 16 }}>
        {(reviews?.length ?? 0) === 0 ? (
          <Text type="secondary">Нет отзывов на модерации</Text>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {reviews!.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: "16px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                   <Space align="center" size={12}>
                      <Avatar src={review.user_avatar} icon={<UserOutlined />} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Text strong>{review.user_name || `Пользователь #${review.user_id}`}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                              для специалиста: <Link to={`/specialists/${review.specialist_id}`}>{review.specialist_name || `Специалист #${review.specialist_id}`}</Link>
                          </Text>
                      </div>
                   </Space>
                   <Rate disabled value={review.rating} style={{ fontSize: 16 }} />
                </div>

                <div style={{ padding: "8px 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {review.comment}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button type="primary" onClick={() => handleApproveReview(review.id)}>
                    Подтвердить
                  </Button>
                  <Button danger onClick={() => handleDeleteReview(review.id)}>
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>
    </Card>
  );
}

