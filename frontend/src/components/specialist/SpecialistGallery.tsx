import {useState} from "react";
import {Button, Card} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import type {Specialist} from "../../api/specialists.ts";

const SpecialistGallery = ({specialist} : {specialist: Specialist}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = specialist?.avatar_url ? [specialist.avatar_url] : [];

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
            className="specialist-section-card specialist-gallery-card"
            title="Галерея"
            style={{ borderRadius: 8, marginTop: 0 }}
            styles={{ body: {padding: 16}, title: {fontSize: 24} }}
        >
            <div style={{ position: 'relative' }}>
                {/* Main Image */}
                <div
                    className="specialist-gallery-main-image"
                    style={{ width: '100%', backgroundColor: '#d9d9d9', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                >
                    {images.length > 0 ? (
                        <img
                            src={images[currentImageIndex]}
                            alt={`Gallery image ${currentImageIndex + 1}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : null}

                    {/* Navigation Arrows */}
                    {images.length > 1 ? (
                        <>
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
                        </>
                    ) : null}
                </div>

                {/* Thumbnails */}
                {images.length > 1 ? (
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
                ) : null}
            </div>
        </Card>
    );
};

export default SpecialistGallery;