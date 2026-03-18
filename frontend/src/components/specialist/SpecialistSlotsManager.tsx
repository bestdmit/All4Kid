import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, List, Popconfirm, Space, Tag, Typography, message } from 'antd';
import type { Specialist } from '../../api/specialists';
import { bookingsApi, type Slot } from '../../api/bookings';

const { Text } = Typography;

const toDateTimeLocal = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatSlotDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface SpecialistSlotsManagerProps {
  specialist: Specialist;
}

export default function SpecialistSlotsManager({ specialist }: SpecialistSlotsManagerProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form] = Form.useForm();

  const defaultStart = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return toDateTimeLocal(now);
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.getSpecialistSlots(specialist.id);
      setSlots(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка при загрузке слотов');
    } finally {
      setLoading(false);
    }
  }, [specialist.id]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    form.setFieldsValue({
      startsAt: defaultStart,
      durationMinutes: 60,
      price: specialist.price_per_hour,
    });
  }, [form, defaultStart, specialist.price_per_hour]);

  const onCreateSlot = async () => {
    try {
      const values = await form.validateFields();
      const startsAt = new Date(values.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        message.error('Некорректная дата начала');
        return;
      }

      if (startsAt <= new Date()) {
        message.error('Нельзя создать слот в прошлом');
        return;
      }

      const durationMinutes = Number(values.durationMinutes);
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

      setCreating(true);
      await bookingsApi.createSpecialistSlot(specialist.id, {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        price: Number(values.price),
      });

      message.success('Слот создан');
      await fetchSlots();
    } catch (e: any) {
      if (e?.errorFields) return;
      if (e?.message === 'UNAUTHORIZED') {
        message.error('Недостаточно прав. Войдите под аккаунтом специалиста');
        return;
      }
      message.error(e instanceof Error ? e.message : 'Ошибка при создании слота');
    } finally {
      setCreating(false);
    }
  };

  const onDeleteSlot = async (slotId: number) => {
    try {
      setDeletingSlotId(slotId);
      await bookingsApi.deleteSpecialistSlot(specialist.id, slotId);
      message.success('Слот удален');
      await fetchSlots();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка при удалении слота');
    } finally {
      setDeletingSlotId(null);
    }
  };

  return (
    <Card
      size="small"
      title={`Расписание: ${specialist.specialty}`}
      extra={<Tag>{specialist.name}</Tag>}
      style={{ marginTop: 16 }}
      loading={loading}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start" wrap>
            <Form.Item
              label="Начало"
              name="startsAt"
              rules={[{ required: true, message: 'Укажите дату и время' }]}
              style={{ minWidth: 240 }}
            >
              <Input type="datetime-local" />
            </Form.Item>

            <Form.Item
              label="Длительность (мин)"
              name="durationMinutes"
              rules={[
                { required: true, message: 'Укажите длительность' },
                {
                  validator: (_, value) => {
                    const minutes = Number(value);
                    if (!Number.isFinite(minutes) || minutes < 30 || minutes > 240) {
                      return Promise.reject(new Error('От 30 до 240 минут'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              style={{ minWidth: 180 }}
            >
              <Input type="number" min={30} max={240} step={15} />
            </Form.Item>

            <Form.Item
              label="Цена"
              name="price"
              rules={[{ required: true, message: 'Укажите цену' }]}
              style={{ minWidth: 180 }}
            >
              <Input type="number" min={0} step={100} />
            </Form.Item>

            <Form.Item label=" " style={{ marginBottom: 0 }}>
              <Button type="primary" onClick={onCreateSlot} loading={creating}>
                Добавить слот
              </Button>
            </Form.Item>
          </Space>
        </Form>

        <div>
          <Text strong>Свободные слоты</Text>
          <List
            style={{ marginTop: 8 }}
            bordered
            locale={{ emptyText: 'Слотов пока нет' }}
            dataSource={slots}
            renderItem={(slot) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key={`delete-${slot.id}`}
                    title="Удалить слот?"
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => onDeleteSlot(slot.id)}
                  >
                    <Button danger loading={deletingSlotId === slot.id}>
                      Удалить
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size={2}>
                  <Text>{formatSlotDateTime(slot.starts_at)} - {formatSlotDateTime(slot.ends_at)}</Text>
                  <Text type="secondary">{Number(slot.price).toLocaleString('ru-RU')} руб.</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </Space>
    </Card>
  );
}
