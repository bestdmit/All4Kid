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
            style={{
                width: '100%',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                marginBottom: 30
            }}
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
                style={{
                    width: 220,
                    height: 220,
                    backgroundColor: '#d9d9d9',
                    borderRadius: 4,
                    marginRight: 16,
                    flexShrink: 0,
                    objectFit: 'cover',
                    objectPosition: 'center 18%'
                }}
                onError={(e) => {
                    e.currentTarget.src = '/uploads/avatars/default.jpg';
                }}
            />

            <div style={{ flex: 1, margin: 0, padding: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }}>
                    <div>
                        <Title level={5} style={{ margin: 0, marginTop: "-1rem", fontSize: 40 }}>
                            {specialist?.name}
                        </Title>
                        <Text type="secondary" style={{ margin: 0, fontSize: 34 }}>
                            {specialist?.specialty}
                        </Text>
                    </div>
                    <HeartOutlined
                        style={{
                            fontSize: 30,
                            color: '#E31b23',
                            cursor: 'pointer',
                            alignSelf: 'flex-start',
                            paddingTop: "-10rem"
                        }}
                    />
                </Space>

                <Space orientation="vertical" size={4} style={{ marginTop: 50 }}>
                    <Space>
                        <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />
                        <Text type="secondary" style={{ fontSize: 20 }}>{specialist?.location}</Text>
                    </Space>

                    <Space>
                        <StarFilled style={{ color: '#FFD700', fontSize: 20 }} />
                        <Text strong style={{ fontSize: 20 }}>{specialist?.rating}</Text>
                        <Text type="secondary" style={{ fontSize: 20 }}>
                            {(specialist?.reviews_total ?? 0)} отзывов
                        </Text>
                    </Space>
                </Space>
            </div>
        </Card>
    )
}