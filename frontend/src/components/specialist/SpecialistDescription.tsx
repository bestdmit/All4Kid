import type {Specialist} from "../../api/specialists.ts";
import {Card, Space} from "antd";
import { Typography } from 'antd';

const { Text, Paragraph } = Typography;

export const SpecialistDescription = ({specialist} : {specialist: Specialist}) => {
    return (
        <div>
            {/* About Section */}
            <Card
                title="О специалисте"
                style={{ marginBottom: 30, borderRadius: 8 }}
                styles={{ body: {padding: 20}, title: { fontSize: 28} }}
            >
                <Paragraph style={{ fontSize: 18, lineHeight: 1.8, color: '#262626' }}>
                    {specialist.description}
                </Paragraph>
            </Card>

            {/* Education Section */}
            <Card
                title="Образование"
                style={{ marginBottom: 30, borderRadius: 8 }}
                styles={{ body: {padding: 20}, title: { fontSize: 28} }}
            >
                <Space orientation="vertical" size={12}>
                    <div>
                        <Text style={{fontSize: 18}} strong>МГУ им. М.В. Ломоносова, механико-математический факультет</Text>
                        <br />
                        <Text style={{fontSize: 18}} type="secondary">(2009)</Text>
                    </div>
                    <div>
                        <Text style={{fontSize: 18}} strong>Педагогический университет, методика преподавания математики</Text>
                        <br />
                        <Text style={{fontSize: 18}} type="secondary">(2011)</Text>
                    </div>
                </Space>
            </Card>

            {/* Work Experience Section */}
            <Card
                title="Опыт работы"
                style={{ marginBottom: 30, borderRadius: 8 }}
                styles={{ body: {padding: 20, fontSize: 18}, title: { fontSize: 28} }}
            >
                <Text style={{fontSize: 18}}>{specialist.experience} года</Text>
            </Card>
        </div>
    )
}