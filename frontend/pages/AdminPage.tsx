import {Button, Card, Layout, message, Space, Typography} from "antd";
import AppHeader from "../src/Header/AppHeader.tsx";
import {type Review, reviewsApi} from "../src/api/reviews.ts";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";

const {Title} = Typography;

const AdminPage = () => {
    const [reviews, setReviews] = useState<Review[]>();
    const [refetch, setRefetch] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUnapproved = async () => {
            try {
                const res = await reviewsApi.fetchUnapproved();

                if (!res.success) {
                    throw new Error(res.message || "Ошибка получения отзывов");
                }

                setReviews(res.data);
                if(refetch){
                    setRefetch(false);
                }
            } catch (e: any) {
                message.error(e instanceof Error ? e.message : "Ошибка при получении отзывов");
            }
        }

        fetchUnapproved();
    }, [refetch,]);

    const handleApproveReview = async (id: number) => {
        try {
            const res = await reviewsApi.approve(id);

            if (!res.success) {
                throw new Error(res.message || "Не удалось подтвердить отзыв");
            }

            message.success("Отзыв подтверждён");
            setRefetch(true);
        } catch (e: any) {
            if (e?.message === "UNAUTHORIZED") {
                message.error("Сессия истекла. Войдите заново");
                navigate("/auth");
                return;
            }
            message.error(e instanceof Error ? e.message : "Ошибка при подтверждении отзыва");
        }
    }

    const handleDeleteReview = async (id: number) => {
        try {
            const res = await reviewsApi.delete(id);

            if (!res.success) {
                throw new Error(res.message || "Не удалось удалить отзыв");
            }

            message.success("Отзыв удалён");
            setRefetch(true);
        } catch (e: any) {
            if (e?.message === "UNAUTHORIZED") {
                message.error("Сессия истекла. Войдите заново");
                navigate("/auth");
                return;
            }
            message.error(e instanceof Error ? e.message : "Ошибка при удалении отзыва");
        }
    }

    return (
        <Layout>
            <AppHeader/>
            <Card styles={{body: {width: '70%'}}} style={{background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem 5rem"}}>
                <Title style={{margin: '0 0 3rem 0', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Ожидают подтверждения</Title>
                    {reviews && reviews.map((review) => (
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