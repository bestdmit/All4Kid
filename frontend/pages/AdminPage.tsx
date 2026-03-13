import {Button, Card, Layout, message, Space, Typography} from "antd";
import {useSpecialistReviews} from "../hooks/reviews/useSpecialistReviews";
import AppHeader from "../src/Header/AppHeader.tsx";
import {reviewsApi} from "../src/api/reviews.ts";
import {useNavigate} from "react-router-dom";

const {Title} = Typography;

const AdminPage = () => {
    const { reviews } = useSpecialistReviews(8);
    const navigate = useNavigate();

    const handleApproveReview = (id) => {
        try {
            const res = await reviewsApi.createForSpecialist(specialist.id);

            if (!res.success) {
                throw new Error(res.message || "Не удалось подтвердить отзыв");
            }

            message.success("Отзыв подтверждён");
        } catch (e: any) {
            if (e?.message === "UNAUTHORIZED") {
                message.error("Сессия истекла. Войдите заново");
                navigate("/auth");
                return;
            }
            message.error(e instanceof Error ? e.message : "Ошибка при подтверждении отзыва");
        }
    }

    const handleDeleteReview = (id) => {

    }

    return (
        <Layout>
            <AppHeader/>
            <Card styles={{body: {width: '70%'}}} style={{background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem 5rem"}}>
                <Title style={{margin: '0 0 3rem 0', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Ожидают подтверждения</Title>
                    {reviews.map((review) => (
                        <Space style={{justifyContent: "space-around", width: '100%', border: '1px solid #d9d9d9', borderRadius: 8}}>
                            <p>{review.comment}</p>
                            <Space>
                                <Button type={'primary'} onClick={() => handleApproveReview(review.id)}>Подтвердить</Button>
                                <Button type={'primary'} danger={true} onClick={() => handleDeleteReview(review.id)}>Отклонить</Button>
                            </Space>
                        </Space>
                    ))}
            </Card>
        </Layout>
    )
}

export default AdminPage;