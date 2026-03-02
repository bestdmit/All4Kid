import {Card, Flex, Layout, Space} from "antd";
import AppHeader from "../src/Header/AppHeader";
import {useParams} from "react-router-dom";
import {Specialist, specialistApi} from "../src/api/specialists.ts";
import {useEffect, useState} from "react";
import {BorderOutlined, EnvironmentOutlined, HeartOutlined, StarFilled} from "@ant-design/icons";
const { Content } = Layout;
import { Typography } from 'antd';

const { Title, Text } = Typography;


const SpecialistPage = () => {
    const { id } = useParams();
    const { fetchByID } = specialistApi;

    const [specialist, setSpecialist] = useState<Specialist>();

    useEffect(() => {
        fetchByID(Number(id)).then(data => setSpecialist(data));
    }, [id])

    return (
        <Layout >
            <AppHeader/>
            <Content style={{padding: "30px 12rem 30px 12rem", background: "#FFFFFF"}}>

            </Content>
        </Layout>
    );
}

export default SpecialistPage;