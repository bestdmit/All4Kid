import React from "react";
import { Card,Typography  } from "antd";

interface KategoryCardProps{
    imagePath: string;
    titleText:string;
}

export default function KategoryCard({imagePath,titleText}:KategoryCardProps){
    return <>
        <Card variant="borderless" cover = {<img
                  alt={titleText || "Изображение карточки"}
                  src={imagePath}
                  style={{ height: "7vh", objectFit: 'cover',width:"auto",marginLeft:"auto",marginRight:"auto",marginTop:"1vh" }}
                />} 
                style={{ width: 300 }} >
                    <Typography.Title level={3} style={{marginTop:0,textAlign:"center"}}>{titleText}</Typography.Title>
            </Card>
    </>
}