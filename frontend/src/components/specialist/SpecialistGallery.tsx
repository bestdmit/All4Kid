import {useState} from "react";
import {Button, Card} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import type {Specialist} from "../../api/specialists.ts";

const SpecialistGallery = ({specialist} : {specialist: Specialist}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // TODO: Получить ссылки на изображения из пропа специалиста
    const images = [
        'https://via.placeholder.com/600x400/d9d9d9/666?text=Фото+1',
        'https://via.placeholder.com/600x400/d9d9d9/666?text=Фото+2',
        'https://via.placeholder.com/600x400/d9d9d9/666?text=Фото+3',
        'https://via.placeholder.com/600x400/d9d9d9/666?text=Фото+4',
    ];

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleThumbnailClick = (index: number) => {
        setCurrentImageIndex(index);
    };

    return (
        <Card
            title="Галерея"
            style={{ borderRadius: 8, marginTop: 16 }}
            styles={{ body: {padding: 20}, title: {fontSize: 28} }}
        >
            <div style={{ position: 'relative' }}>
                {/* Main Image */}
                <div
                    style={{
                        width: '100%',
                        height: 300,
                        backgroundColor: '#d9d9d9',
                        borderRadius: 8,
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <img
                        src={images[currentImageIndex]}
                        alt={`Gallery image ${currentImageIndex + 1}`}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />

                    {/* Navigation Arrows */}
                    <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrev}
                        style={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            cursor: 'pointer'
                        }}
                    />

                    <Button
                        icon={<RightOutlined />}
                        onClick={handleNext}
                        style={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Thumbnails */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 16,
                    justifyContent: 'flex-start'
                }}>
                    {images.map((image, index) => (
                        <div
                            key={index}
                            onClick={() => handleThumbnailClick(index)}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 4,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: currentImageIndex === index
                                    ? '2px solid #9370DB'
                                    : '2px solid transparent',
                                opacity: currentImageIndex === index ? 1 : 0.6,
                                transition: 'all 0.3s'
                            }}
                        >
                            <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default SpecialistGallery;