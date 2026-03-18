import { useState } from "react";
import { Button, message, Input, Typography, Card, Row, Col, Avatar, Modal, Tooltip } from "antd";
import type { User } from "../stores/auth.store";
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ReviewsModerationPanel from "./components/admin/ReviewsModerationPanel";

const { Text } = Typography;

interface ProfileTabsProps {
  user: User;
  updateProfile: (data: any) => Promise<boolean>;
}

export default function ProfileTabs({ user, updateProfile }: ProfileTabsProps) {
  const tabs = [
    { key: "children", label: "Мои дети" },
    { key: "favorites", label: "Избранное" },
    ...(user.role === "admin" ? [{ key: "review_moderation", label: "Модерация отзывов" }] : []),
  ];

  const [active, setActive] = useState<string>(tabs[0].key);

  const [childName, setChildName] = useState("");
  const [childBirth, setChildBirth] = useState("");
  const [adding, setAdding] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const handleAddChild = async () => {
    if (!childName.trim()) {
      message.error("Введите имя ребенка");
      return;
    }
    try {
      setAdding(true);
      const newChildren = [...(user.children || []), { name: childName.trim(), birthDate: childBirth || null }];
      const ok = await updateProfile({ children: newChildren });
      if (ok) {
        message.success("Ребенок добавлен");
        setChildName("");
        setChildBirth("");
        setAddModalVisible(false);
      } else {
        message.error("Не удалось сохранить ребёнка");
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Ошибка при добавлении");
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteChild = (index: number) => {
    Modal.confirm({
      title: 'Удалить ребёнка?',
      content: 'Вы уверены, что хотите удалить этого ребёнка? Действие необратимо.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const current = user.children || [];
          const newChildren = current.filter((_: any, i: number) => i !== index);
          const ok = await updateProfile({ children: newChildren });
          if (ok) {
            message.success('Ребёнок удалён');
          } else {
            message.error('Не удалось удалить ребёнка');
          }
        } catch (err) {
          console.error(err);
          message.error('Ошибка при удалении');
        }
      }
    });
  };

  const renderChildrenTab = () => {
    const children = user.children || [];
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 18 }}>Профили детей</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            Добавить ребёнка
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {children.length === 0 && (
            <Col span={24}><Text>Детей пока нет</Text></Col>
          )}

          {children.map((c: any, idx: number) => {
            // compute age and formatted date
            let ageText = '';
            let dateText = '';
            if (c.birthDate) {
              const d = new Date(c.birthDate);
              if (!isNaN(d.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - d.getFullYear();
                const m = today.getMonth() - d.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
                ageText = `${age} ${age % 10 === 1 && age !== 11 ? 'год' : (age % 10 >=2 && age %10<=4 && (age<12||age>14) ? 'года' : 'лет')}`;
                dateText = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
              }
            }

            return (
              <Col key={idx} xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar style={{ backgroundColor: '#87d068', marginRight: 12 }}>
                        {c.name ? String(c.name).charAt(0).toUpperCase() : 'Д'}
                      </Avatar>
                      <div>
                        <Text strong>{c.name}</Text>
                        <div style={{ color: '#888' }}>{ageText}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip title="Редактировать">
                        <Button type="text" icon={<EditOutlined />} />
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDeleteChild(idx)} />
                      </Tooltip>
                    </div>
                  </div>
                  {dateText && (
                    <div style={{ marginTop: 12, color: '#666' }}>Дата рождения: {dateText}</div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        <Modal
          title="Добавить ребёнка"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input placeholder="Имя ребёнка" value={childName} onChange={e => setChildName(e.target.value)} />
            <Input type="date" value={childBirth} onChange={e => setChildBirth(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setAddModalVisible(false)}>Отмена</Button>
              <Button type="primary" onClick={handleAddChild} loading={adding}>Добавить</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  const renderContent = () => {
    switch (active) {
      case "children":
        return renderChildrenTab();
      case "favorites":
        return <Text>Избранные специалисты пока не добавлены</Text>;
      case "review_moderation":
        return (
          <div style={{ paddingTop: 8 }}>
            <ReviewsModerationPanel cardStyle={{ background: "#fff" }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* tab headers */}
      <div style={{ display: "flex", borderBottom: "1px solid #e8e8e8", marginBottom: 16 }}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              color: active === tab.key ? "#1890ff" : undefined,
              borderBottom: active === tab.key ? "2px solid #1890ff" : "2px solid transparent",
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
