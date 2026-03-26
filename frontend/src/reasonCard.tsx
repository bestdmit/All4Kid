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
          style={{ height: 56, objectFit: 'contain', width:"auto", marginLeft:"auto", marginRight:"auto", marginTop:"8px" }}
        />} 
        className="reason-card" >
            <Typography.Title level={4} style={{marginTop:0, textAlign: "center", marginBottom: 8}}>{titleText}</Typography.Title>
        <Typography.Paragraph style={{ textAlign: "center", marginBottom: 0 }}>{descriptionText}</Typography.Paragraph>
    </Card>
    </>
}