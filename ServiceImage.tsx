import React, { useState } from 'react';

interface ServiceImageProps {
    src: string;
    name: string;
    className?: string;
    iconSize?: string;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({ src, name, className = "w-full h-full object-cover", iconSize = "text-2xl" }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Detecta se a URL é vazia
    const isEmpty = !src || src.trim() === '';
    const isPlaceholder = src && (
        src.includes('placeholder.com') ||
        (src.includes('images.unsplash.com/photo-') && src.length < 50)
    );

    if (error || isEmpty || isPlaceholder) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gold/5">
                <span className={`material-icons-round text-gold ${iconSize}`}>content_cut</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {loading && (
                <div className="absolute inset-0 shimmer-loading animate-shimmer-premium z-10"></div>
            )}
            <img
                src={src}
                alt={name}
                className={`${className} transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
        </div>
    );
};
