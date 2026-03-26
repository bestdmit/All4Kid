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
                style={{ height: 56, objectFit: 'contain', width:"auto", marginLeft:"auto", marginRight:"auto", marginTop:"8px" }}
            />}
            className="category-card"
        >
            <Typography.Title level={4} style={{marginTop:0,textAlign:"center", marginBottom: 0}}>{titleText}</Typography.Title>
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