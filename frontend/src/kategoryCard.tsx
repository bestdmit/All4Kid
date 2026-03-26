import { Card, Typography } from "antd";
import { Link } from "react-router-dom";

interface KategoryCardProps{
    imagePath: string;
    titleText:string;
    to?: string;
}

export default function KategoryCard({imagePath,titleText,to}:KategoryCardProps){
    const cardContent = (
        <Card
            hoverable={Boolean(to)}
            variant="borderless"
            cover = {<img
                alt={titleText || "Изображение карточки"}
                src={imagePath}
                style={{ height: "7vh", objectFit: 'cover', width: "auto", marginLeft: "auto", marginRight: "auto", marginTop: "1vh" }}
            />}
            style={{ minWidth: 0, width: '100%', maxWidth: 300 }}
        >
            <Typography.Title level={3} style={{marginTop:0,textAlign:"center"}}>{titleText}</Typography.Title>
        </Card>
    );

    return <>
        {to ? (
            <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
                {cardContent}
            </Link>
        ) : (
            cardContent
        )}
    </>
}