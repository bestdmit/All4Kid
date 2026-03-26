import AppHeader from '../../src/Header/AppHeader';
import ReasonCard from "../../src/reasonCard";
import KategoryCard from "../../src/kategoryCard";
import BestSpecialistsCards from "../../src/bestSpecialistCards";
import { Link } from 'react-router-dom';
import { Layout, Card, Typography, Button } from 'antd';
import "./mainPage.css";

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

                <section >
                <Card 
                    style={{ 
                    minHeight: '400px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none'
                    }}
                >
                    <Title className="section-title">Почему выбирают нас</Title>
                    <div className="main-cards-grid reason-grid">
                        <ReasonCard imagePath="../../src/images/reasons/MagnifyingGlass.png"
                        descriptionText="Педагоги, тренеры, аниматоры и творческие специалисты в едином каталоге"
                        titleText="Все в одном месте"/>
                        <ReasonCard imagePath="../../src/images/reasons/CommentLogo.png" titleText="Реальные отзывы"
                            descriptionText="Честные рейтинги и отзывы от других родителей"/>
                        <ReasonCard imagePath="../../src/images/reasons/FamilyLogo.png" titleText="Семейный профиль"
                            descriptionText="Прикрепляйте каждого специалиста к конкретному ребёнку"/>
                    </div>
                </Card>
                </section>

                <section>
                <Card 
                    style={{ 
                    minHeight: '400px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor:"#E9E6E6"
                    }}
                >
                    <Title className="section-title">Популярные категории</Title>
                    <div className="main-cards-grid categories-grid">
                        <KategoryCard imagePath="../../src/images/kategories/sport.png" titleText="Спорт" to="/specialists?category=sports"/>
                        <KategoryCard imagePath="../../src/images/kategories/Education.png" titleText="Образование" to="/specialists?category=education"/>
                        <KategoryCard imagePath="../../src/images/kategories/creativity.png" titleText="Творчество" to="/specialists?category=creativity"/>
                        <KategoryCard imagePath="../../src/images/kategories/Entertainment.png" titleText="Развлечения" to="/specialists?category=entertainment"/>

                    </div>
                </Card>
                </section>

                <section>
                    <Card 
                    style={{ 
                    minHeight: '400px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none'
                    }}
                >
                    <Title style={{textAlign:"center"}}>Лучшие специалисты</Title>
                        <BestSpecialistsCards></BestSpecialistsCards>
                    </Card>
                </section>
            </Content>
    </Layout>
    )
}