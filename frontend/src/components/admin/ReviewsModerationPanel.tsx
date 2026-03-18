import { Button, message, Rate, Space, Typography, Card } from "antd";
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
                  padding: "12px 16px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ minWidth: 120 }}>
                  <Rate disabled value={review.rating} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{review.comment}</div>
                </div>
                <Space>
                  <Button type="primary" onClick={() => handleApproveReview(review.id)}>
                    Подтвердить
                  </Button>
                  <Button danger onClick={() => handleDeleteReview(review.id)}>
                    Отклонить
                  </Button>
                </Space>
              </div>
            ))}
          </Space>
        )}
      </div>
    </Card>
  );
}

