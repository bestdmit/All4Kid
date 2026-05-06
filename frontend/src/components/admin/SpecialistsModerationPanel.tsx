import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Empty, Input, message, Modal, Space, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { specialistApi, type Specialist } from "../../api/specialists";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

type Props = {
  title?: string;
  cardStyle?: React.CSSProperties;
};

export default function SpecialistsModerationPanel({
  title = "Объявления на модерации",
  cardStyle,
}: Props) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const total = useMemo(() => specialists.length, [specialists]);

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await specialistApi.getPendingModeration();
      setSpecialists(data);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      message.error(err?.message || "Не удалось загрузить объявления на модерации");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setApprovingId(id);
      await specialistApi.approveSpecialist(id);
      setSpecialists((prev) => prev.filter((item) => item.id !== id));
      message.success("Объявление одобрено и опубликовано");
    } catch (error: unknown) {
      const err = error instanceof Error ? error : null;
      message.error(err?.message || "Не удалось одобрить объявление");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = (spec: Specialist) => {
    let reason = "";

    Modal.confirm({
      title: `Удалить объявление "${spec.name}"?`,
      okText: "Удалить",
      cancelText: "Отмена",
      okButtonProps: { danger: true },
      content: (
        <Input.TextArea
          rows={4}
          placeholder="Укажите причину удаления (минимум 5 символов)"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        if (reason.trim().length < 5) {
          message.error("Укажите причину удаления (минимум 5 символов)");
          return Promise.reject(new Error("INVALID_REASON"));
        }

        try {
          setDeletingId(spec.id);
          await specialistApi.adminDeleteSpecialist(spec.id, reason.trim());
          setSpecialists((prev) => prev.filter((item) => item.id !== spec.id));
          message.success("Объявление удалено");
        } catch (error: unknown) {
          const err = error instanceof Error ? error : null;
          message.error(err?.message || "Не удалось удалить объявление");
          return Promise.reject(error);
        } finally {
          setDeletingId(null);
        }

        return undefined;
      },
    });
  };

  return (
    <Card style={cardStyle} loading={loading}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{total}</Text>
      </div>

      <div style={{ marginTop: 16 }}>
        {specialists.length === 0 ? (
          <Empty description="Нет объявлений на модерации" />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {specialists.map((spec) => (
              <div
                key={spec.id}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Space align="start" size={12} style={{ width: "100%", justifyContent: "space-between" }}>
                  <Space align="start" size={12}>
                    <Avatar src={spec.avatar_url} icon={<UserOutlined />} />
                    <div>
                      <Space wrap size={[8, 8]}>
                        <Text strong>{spec.name}</Text>
                        <Tag color="orange">Ожидает проверки</Tag>
                      </Space>
                      <div>
                        <Text type="secondary">{spec.specialty}</Text>
                      </div>
                      <div>
                        <Text type="secondary">
                          {spec.category} • {spec.location}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary">Цена: {spec.price_per_hour} ₽/час</Text>
                      </div>
                    </div>
                  </Space>

                  <Space>
                    <Button onClick={() => navigate(`/specialists/${spec.id}?adminPreview=1`)}>
                      Просмотреть
                    </Button>
                    <Button danger loading={deletingId === spec.id} onClick={() => handleDelete(spec)}>
                      Удалить
                    </Button>
                    <Button
                      type="primary"
                      loading={approvingId === spec.id}
                      onClick={() => handleApprove(spec.id)}
                    >
                      Одобрить
                    </Button>
                  </Space>
                </Space>

                <Paragraph style={{ marginTop: 12, marginBottom: 0 }} ellipsis={{ rows: 3, expandable: true }}>
                  {spec.description}
                </Paragraph>
              </div>
            ))}
          </Space>
        )}
      </div>

    </Card>
  );
}
