import type {Specialist} from "../../api/specialists.ts";
import {Card} from "antd";
import { Typography } from 'antd';

const { Text, Paragraph } = Typography;

export const SpecialistDescription = ({specialist} : {specialist: Specialist}) => {
    const getYearsLabel = (years: number) => {
        const absYears = Math.abs(years);
        const lastTwoDigits = absYears % 100;
        const lastDigit = absYears % 10;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "лет";
        if (lastDigit === 1) return "год";
        if (lastDigit >= 2 && lastDigit <= 4) return "года";
        return "лет";
    };

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
            <Card
                className="specialist-section-card"
                title="Образование"
                style={{ marginBottom: 16, borderRadius: 8 }}
                styles={{ body: {padding: 16}, title: { fontSize: 24} }}
            >
                <Text className="specialist-section-paragraph">
                    {specialist.education}
                </Text>
            </Card>

            {/* Work Experience Section */}
            <Card
                className="specialist-section-card"
                title="Опыт работы"
                style={{ marginBottom: 16, borderRadius: 8 }}
                styles={{ body: {padding: 16, fontSize: 16}, title: { fontSize: 24} }}
            >
                <Text className="specialist-section-paragraph">
                    {specialist.experience} {getYearsLabel(specialist.experience)}
                </Text>
            </Card>
        </>
    )
}