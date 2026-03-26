import {Card, Space} from "antd";
import {EnvironmentOutlined, HeartOutlined, StarFilled} from "@ant-design/icons";
import type {Specialist} from "../../api/specialists.ts";
import { Typography } from 'antd';

const { Title, Text } = Typography;

export const SpecialistMainInfoCard = ({specialist} : {specialist: Specialist}) => {
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
                    <HeartOutlined
                        className="specialist-main-favorite"
                        style={{ color: '#E31b23', cursor: 'pointer', alignSelf: 'flex-start' }}
                    />
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