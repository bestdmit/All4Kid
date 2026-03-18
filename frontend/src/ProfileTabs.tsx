import { useEffect, useState } from "react";
import { Button, message, Input, Typography, Card, Row, Col, Avatar, Modal, Tooltip } from "antd";
import type { User } from "../stores/auth.store";
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { bookingsApi, type Appointment } from "./api/bookings";
import { useBookingEventsStore } from "../stores/bookingEvents.store";

const { Text } = Typography;

interface ProfileTabsProps {
  user: User;
  updateProfile: (data: any) => Promise<boolean>;
}

const tabs = [
  { key: "children", label: "Мои дети" },
  { key: "appointments", label: "Мои записи" },
  { key: "incoming", label: "Записи к моим услугам" },
  { key: "favorites", label: "Избранное" },
];

const statusLabel: Record<Appointment['status'], string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  cancelled_by_parent: 'Отменена родителем',
  cancelled_by_specialist: 'Отменена специалистом',
  completed: 'Завершена',
  no_show: 'Неявка',
};

const statusColor: Record<Appointment['status'], string> = {
  pending: '#faad14',
  confirmed: '#52c41a',
  cancelled_by_parent: '#ff4d4f',
  cancelled_by_specialist: '#cf1322',
  completed: '#1677ff',
  no_show: '#595959',
};

const formatDateTime = (iso: string | undefined) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ProfileTabs({ user, updateProfile }: ProfileTabsProps) {
  const [active, setActive] = useState<string>(tabs[0].key);
  const { appointmentsVersion } = useBookingEventsStore();

  const [childName, setChildName] = useState("");
  const [childBirth, setChildBirth] = useState("");
  const [adding, setAdding] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [incomingAppointments, setIncomingAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null);

  const loadMyAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const data = await bookingsApi.getMyAppointments();
      setAppointments(data);
    } catch (err: any) {
      message.error(err?.message || 'Не удалось загрузить ваши записи');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadIncomingAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const data = await bookingsApi.getMySpecialistAppointments();
      setIncomingAppointments(data);
    } catch (err: any) {
      message.error(err?.message || 'Не удалось загрузить входящие записи');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const changeAppointmentStatus = async (appointmentId: number, status: Appointment['status'], isIncoming: boolean) => {
    try {
      setUpdatingAppointmentId(appointmentId);
      await bookingsApi.updateAppointmentStatus(appointmentId, status);
      message.success('Статус записи обновлен');
      if (isIncoming) {
        await loadIncomingAppointments();
      } else {
        await loadMyAppointments();
      }
    } catch (err: any) {
      message.error(err?.message || 'Не удалось обновить статус записи');
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

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

  useEffect(() => {
    if (active === 'appointments') {
      loadMyAppointments();
    }

    if (active === 'incoming' && (user.role === 'specialist' || user.role === 'admin')) {
      loadIncomingAppointments();
    }
  }, [appointmentsVersion, active, user.role]);

  const renderContent = () => {
    switch (active) {
      case "children":
        return renderChildrenTab();
      case "appointments":
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ fontSize: 18 }}>Мои записи к специалистам</Text>
              <Button onClick={loadMyAppointments} loading={loadingAppointments}>Обновить</Button>
            </div>

            <Row gutter={[16, 16]}>
              {appointments.length === 0 && (
                <Col span={24}><Text>Записей пока нет</Text></Col>
              )}

              {appointments.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{a.specialist_name || `Специалист #${a.specialist_id}`}</Text>
                      <Text style={{ color: statusColor[a.status] }}>{statusLabel[a.status]}</Text>
                    </div>
                    <div><Text type="secondary">Время:</Text> <Text>{formatDateTime(a.starts_at)} - {formatDateTime(a.ends_at)}</Text></div>
                    <div><Text type="secondary">Ребенок:</Text> <Text>{a.child_name}</Text></div>
                    <div><Text type="secondary">Комментарий:</Text> <Text>{a.comment || '-'}</Text></div>

                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <div style={{ marginTop: 12 }}>
                        <Button
                          danger
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'cancelled_by_parent', false)}
                        >
                          Отменить запись
                        </Button>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case "incoming":
        if (user.role !== 'specialist' && user.role !== 'admin') {
          return <Text>Вкладка доступна только специалисту или администратору</Text>;
        }

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ fontSize: 18 }}>Входящие записи родителей</Text>
              <Button onClick={loadIncomingAppointments} loading={loadingAppointments}>Обновить</Button>
            </div>

            <Row gutter={[16, 16]}>
              {incomingAppointments.length === 0 && (
                <Col span={24}><Text>Входящих записей пока нет</Text></Col>
              )}

              {incomingAppointments.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{a.specialist_name || `Специалист #${a.specialist_id}`}</Text>
                      <Text style={{ color: statusColor[a.status] }}>{statusLabel[a.status]}</Text>
                    </div>
                    <div><Text type="secondary">Время:</Text> <Text>{formatDateTime(a.starts_at)} - {formatDateTime(a.ends_at)}</Text></div>
                    <div><Text type="secondary">Ребенок:</Text> <Text>{a.child_name}</Text></div>
                    <div><Text type="secondary">Комментарий:</Text> <Text>{a.comment || '-'}</Text></div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {a.status === 'pending' && (
                        <Button
                          type="primary"
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'confirmed', true)}
                        >
                          Подтвердить
                        </Button>
                      )}

                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <Button
                          danger
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'cancelled_by_specialist', true)}
                        >
                          Отменить
                        </Button>
                      )}

                      {a.status === 'confirmed' && (
                        <Button
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'completed', true)}
                        >
                          Завершить
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case "favorites":
        return <Text>Избранные специалисты пока не добавлены</Text>;
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
            onClick={() => {
              setActive(tab.key);
              if (tab.key === 'appointments') {
                loadMyAppointments();
              }
              if (tab.key === 'incoming') {
                loadIncomingAppointments();
              }
            }}
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
