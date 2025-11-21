import React from 'react';

interface PromotionBannerProps {
    text?: string | null;
    isActive?: boolean | null;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({ text, isActive }) => {
    if (!isActive || !text) return null;

    return (
        <div className="bg-gradient-to-r from-primary-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white py-2.5 relative overflow-hidden z-50 shadow-lg border-b border-white/10">
            <div className="animate-marquee whitespace-nowrap inline-block min-w-full text-center font-semibold tracking-wide text-sm">
                ✨ {text} ✨
            </div>
        </div>
    );
};

export default PromotionBanner;
