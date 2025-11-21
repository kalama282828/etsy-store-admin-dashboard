

import React, { useState, useEffect } from 'react';

interface SocialProofNotificationProps {
    message: string;
}

const SocialProofNotification: React.FC<SocialProofNotificationProps> = ({ message }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 5000); // Notification visible for 5 seconds

            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div
            className={`fixed z-50 pointer-events-none transition-all duration-400 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            } bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 flex justify-center sm:justify-end`}
        >
            <div className="pointer-events-auto bg-metallic-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-3 sm:p-4 flex items-start gap-3 w-full max-w-[420px]">
                <div className="flex-shrink-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary-500/15 flex items-center justify-center border border-primary-500/20">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 text-xs sm:text-sm font-medium text-white leading-snug">
                    {message}
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-metallic-400 hover:text-white transition-colors"
                    aria-label="Kapat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SocialProofNotification;
