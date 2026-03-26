import type {Specialist} from "../../api/specialists.ts";
import {Card, Space} from "antd";
import { Typography } from 'antd';

const { Text, Paragraph } = Typography;

export const SpecialistDescription = ({specialist} : {specialist: Specialist}) => {
    return (
        <>
            {/* About Section */}
            <Card
                className="specialist-section-card"
                title="О специалисте"
                style={{ marginBottom: 16, borderRadius: 8 }}
                styles={{ body: {padding: 16}, title: { fontSize: 24} }}
            >
                <Paragraph className="specialist-section-paragraph" style={{ lineHeight: 1.7, color: '#262626' }}>
                    {specialist.description}
                </Paragraph>
            </Card>

            {/* Education Section */}
            {/* TODO: заменить шаблоны, после добавления образования на бэкенде */}
            <Card
                className="specialist-section-card"
                title="Образование"
                style={{ marginBottom: 16, borderRadius: 8 }}
                styles={{ body: {padding: 16}, title: { fontSize: 24} }}
            >
                <Space orientation="vertical" size={12}>
                    <div>
                        <Text className="specialist-section-paragraph" strong>МГУ им. М.В. Ломоносова, механико-математический факультет</Text>
                        <br />
                        <Text className="specialist-section-muted" type="secondary">(2009)</Text>
                    </div>
                    <div>
                        <Text className="specialist-section-paragraph" strong>Педагогический университет, методика преподавания математики</Text>
                        <br />
                        <Text className="specialist-section-muted" type="secondary">(2011)</Text>
                    </div>
                </Space>
            </Card>

            {/* Work Experience Section */}
            <Card
                className="specialist-section-card"
                title="Опыт работы"
                style={{ marginBottom: 16, borderRadius: 8 }}
                styles={{ body: {padding: 16, fontSize: 16}, title: { fontSize: 24} }}
            >
                <Text className="specialist-section-paragraph">{specialist.experience} года</Text>
            </Card>
        </>
    )
}