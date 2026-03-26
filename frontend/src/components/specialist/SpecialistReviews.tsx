import { useState } from "react";
import { Card, Typography, Space, Avatar, Button, Modal, Form, Input, Rate, message } from 'antd';
import type {Specialist} from "../../api/specialists.ts";
import { useSpecialistReviews } from "../../../hooks/reviews/useSpecialistReviews";
import { reviewsApi } from "../../api/reviews";
import { useAuthStore } from "../../../stores/auth.store";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const SpecialistReviews = ({specialist} : {specialist: Specialist}) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { reviews, total, error, refetch } = useSpecialistReviews(specialist.id);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const openModal = () => {
        if (!isAuthenticated) {
            message.info("Чтобы оставить отзыв, войдите в аккаунт");
            navigate("/auth");
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const res = await reviewsApi.createForSpecialist(specialist.id, {
                rating: values.rating,
                comment: values.comment,
            });

            if (!res.success) {
                throw new Error(res.message || "Не удалось отправить отзыв");
            }

            message.success("Отзыв отправлен");
            closeModal();
            await refetch();
        } catch (e: any) {
            if (e?.message === "UNAUTHORIZED") {
                message.error("Сессия истекла. Войдите заново");
                navigate("/auth");
                return;
            }
            if (e?.errorFields) return; // antd validation
            message.error(e instanceof Error ? e.message : "Ошибка при отправке отзыва");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    };

    return (
        <Card
            style={{ borderRadius: 8, marginTop: 16, width: '100%' }}
            styles={{ body: { padding: 20} }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
            }}>
                <Title level={4} style={{ margin: 0, fontSize: 32 }}>
                    Отзывы ({total})
                </Title>
                <Button
                    type="link"
                    style={{
                        color: '#52c41a',
                        fontSize: 24,
                        padding: 0
                    }}
                    onClick={openModal}
                >
                    Написать отзыв
                </Button>
            </div>

            {error ? (
                <Text type="danger">{error}</Text>
            ) : null}

            {/* Reviews List */}
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                {reviews.map((review) => (
                    <div key={review.id}>
                        <Space align="start">
                            {/* Avatar */}
                            <Avatar
                                size={40}
                                style={{
                                    backgroundColor: '#1890ff',
                                    fontSize: 16
                                }}
                            >
                                {(review.user_name || "U").trim().slice(0, 1).toUpperCase()}
                            </Avatar>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                {/* Name and Date */}
                                <div style={{ marginBottom: 4 }}>
                                    <Text strong style={{ fontSize: 20 }}>{review.user_name || `Пользователь #${review.user_id}`}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 14 }}>{formatDate(review.created_at)}</Text>
                                </div>

                                {/* Rating */}
                                <div style={{ marginBottom: 8 }}>
                                    <Rate disabled value={review.rating} />
                                </div>

                                {/* Review Text */}
                                <Paragraph
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        color: '#262626'
                                    }}
                                >
                                    {review.comment}
                                </Paragraph>
                            </div>
                        </Space>

                        {/* Divider (except for last item) */}
                        {review.id !== reviews.length && (
                            <div style={{
                                borderBottom: '1px solid #f0f0f0',
                                marginTop: 20
                            }} />
                        )}
                    </div>
                ))}
            </Space>

            <Modal
                title="Написать отзыв"
                open={isModalOpen}
                onCancel={closeModal}
                onOk={onSubmit}
                okText="Отправить"
                cancelText="Отмена"
                confirmLoading={submitting}
                destroyOnClose
            >
                <Form form={form} layout="vertical" initialValues={{ rating: 5, comment: "" }}>
                    <Form.Item
                        label="Оценка"
                        name="rating"
                        rules={[{ required: true, message: "Поставьте оценку" }]}
                    >
                        <Rate />
                    </Form.Item>
                    <Form.Item
                        label="Комментарий"
                        name="comment"
                        rules={[
                            { required: true, message: "Напишите комментарий" },
                            { min: 5, message: "Комментарий слишком короткий" },
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Поделитесь впечатлениями" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default SpecialistReviews;