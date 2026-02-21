import React, { useState } from 'react';

interface ServiceImageProps {
    src: string;
    name: string;
    className?: string;
    iconSize?: string;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({ src, name, className = "w-full h-full object-cover", iconSize = "text-2xl" }) => {
    const [error, setError] = useState(false);

    // Detecta se a URL é vazia
    const isEmpty = !src || src.trim() === '';
    const isPlaceholder = src && (
        src.includes('placeholder.com') ||
        (src.includes('images.unsplash.com/photo-') && src.length < 50)
    );

    if (error || isEmpty || isPlaceholder) {
        return <span className={`material-icons-round text-gold ${iconSize}`}>content_cut</span>;
    }

    return (
        <img
            src={src}
            alt={name}
            className={className}
            onError={() => setError(true)}
        />
    );
};
