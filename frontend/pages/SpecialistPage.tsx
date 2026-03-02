import {Layout, Row, Col} from "antd";
import AppHeader from "../src/Header/AppHeader";
import {useParams} from "react-router-dom";
import {specialistApi} from "../src/api/specialists.ts";
import type {Specialist} from "../src/api/specialists.ts";
import {useEffect, useState} from "react";
import {SpecialistMainInfoCard} from "../src/components/specialist/SpecialistMainInfoCard.tsx";
import {SpecialistDescription} from "../src/components/specialist/SpecialistDescription.tsx";
import {SpecialistBooking} from "../src/components/specialist/SpecialistBooking.tsx";
const { Content } = Layout;


const SpecialistPage = () => {
    const { id } = useParams();
    const { fetchByID } = specialistApi;

    const [specialist, setSpecialist] = useState<Specialist>({
        created_at: "",
        created_by: 0,
        experience: 0,
        id: 0,
        location: "",
        name: "",
        price_per_hour: 0,
        rating: 0,
        specialty: "",
        description: ""
    });

    useEffect(() => {
        fetchByID(Number(id)).then(data => setSpecialist(data));
    }, [id])

    return (
        <Layout >
            <AppHeader/>
            <Content style={{padding: "30px 12rem 30px 12rem", background: "#FFFFFF"}}>
                <SpecialistMainInfoCard specialist={specialist}/>

                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <SpecialistDescription specialist={specialist}/>
                    </Col>

                    <Col xs={24} lg={8}>
                        <SpecialistBooking specialist={specialist}/>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default SpecialistPage;