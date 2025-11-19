import React from 'react';

interface PromotionBannerProps {
    text?: string | null;
    isActive?: boolean | null;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({ text, isActive }) => {
    if (!isActive || !text) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-2.5 relative overflow-hidden z-50 shadow-md">
            <div className="animate-marquee whitespace-nowrap inline-block min-w-full text-center font-medium tracking-wide text-sm">
                {text}
            </div>
        </div>
    );
};

export default PromotionBanner;
