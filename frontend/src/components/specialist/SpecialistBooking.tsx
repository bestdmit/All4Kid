import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Calendar, Card, Checkbox, DatePicker, Form, Input, Modal, Radio, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ruRu from 'antd/es/date-picker/locale/ru_RU';
import type { Specialist } from '../../api/specialists.ts';
import { useSpecialistSlots } from '../../../hooks/bookings/useSpecialistSlots';
import { bookingsApi, type Slot } from '../../api/bookings';
import { useAuthStore } from '../../../stores/auth.store';
import { useBookingEventsStore } from '../../../stores/bookingEvents.store';
import './specialistBooking.css';

const { Text } = Typography;

const toDateValue = (value: any): Date => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date();
    }

    return date;
};

const toTime = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const toDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDateKeyFromValue = (value: any): string => {
    if (value && typeof value.format === 'function') {
        return value.format('YYYY-MM-DD');
    }

    return toDateKey(toDateValue(value));
};

const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
};

const toMonthLabel = (value: any): string => {
    if (!value) {
        return '';
    }

    const date = toDateValue(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const raw = new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric',
    }).format(date);

    return raw.charAt(0).toUpperCase() + raw.slice(1);
};

type DayPeriodKey = 'morning' | 'day' | 'evening';

const PERIOD_LABELS: Record<DayPeriodKey, string> = {
    morning: 'Утро',
    day: 'День',
    evening: 'Вечер',
};

const getDayPeriod = (iso: string): DayPeriodKey => {
    const hour = new Date(iso).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'day';
    return 'evening';
};

export const SpecialistBooking = ({ specialist }: { specialist: Specialist }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user, updateProfile } = useAuthStore();
    const { touchAppointments } = useBookingEventsStore();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [calendarError, setCalendarError] = useState<string | null>(null);
    const [allFutureSlots, setAllFutureSlots] = useState<Slot[]>([]);
    const [form] = Form.useForm();
    const childMode = Form.useWatch('childMode', form) as 'existing' | 'new' | undefined;

    const { loading, error, slots, refetch } = useSpecialistSlots(specialist.id, selectedDate);

    const selectedSlot = useMemo<Slot | null>(
        () => slots.find((slot) => slot.id === selectedSlotId) || null,
        [slots, selectedSlotId]
    );

    const groupedSlots = useMemo(() => {
        const groups: Record<DayPeriodKey, Slot[]> = {
            morning: [],
            day: [],
            evening: [],
        };

        slots.forEach((slot) => {
            groups[getDayPeriod(slot.starts_at)].push(slot);
        });

        return groups;
    }, [slots]);

    const availableDateKeys = useMemo(() => {
        const uniqueKeys = new Set(allFutureSlots.map((slot) => toDateKey(new Date(slot.starts_at))));
        return Array.from(uniqueKeys).sort();
    }, [allFutureSlots]);

    const availableDateSet = useMemo(() => new Set(availableDateKeys), [availableDateKeys]);
    const profileChildren = user?.children || [];

    const loadAllFutureSlots = useCallback(async () => {
        try {
            setCalendarLoading(true);
            setCalendarError(null);
            const result = await bookingsApi.getSpecialistSlots(specialist.id);
            setAllFutureSlots(result);
        } catch (e) {
            setCalendarError(e instanceof Error ? e.message : 'Не удалось загрузить календарь слотов');
            setAllFutureSlots([]);
        } finally {
            setCalendarLoading(false);
        }
    }, [specialist.id]);

    useEffect(() => {
        loadAllFutureSlots();
    }, [loadAllFutureSlots]);

    useEffect(() => {
        if (!availableDateKeys.length) {
            setSelectedSlotId(null);
            return;
        }

        const currentKey = toDateKey(selectedDate);
        if (availableDateSet.has(currentKey)) {
            return;
        }

        const firstAvailable = availableDateKeys[0].split('-').map(Number);
        setSelectedDate(new Date(firstAvailable[0], firstAvailable[1] - 1, firstAvailable[2]));
        setSelectedSlotId(null);
    }, [availableDateKeys, availableDateSet, selectedDate]);

    const onSelectDate = (value: any) => {
        setSelectedDate(toDateValue(value));
        setSelectedSlotId(null);
    };

    const openBookingModal = () => {
        if (!isAuthenticated) {
            message.info('Вы должны быть авторизованы, чтобы записаться');
            navigate('/auth');
            return;
        }

        if (!selectedSlot) {
            message.warning('Выберите свободное время');
            return;
        }

        const defaultMode: 'existing' | 'new' = profileChildren.length > 0 ? 'existing' : 'new';
        form.setFieldsValue({
            childMode: defaultMode,
            existingChildIndex: profileChildren.length > 0 ? '0' : undefined,
            saveNewChild: true,
            newChildName: '',
            newChildBirthDate: undefined,
            comment: '',
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const submitBooking = async () => {
        if (!selectedSlot) {
            message.warning('Выберите свободное время');
            return;
        }

        try {
            const values = await form.validateFields();
            setSubmitting(true);

            let childName = '';
            let childBirthDate: string | undefined;

            if (values.childMode === 'existing') {
                const childIndex = Number(values.existingChildIndex);
                const selectedChild = profileChildren[childIndex];

                if (!selectedChild) {
                    message.error('Выберите ребенка из списка');
                    setSubmitting(false);
                    return;
                }

                childName = selectedChild.name;
                childBirthDate = selectedChild.birthDate || undefined;
            } else {
                childName = String(values.newChildName || '').trim();
                childBirthDate = values.newChildBirthDate?.format?.('YYYY-MM-DD');

                if (!childName || childName.length < 2) {
                    message.error('Введите имя ребенка (минимум 2 символа)');
                    setSubmitting(false);
                    return;
                }
            }

            await bookingsApi.createAppointment(specialist.id, {
                slotId: selectedSlot.id,
                childName,
                childBirthDate,
                comment: values.comment,
            });

            if (values.childMode === 'new' && values.saveNewChild && user) {
                const existing = profileChildren.some((child) =>
                    child.name.trim().toLowerCase() === childName.trim().toLowerCase() &&
                    (child.birthDate || null) === (childBirthDate || null)
                );

                if (!existing) {
                    const success = await updateProfile({
                        children: [...profileChildren, { name: childName, birthDate: childBirthDate || null }],
                    });

                    if (!success) {
                        message.warning('Запись создана, но сохранить ребенка в профиль не удалось');
                    }
                }
            }

            message.success('Запись создана. Ожидайте подтверждения специалиста');
            touchAppointments();
            closeModal();
            setSelectedSlotId(null);
            await refetch();
            await loadAllFutureSlots();
        } catch (e: any) {
            if (e?.message === 'UNAUTHORIZED') {
                message.error('Сессия истекла. Войдите заново');
                navigate('/auth');
                return;
            }

            if (e?.errorFields) {
                return;
            }

            message.error(e instanceof Error ? e.message : 'Не удалось создать запись');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card
            className="booking-card"
            title="Выберите дату и время"
            style={{ borderRadius: 8, top: 0 }}
            styles={{ body: { padding: 14 } }}
        >
            <Space orientation="vertical" size={14} style={{ width: '100%' }} className="booking-content">
                <div className="booking-calendar-shell">
                    <Calendar
                        className="booking-calendar-clean"
                        locale={ruRu}
                        fullscreen={false}
                        style={{ width: '100%' }}
                        onSelect={onSelectDate}
                        headerRender={({ value, onChange }) => (
                            <div className="booking-calendar-header">
                                <Button
                                    type="text"
                                    className="booking-calendar-nav-btn"
                                    icon={<LeftOutlined />}
                                    onClick={() => onChange(value.clone().subtract(1, 'month'))}
                                />
                                <span className="booking-calendar-month-label">{toMonthLabel(value)}</span>
                                <Button
                                    type="text"
                                    className="booking-calendar-nav-btn"
                                    icon={<RightOutlined />}
                                    onClick={() => onChange(value.clone().add(1, 'month'))}
                                />
                            </div>
                        )}
                        disabledDate={(value) => {
                            const date = toDateValue(value);
                            if (isPastDate(date)) {
                                return true;
                            }

                            if (calendarLoading) {
                                return false;
                            }

                            const dateKey = getDateKeyFromValue(value);
                            return !availableDateSet.has(dateKey);
                        }}
                        fullCellRender={(current, info) => {
                            if (info.type !== 'date') {
                                return info.originNode;
                            }

                            const dateKey = getDateKeyFromValue(current);
                            const currentDate = toDateValue(current);
                            const isAvailable = availableDateSet.has(dateKey);
                            const selectedKey = toDateKey(selectedDate);
                            const isSelected = dateKey === selectedKey;
                            const isDisabled = isPastDate(currentDate) || (!calendarLoading && !isAvailable);

                            const dayNumber = typeof current?.date === 'function' ? current.date() : currentDate.getDate();

                            return (
                                <div
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: 15,
                                            color: isSelected ? '#ffffff' : isDisabled ? '#bfbfbf' : '#1f1f1f',
                                            backgroundColor: isSelected ? '#1677ff' : 'transparent',
                                            border: isSelected
                                                ? 'none'
                                                : '1px solid transparent',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {dayNumber}
                                    </div>
                                </div>
                            );
                        }}
                    />
                </div>

                {calendarLoading ? <Spin size="small" /> : null}
                {calendarError ? <Text type="danger">{calendarError}</Text> : null}
                {!calendarLoading && !calendarError && availableDateKeys.length === 0 ? (
                    <Text type="secondary">У специалиста сейчас нет актуальных свободных слотов</Text>
                ) : null}

                <div>
                    <Text strong style={{ display: 'block', marginBottom: 12 }} className="booking-time-title">
                        Доступное время
                    </Text>

                    {loading ? (
                        <Spin size="small" />
                    ) : error ? (
                        <Text type="danger">{error}</Text>
                    ) : slots.length === 0 ? (
                        <Text type="secondary">На выбранную дату свободных слотов нет</Text>
                    ) : (
                        <div className="booking-time-groups" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(['morning', 'day', 'evening'] as DayPeriodKey[])
                                .filter((period) => groupedSlots[period].length > 0)
                                .map((period) => (
                                    <div key={period} className="booking-time-group">
                                        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }} className="booking-time-label">
                                            {PERIOD_LABELS[period]}
                                        </Text>
                                        <div className="booking-time-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {groupedSlots[period].map((slot) => (
                                                <Button
                                                    className="booking-time-button"
                                                    key={slot.id}
                                                    type={selectedSlotId === slot.id ? 'primary' : 'default'}
                                                    onClick={() => setSelectedSlotId(slot.id)}
                                                >
                                                    {toTime(slot.starts_at)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {selectedSlot ? (
                    <Tag color="blue" style={{ marginRight: 0 }} className="booking-selected-slot">
                        Выбрано: {toTime(selectedSlot.starts_at)} - {toTime(selectedSlot.ends_at)}
                    </Tag>
                ) : null}

                {!isAuthenticated ? (
                    <Text type="warning">Вы должны быть авторизованы, чтобы записаться</Text>
                ) : null}

                <Button
                    className="booking-submit-btn"
                    type="primary"
                    size="large"
                    block
                    disabled={isAuthenticated && !selectedSlot}
                    onClick={openBookingModal}
                    style={{
                        backgroundColor: '#9370DB',
                        borderColor: '#9370DB',
                    }}
                >
                    Записаться
                </Button>
            </Space>

            <Modal
                title="Подтвердить запись"
                open={isModalOpen}
                onCancel={closeModal}
                onOk={submitBooking}
                okText="Записаться"
                cancelText="Отмена"
                confirmLoading={submitting}
                destroyOnClose
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>
                        <strong>Специалист:</strong> {specialist.name}
                    </Text>
                    <Text>
                        <strong>Время:</strong> {selectedSlot ? `${toTime(selectedSlot.starts_at)} - ${toTime(selectedSlot.ends_at)}` : '-'}
                    </Text>
                    <Text>
                        <strong>Стоимость:</strong> {Number(selectedSlot?.price ?? specialist.price_per_hour).toLocaleString('ru-RU')} руб.
                    </Text>

                    <Form form={form} layout="vertical" initialValues={{ childName: '', comment: '' }}>
                        <Form.Item label="Ребенок" name="childMode" initialValue={profileChildren.length > 0 ? 'existing' : 'new'}>
                            <Radio.Group
                                options={[
                                    { label: 'Выбрать из профиля', value: 'existing', disabled: profileChildren.length === 0 },
                                    { label: 'Добавить нового ребенка', value: 'new' },
                                ]}
                            />
                        </Form.Item>

                        {childMode === 'existing' ? (
                            <Form.Item
                                label="Выберите ребенка"
                                name="existingChildIndex"
                                rules={[{ required: true, message: 'Выберите ребенка' }]}
                            >
                                <Select
                                    placeholder="Выберите ребенка"
                                    options={profileChildren.map((child, index) => ({
                                        value: String(index),
                                        label: child.birthDate
                                            ? `${child.name} (${new Date(child.birthDate).toLocaleDateString('ru-RU')})`
                                            : child.name,
                                    }))}
                                />
                            </Form.Item>
                        ) : (
                            <>
                                <Form.Item
                                    label="Имя ребенка"
                                    name="newChildName"
                                    rules={[
                                        { required: true, message: 'Введите имя ребенка' },
                                        { min: 2, message: 'Слишком короткое имя' },
                                    ]}
                                >
                                    <Input placeholder="Например, Мария" maxLength={255} />
                                </Form.Item>

                                <Form.Item label="Дата рождения ребенка" name="newChildBirthDate">
                                    <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                                </Form.Item>

                                <Form.Item name="saveNewChild" valuePropName="checked" initialValue={true}>
                                    <Checkbox>Сохранить ребенка в моем профиле</Checkbox>
                                </Form.Item>
                            </>
                        )}

                        <Form.Item label="Комментарий" name="comment">
                            <Input.TextArea rows={3} placeholder="Пожелания к занятию" maxLength={1000} />
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </Card>
    );
};