import {Layout, Row, Col} from "antd";
import AppHeader from "../src/Header/AppHeader";
import {useParams} from "react-router-dom";
import {SpecialistMainInfoCard} from "../src/components/specialist/SpecialistMainInfoCard.tsx";
import {SpecialistDescription} from "../src/components/specialist/SpecialistDescription.tsx";
import {SpecialistBooking} from "../src/components/specialist/SpecialistBooking.tsx";
import SpecialistGallery from "../src/components/specialist/SpecialistGallery.tsx";
import SpecialistReviews from "../src/components/specialist/SpecialistReviews.tsx";
import {useSpecialist} from "../hooks/specialists/useSpecialist.ts";
const { Content } = Layout;


const SpecialistPage = () => {
    const { id } = useParams();
    const { specialist, loading, error } = useSpecialist(Number(id));

    if (loading) {
        return <div style={{ color: 'black', textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
    }

    if (error || !specialist) {
        return (
            <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
                Ошибка: {error}
            </div>
        );
    }

    return (
        <Layout >
            <AppHeader/>
            <Content style={{padding: "30px 12rem 30px 12rem", background: "#FFFFFF"}}>
                <SpecialistMainInfoCard specialist={specialist}/>

                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <SpecialistDescription specialist={specialist}/>
                        <SpecialistGallery specialist={specialist}/>
                    </Col>

                    <Col xs={24} lg={8}>
                        <SpecialistBooking specialist={specialist}/>
                    </Col>

                    <SpecialistReviews specialist={specialist}/>
                </Row>
            </Content>
        </Layout>
    );
}

export default SpecialistPage;