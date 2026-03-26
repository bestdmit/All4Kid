import {Layout, Row, Col} from "antd";
import AppHeader from "../src/Header/AppHeader";
import {useParams} from "react-router-dom";
import {SpecialistMainInfoCard} from "../src/components/specialist/SpecialistMainInfoCard.tsx";
import {SpecialistDescription} from "../src/components/specialist/SpecialistDescription.tsx";
import {SpecialistBooking} from "../src/components/specialist/SpecialistBooking.tsx";
import SpecialistGallery from "../src/components/specialist/SpecialistGallery.tsx";
import SpecialistReviews from "../src/components/specialist/SpecialistReviews.tsx";
import {useSpecialist} from "../hooks/specialists/useSpecialist.ts";
import "../src/components/specialist/specialistPage.css";
const { Content } = Layout;


const SpecialistPage = () => {
    const { id } = useParams();
    const { specialist, loading, error } = useSpecialist(Number(id));

    if (loading) {
        return <div style={{ color: 'black', textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
    }

    if (error) {
        return (
            <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
                {error.includes('удалено администратором') ? (
                    <div>
                        <p>{error}</p>
                        <a href="/" style={{ color: '#1890ff' }}>← На главную</a>
                    </div>
                ) : (
                    <div>
                        <p>Ошибка: {error}</p>
                        <a href="/" style={{ color: '#1890ff' }}>← На главную</a>
                    </div>
                )}
            </div>
        );
    }

    if (!specialist) {
        return (
            <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
                Специалист не найден
            </div>
        );
    }

    return (
        <Layout>
            <AppHeader/>
            <Content className="specialist-page-content">
                <SpecialistMainInfoCard specialist={specialist}/>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <SpecialistDescription specialist={specialist}/>
                        <SpecialistGallery specialist={specialist}/>
                    </Col>

                    <Col xs={24} lg={8}>
                        <SpecialistBooking specialist={specialist}/>
                    </Col>

                    <Col xs={24}>
                        <SpecialistReviews specialist={specialist}/>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default SpecialistPage;