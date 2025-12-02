import React from "react";
import AppHeader from '../../src/Header/AppHeader';
import ReasonCard from "../../src/reasonCard";
import { Link } from 'react-router-dom';
import { Layout, Card, Flex,Typography, Button } from 'antd';

const { Content } = Layout;
const {Title,Text} = Typography;
export default function MainPage(){
    return (
        <Layout>
            <AppHeader></AppHeader>
            <Content>
                <section>
                <Card 
                    style={{ 
                    minHeight: '60vh',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor:"#D9E5FF"
                    }}
                >
                    <div style={{ 
                      textAlign: 'left',
                      maxWidth:"1000px", 
                      width: '100%',
                    }}>
                      <Title level={1}>Все детские специалисты в одном месте</Title>
                      <Text style={{fontSize:"1.5rem"}}>Найдите проверенного специалиста для вашего ребенка — от репетитора до аниматора и тренера. Удобная система поиска, реальные отзывы и семейный профиль.</Text>
                      <div style={{ marginTop: '16px' }}>
                        <Button type="primary" size="large"><Link to="/specialists">Найти специалиста.</Link></Button>
                      </div>
                    </div>
                </Card>
                </section>

                {/* Секция 2 - на всю ширину */}
                <section >
                <Card 
                    style={{ 
                    minHeight: '400px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none'
                    }}
                >
                    <Title style={{textAlign:"center"}}>Почему нас выбирают</Title>
                    
                    <Flex justify="center" align = "center" gap={"middle"}>
                        <ReasonCard imagePath="../../src/images/MagnifyingGlass.png" 
                        descriptionText="Педагоги, тренеры, аниматоры и творческие специалисты в едином каталоге"
                        titleText="Все в одном месте"/>
                        <ReasonCard imagePath="../../src/images/CommentLogo.png" titleText="Реальные отзывы"
                            descriptionText="Честные рейтинги и отзывы от других родителей"/>
                        <ReasonCard imagePath="../../src/images/FamilyLogo.png" titleText="Семейный профиль"
                            descriptionText="Управляйте записями всех детей из одного аккаунта"/>
                    </Flex>
                </Card>
                </section>

                {/* Секция 3 - на всю ширину */}
                <section style={{ marginBottom: '0' }}>
                <Card 
                    title="Секция 3"
                    style={{ 
                    minHeight: '400px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none'
                    }}
                >
                    <h2>Заголовок секции 3</h2>
                    <p>Содержимое третьей секции...</p>
                </Card>
                </section>
            </Content>
    </Layout>
    )
}