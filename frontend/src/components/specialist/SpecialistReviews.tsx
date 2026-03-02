import { Card, Typography, Space, Avatar, Button } from 'antd';
import {StarFilled, StarOutlined} from '@ant-design/icons';
import type {Specialist} from "../../api/specialists.ts";

const { Title, Text, Paragraph } = Typography;

const SpecialistReviews = ({specialist} : {specialist: Specialist}) => {
    //TODO: Хук для получения отзывов по id специалиста
    const reviews = [
        {
            id: 1,
            name: 'Евгения',
            date: '20 января 2025',
            rating: 5,
            avatar: 'Е',
            color: '#52c41a',
            text: 'Готовились к ОГЭ всего 3 месяца, но результат превзошел ожидания — 5 баллов. Дмитрий умеет заинтересовать математикой даже тех, кто её не любит.'
        },
        {
            id: 2,
            name: 'Анна',
            date: '15 января 2025',
            rating: 5,
            avatar: 'А',
            color: '#1890ff',
            text: 'Занимаемся уже год. Дочь поступила в физмат класс благодаря Дмитрию. Профессионал своего дела, внимательный и терпеливый преподаватель.'
        },
        {
            id: 3,
            name: 'Сергей',
            date: '10 января 2025',
            rating: 4,
            avatar: 'С',
            color: '#13c2c2',
            text: 'Хороший репетитор, знает своё дело. Единственное — иногда приходится долго ждать свободного слота для записи, так как очень популярный.'
        }
    ];

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(
                    <StarFilled
                        key={i}
                        style={{ fontSize: 14, color: '#faad14', marginRight: 2 }}
                    />
                );
            } else {
                stars.push(
                    <StarOutlined
                        key={i}
                        style={{ fontSize: 14, color: '#d9d9d9', marginRight: 2 }}
                    />
                );
            }
        }
        return stars;
    };

    return (
        <Card
            style={{ borderRadius: 8, marginTop: 16 }}
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
                    Отзывы (157)
                </Title>
                {/*TODO: открытие модального окна с отзывами */}
                <Button
                    type="link"
                    style={{
                        color: '#52c41a',
                        fontSize: 24,
                        padding: 0
                    }}
                >
                    Написать отзыв
                </Button>
            </div>

            {/* Reviews List */}
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                {reviews.map((review) => (
                    <div key={review.id}>
                        <Space align="start">
                            {/* Avatar */}
                            <Avatar
                                size={40}
                                style={{
                                    backgroundColor: review.color,
                                    fontSize: 16
                                }}
                            >
                                {review.avatar}
                            </Avatar>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                {/* Name and Date */}
                                <div style={{ marginBottom: 4 }}>
                                    <Text strong style={{ fontSize: 20 }}>{review.name}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 14 }}>{review.date}</Text>
                                </div>

                                {/* Rating */}
                                <div style={{ marginBottom: 8 }}>
                                    {renderStars(review.rating)}
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
                                    {review.text}
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
        </Card>
    );
};

export default SpecialistReviews;