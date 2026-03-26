import { useEffect, useState } from "react";
import { Card, Space, message } from "antd";
import { EnvironmentOutlined, HeartFilled, HeartOutlined, StarFilled } from "@ant-design/icons";
import type {Specialist} from "../../api/specialists.ts";
import { Typography } from 'antd';
import { favoritesApi } from "../../api/favorites.ts";
import { useAuth } from "../../../hooks/useAuth.ts";

const { Title, Text } = Typography;

export const SpecialistMainInfoCard = ({specialist} : {specialist: Specialist}) => {
    const { isAuthenticated } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadFavoriteStatus = async () => {
            if (!isAuthenticated) {
                setIsFavorite(false);
                return;
            }

            try {
                const status = await favoritesApi.getFavoriteStatus(specialist.id);
                if (!cancelled) {
                    setIsFavorite(status);
                }
            } catch {
                if (!cancelled) {
                    setIsFavorite(false);
                }
            }
        };

        loadFavoriteStatus();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, specialist.id]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            message.info('Войдите в аккаунт, чтобы добавить специалиста в избранное');
            return;
        }

        try {
            setFavoriteLoading(true);
            if (isFavorite) {
                await favoritesApi.removeFavorite(specialist.id);
                setIsFavorite(false);
                message.success('Специалист удален из избранного');
            } else {
                await favoritesApi.addFavorite(specialist.id);
                setIsFavorite(true);
                message.success('Специалист добавлен в избранное');
            }
        } catch (error: any) {
            if (error?.message === 'UNAUTHORIZED') {
                message.info('Войдите в аккаунт, чтобы добавить специалиста в избранное');
                return;
            }
            message.error(error?.message || 'Не удалось изменить избранное');
        } finally {
            setFavoriteLoading(false);
        }
    };

    const avatarSrc = specialist.avatar_url && specialist.avatar_url.trim()
        ? specialist.avatar_url
        : '/uploads/avatars/default.jpg';

    return (
        <Card
            className="specialist-main-card"
            styles={{
                body: {
                    display: "flex",
                    justifyContent: "space-around"
                }
            }}
        >
            <img
                src={avatarSrc}
                alt={specialist.name}
                className="specialist-main-avatar"
                onError={(e) => {
                    e.currentTarget.src = '/uploads/avatars/default.jpg';
                }}
            />

            <div className="specialist-main-meta">
                <Space className="specialist-main-title-row" style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }}>
                    <div>
                        <Title level={5} className="specialist-main-name" style={{ margin: 0 }}>
                            {specialist?.name}
                        </Title>
                        <Text type="secondary" className="specialist-main-specialty" style={{ margin: 0 }}>
                            {specialist?.specialty}
                        </Text>
                    </div>
                    {isFavorite ? (
                        <HeartFilled
                            className="specialist-main-favorite"
                            style={{ color: '#E31b23', cursor: favoriteLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', opacity: favoriteLoading ? 0.6 : 1 }}
                            onClick={favoriteLoading ? undefined : handleToggleFavorite}
                        />
                    ) : (
                        <HeartOutlined
                            className="specialist-main-favorite"
                            style={{ color: '#E31b23', cursor: favoriteLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', opacity: favoriteLoading ? 0.6 : 1 }}
                            onClick={favoriteLoading ? undefined : handleToggleFavorite}
                        />
                    )}
                </Space>

                <Space orientation="vertical" size={4} className="specialist-main-details">
                    <Space>
                        <EnvironmentOutlined className="specialist-main-icon" style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" className="specialist-main-detail-text">{specialist?.location}</Text>
                    </Space>

                    <Space>
                        <StarFilled className="specialist-main-icon" style={{ color: '#FFD700' }} />
                        <Text strong className="specialist-main-detail-text">{specialist?.rating}</Text>
                        <Text type="secondary" className="specialist-main-detail-text">
                            {(specialist?.reviews_total ?? 0)} отзывов
                        </Text>
                    </Space>
                </Space>
            </div>
        </Card>
    )
}