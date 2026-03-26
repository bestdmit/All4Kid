import { Card,Typography  } from "antd";

interface ReasonCardProps{
    imagePath: string;
    titleText:string;
    descriptionText: string;
}
export default function ReasonCard({ imagePath,titleText, descriptionText } : ReasonCardProps){
    return <>
    <Card variant="borderless" cover = {<img
          alt={descriptionText || "Изображение карточки"}
          src={imagePath}
          style={{
            height: "var(--reason-img-height, 10vh)",
            objectFit: 'cover',
            width: "auto",
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "var(--reason-img-margin-top, 1vh)",
          }}
        />} 
        style={{ minWidth: 0, width: '100%', maxWidth: 300 }} >
            <Typography.Title level={3} style={{ marginTop: 0 }}>{titleText}</Typography.Title>
        <Typography.Paragraph>{descriptionText}</Typography.Paragraph>
    </Card>
    </>
}