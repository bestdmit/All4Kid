import {Button, Calendar, Card, Space} from "antd";
import { Typography } from 'antd';
import type {Specialist} from "../../api/specialists.ts";

const { Text } = Typography;

export const SpecialistBooking = ({ specialist: _specialist } : { specialist: Specialist }) => {
    return (
                <Card
                    title="Выберите дату и время"
                    style={{ borderRadius: 8, top: 0}}
                    styles={{ body: {padding: 20} }}
                >
                    <Space orientation="vertical" size={20}>
                        {/* Calendar */}
                        <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 8 }}>
                            <Calendar
                                fullscreen={false}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Available Time */}
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>
                                Доступное время
                            </Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                Не реализовано
                            </div>
                        </div>

                        {/* Book Button */}
                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{
                                backgroundColor: '#9370DB',
                                borderColor: '#9370DB',
                                height: 44,
                                fontSize: 16
                            }}
                        >
                            Записаться
                        </Button>
                    </Space>
                </Card>
    )
}