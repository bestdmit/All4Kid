import AppHeader from '../../src/Header/AppHeader';
import ReasonCard from "../../src/reasonCard";
import KategoryCard from "../../src/kategoryCard";
import BestSpecialistsCards from "../../src/bestSpecialistCards";
import { Link } from 'react-router-dom';
import { Layout, Card, Typography, Button } from 'antd';
import './MainPage.css';

const { Content } = Layout;
const {Title,Text} = Typography;
export default function MainPage(){
    return (
        <Layout>
            <AppHeader></AppHeader>
            <Content>
                <section className="heroSection">
                    <Card className="heroCard">
                        <div className="heroContent">
                            <Title className="heroTitle" level={1}>Все детские специалисты в одном месте</Title>
                            <Text className="heroText">Найдите проверенного специалиста для вашего ребенка — от репетитора до аниматора и тренера. Удобная система поиска, реальные отзывы и семейный профиль.</Text>
                            <div className="heroButton">
                                <Button type="primary" size="large"><Link to="/specialists">Найти специалиста</Link></Button>
                            </div>
                        </div>
                    </Card>
                </section>

                <section>
                    <Card className="sectionCard">
                        <Title className="sectionTitle">Почему нас выбирают</Title>
                        <div className="cardsRow">
                            <div className="reasonCard">
                                <ReasonCard imagePath="../../src/images/reasons/MagnifyingGlass.png"
                                    descriptionText="Педагоги, тренеры, аниматоры и творческие специалисты в едином каталоге"
                                    titleText="Все в одном месте"/>
                            </div>
                            <div className="reasonCard">
                                <ReasonCard imagePath="../../src/images/reasons/CommentLogo.png" titleText="Реальные отзывы"
                                    descriptionText="Честные рейтинги и отзывы от других родителей"/>
                            </div>
                            <div className="reasonCard">
                                <ReasonCard imagePath="../../src/images/reasons/FamilyLogo.png" titleText="Семейный профиль"
                                    descriptionText="Прикрепляйте каждого специалиста к конкретному ребёнку"/>
                            </div>
                        </div>
                    </Card>
                </section>

                <section>
                    <Card className="sectionCard" style={{ backgroundColor: "#E9E6E6" }}>
                        <Title className="sectionTitle">Популярные категории</Title>
                        <div className="cardsRow">
                            <div className="categoryCard">
                                <KategoryCard imagePath="../../src/images/kategories/sport.png" titleText="Спорт" to="/specialists?category=sports"/>
                            </div>
                            <div className="categoryCard">
                                <KategoryCard imagePath="../../src/images/kategories/Education.png" titleText="Образование" to="/specialists?category=education"/>
                            </div>
                            <div className="categoryCard">
                                <KategoryCard imagePath="../../src/images/kategories/creativity.png" titleText="Творчество" to="/specialists?category=creativity"/>
                            </div>
                            <div className="categoryCard">
                                <KategoryCard imagePath="../../src/images/kategories/Entertainment.png" titleText="Развлечения" to="/specialists?category=entertainment"/>
                            </div>
                        </div>
                    </Card>
                </section>

                <section>
                    <Card className="sectionCard">
                        <Title className="sectionTitle">Лучшие специалисты</Title>
                        <BestSpecialistsCards />
                    </Card>
                </section>
            </Content>
    </Layout>
    )
}