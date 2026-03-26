import { useEffect, useState } from "react";
import { Button, message, Input, Typography, Card, Row, Col, Avatar, Modal, Tooltip, Empty, Select } from "antd";
import { Link } from "react-router-dom";
import type { User } from "../stores/auth.store";
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { bookingsApi, type Appointment } from "./api/bookings";
import { specialistApi } from "./api/specialists";
import { useBookingEventsStore } from "../stores/bookingEvents.store";
import ReviewsModerationPanel from "./components/admin/ReviewsModerationPanel";
import "./profileTabs.css";

const { Text } = Typography;
const { Option } = Select;

interface ProfileTabsProps {
  user: User;
  updateProfile: (data: any) => Promise<boolean>;
}

const allTabs = [
  { key: "children", label: "Мои дети", roles: ['user', 'specialist', 'admin'] },
  { key: "appointments", label: "Мои записи", roles: ['user', 'specialist', 'admin'] },
  { key: "incoming", label: "Записи к моим услугам", roles: ['specialist', 'admin'] },
  { key: "admin_incoming", label: "Все записи (Админ)", roles: ['admin'] },
  { key: "favorites", label: "Избранное", roles: ['user', 'specialist', 'admin'] },
  { key: "review_moderation", label: "Модерация отзывов", roles: ['admin'] },
];

const statusLabel: Record<Appointment['status'], string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  cancelled_by_parent: 'Отменена родителем',
  cancelled_by_specialist: 'Отменена специалистом',
  completed: 'Завершена',
  no_show: 'Неявка',
};

const getStatusLabel = (appointment: Appointment) => {
  if (appointment.status === 'cancelled_by_specialist' && appointment.cancel_reason === 'cancelled_by_admin') {
    return 'Отменена администратором';
  }

  return statusLabel[appointment.status];
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

const isTerminalStatus = (status: Appointment['status']) => {
  return status === 'completed' || status === 'cancelled_by_parent' || status === 'cancelled_by_specialist' || status === 'no_show';
};

const toInputDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isFutureDateValue = (value: string): boolean => {
  if (!value) return false;

  const selectedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate.getTime() > today.getTime();
};

export default function ProfileTabs({ user, updateProfile }: ProfileTabsProps) {
  const [active, setActive] = useState<string>("children");
  const { appointmentsVersion } = useBookingEventsStore();
  const maxBirthDate = toInputDateValue(new Date());

  const [childName, setChildName] = useState("");
  const [childBirth, setChildBirth] = useState("");
  const [adding, setAdding] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [editChildName, setEditChildName] = useState("");
  const [editChildBirth, setEditChildBirth] = useState("");
  const [editing, setEditing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [incomingAppointments, setIncomingAppointments] = useState<Appointment[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null);
  const [hidingAppointmentId, setHidingAppointmentId] = useState<number | null>(null);

  const [mySpecialists, setMySpecialists] = useState<any[]>([]);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number | null>(null);

  const availableTabs = allTabs.filter(tab => tab.roles.includes(user.role));

  const loadMySpecialists = async () => {
    try {
      const data = await specialistApi.getMySpecialists();
      setMySpecialists(data);
    } catch (err) {
      console.error('Не удалось загрузить специалистов пользователя', err);
    }
  };

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

  const loadIncomingAppointments = async (asAdmin = false) => {
    try {
      setLoadingAppointments(true);
      const data = await bookingsApi.getMySpecialistAppointments(asAdmin);
      if (asAdmin) {
        setAdminAppointments(data);
      } else {
        setIncomingAppointments(data);
      }
    } catch (err: any) {
      message.error(err?.message || 'Не удалось загрузить входящие записи');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const changeAppointmentStatus = async (appointmentId: number, status: Appointment['status'], isIncoming: boolean, isAdminView = false) => {
    try {
      setUpdatingAppointmentId(appointmentId);
      await bookingsApi.updateAppointmentStatus(appointmentId, status);
      message.success('Статус записи обновлен');
      if (isIncoming) {
        if (isAdminView) {
          await loadIncomingAppointments(true);
        } else {
          await loadIncomingAppointments(false);
        }
      } else {
        await loadMyAppointments();
      }
    } catch (err: any) {
      message.error(err?.message || 'Не удалось обновить статус записи');
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const hideAppointment = async (appointmentId: number, isIncoming: boolean, isAdminView = false) => {
    try {
      setHidingAppointmentId(appointmentId);
      await bookingsApi.hideAppointment(appointmentId);
      message.success('Запись скрыта');
      
      if (isIncoming) {
        if (isAdminView) {
          setAdminAppointments((prev) => prev.filter(a => a.id !== appointmentId));
        } else {
          setIncomingAppointments((prev) => prev.filter(a => a.id !== appointmentId));
        }
      } else {
        setAppointments((prev) => prev.filter(a => a.id !== appointmentId));
      }
    } catch (err: any) {
      message.error(err?.message || 'Не удалось скрыть запись');
    } finally {
      setHidingAppointmentId(null);
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) {
      message.error("Введите имя ребенка");
      return;
    }

    if (childBirth && isFutureDateValue(childBirth)) {
      message.error('Дата рождения не может быть в будущем');
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

  const handleOpenEditChild = (index: number) => {
    const children = user.children || [];
    const child = children[index];
    if (!child) return;

    setEditingChildIndex(index);
    setEditChildName(String(child.name || ''));
    setEditChildBirth(child.birthDate || '');
    setEditModalVisible(true);
  };

  const handleSaveEditedChild = async () => {
    if (editingChildIndex === null) return;

    const trimmedName = editChildName.trim();
    if (!trimmedName) {
      message.error('Введите имя ребенка');
      return;
    }

    if (editChildBirth && isFutureDateValue(editChildBirth)) {
      message.error('Дата рождения не может быть в будущем');
      return;
    }

    const current = user.children || [];
    if (!current[editingChildIndex]) {
      message.error('Ребенок не найден');
      return;
    }

    const newChildren = current.map((child, index) => {
      if (index !== editingChildIndex) return child;

      return {
        name: trimmedName,
        birthDate: editChildBirth || null,
      };
    });

    try {
      setEditing(true);
      const ok = await updateProfile({ children: newChildren });
      if (ok) {
        message.success('Данные ребенка обновлены');
        setEditModalVisible(false);
        setEditingChildIndex(null);
        setEditChildName('');
        setEditChildBirth('');
      } else {
        message.error('Не удалось сохранить изменения');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || 'Ошибка при сохранении');
    } finally {
      setEditing(false);
    }
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
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEditChild(idx)} />
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
            <Input type="date" max={maxBirthDate} value={childBirth} onChange={e => setChildBirth(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setAddModalVisible(false)}>Отмена</Button>
              <Button type="primary" onClick={handleAddChild} loading={adding}>Добавить</Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="Редактировать ребёнка"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingChildIndex(null);
            setEditChildName('');
            setEditChildBirth('');
          }}
          footer={null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input placeholder="Имя ребёнка" value={editChildName} onChange={e => setEditChildName(e.target.value)} />
            <Input type="date" max={maxBirthDate} value={editChildBirth} onChange={e => setEditChildBirth(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingChildIndex(null);
                setEditChildName('');
                setEditChildBirth('');
              }}>
                Отмена
              </Button>
              <Button type="primary" onClick={handleSaveEditedChild} loading={editing}>
                Сохранить
              </Button>
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
      loadIncomingAppointments(false);
      loadMySpecialists();
    }

    if (active === 'admin_incoming' && user.role === 'admin') {
      loadIncomingAppointments(true);
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

            {appointments.length === 0 && (
              <Empty description="Записей пока нет" style={{ marginTop: 48 }} />
            )}

            <Row gutter={[16, 16]}>
              {appointments.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Link to={`/specialists/${a.specialist_id}`} target="_blank" style={{ fontWeight: 'bold' }}>
                        {a.specialist_name || `Специалист #${a.specialist_id}`}
                      </Link>
                      <Text style={{ color: statusColor[a.status] }}>{getStatusLabel(a)}</Text>
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

                    {isTerminalStatus(a.status) && (
                      <div style={{ marginTop: 12 }}>
                        <Button
                          loading={hidingAppointmentId === a.id}
                          onClick={() => hideAppointment(a.id, false, false)}
                        >
                          Убрать
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
          return <Text>Вкладка доступна только специалисту</Text>;
        }

        const filteredIncoming = selectedSpecialistId 
          ? incomingAppointments.filter(a => a.specialist_id === selectedSpecialistId)
          : incomingAppointments;

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ fontSize: 18 }}>Входящие записи родителей</Text>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Select
                  style={{ width: 250 }}
                  placeholder="Фильтр по специалисту"
                  allowClear
                  value={selectedSpecialistId}
                  onChange={(val) => setSelectedSpecialistId(val)}
                >
                  {mySpecialists.map((s: any) => (
                    <Option key={s.id} value={s.id}>{s.name} ({s.specialty})</Option>
                  ))}
                </Select>
                <Button onClick={() => loadIncomingAppointments(false)} loading={loadingAppointments}>Обновить</Button>
              </div>
            </div>

            {filteredIncoming.length === 0 && (
              <Empty description="Входящих записей пока нет" style={{ marginTop: 48 }} />
            )}


            <Row gutter={[16, 16]}>
              {filteredIncoming.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{a.parent_name || `Пользователь #${a.parent_user_id}`}</Text>
                      <Text style={{ color: statusColor[a.status] }}>{getStatusLabel(a)}</Text>
                    </div>
                    {a.parent_phone ? (
                      <div><Text type="secondary">Телефон родителя:</Text> <Text>{a.parent_phone}</Text></div>
                    ) : null}
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

                      {isTerminalStatus(a.status) && (
                        <Button
                          loading={hidingAppointmentId === a.id}
                          onClick={() => hideAppointment(a.id, true, false)}
                        >
                          Убрать
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case "admin_incoming":
        if (user.role !== 'admin') {
          return null;
        }

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ fontSize: 18 }}>Все записи (Администрирование)</Text>
              <Button onClick={() => loadIncomingAppointments(true)} loading={loadingAppointments}>Обновить</Button>
            </div>

            {adminAppointments.length === 0 && (
              <Empty description="Записей пока нет" style={{ marginTop: 48 }} />
            )}

            <Row gutter={[16, 16]}>
              {adminAppointments.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{a.parent_name || `Пользователь #${a.parent_user_id}`}</Text>
                      <Text style={{ color: statusColor[a.status] }}>{getStatusLabel(a)}</Text>
                    </div>
                    <div><Text type="secondary">К кому:</Text> <Link to={`/specialists/${a.specialist_id}`} target="_blank">{a.specialist_name || `Специалист #${a.specialist_id}`}</Link></div>
                    <div><Text type="secondary">Кто записался:</Text> <Text>{a.parent_name || `Пользователь #${a.parent_user_id}`}</Text></div>
                    {a.parent_phone ? (
                      <div><Text type="secondary">Телефон родителя или заказчика:</Text> <Text>{a.parent_phone}</Text></div>
                    ) : null}
                     {a.specialist_id && (
                      <div><Text type="secondary">Телефон специалиста:</Text> <Text>{a.specialist_phone || '-'}</Text></div>
                    )}
                    <div><Text type="secondary">Время:</Text> <Text>{formatDateTime(a.starts_at)} - {formatDateTime(a.ends_at)}</Text></div>
                    <div><Text type="secondary">Ребенок:</Text> <Text>{a.child_name}</Text></div>
                    <div><Text type="secondary">Комментарий:</Text> <Text>{a.comment || '-'}</Text></div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {a.status === 'pending' && (
                        <Button
                          type="primary"
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'confirmed', true, true)}
                        >
                          Подтвердить
                        </Button>
                      )}

                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <Button
                          danger
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'cancelled_by_specialist', true, true)}
                        >
                          Отменить
                        </Button>
                      )}

                      {a.status === 'confirmed' && (
                        <Button
                          loading={updatingAppointmentId === a.id}
                          onClick={() => changeAppointmentStatus(a.id, 'completed', true, true)}
                        >
                          Завершить
                        </Button>
                      )}

                      {isTerminalStatus(a.status) && (
                        <Button
                          loading={hidingAppointmentId === a.id}
                          onClick={() => hideAppointment(a.id, true, true)}
                        >
                          Убрать
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
      <div className="profile-tabs-header" style={{ display: "flex", borderBottom: "1px solid #e8e8e8", marginBottom: 16 }}>
        {availableTabs.map((tab) => (
          <div
            key={tab.key}
            className={`profile-tabs-tab ${active === tab.key ? "is-active" : ""}`}
            onClick={() => {
              setActive(tab.key);
              if (tab.key === 'appointments') {
                loadMyAppointments();
              }
              if (tab.key === 'incoming') {
                loadIncomingAppointments(false);
                loadMySpecialists();
              }
              if (tab.key === 'admin_incoming') {
                loadIncomingAppointments(true);
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
