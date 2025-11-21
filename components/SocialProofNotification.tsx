

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
        <div className={`fixed bottom-5 left-5 z-50 transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            <div className="bg-metallic-900/90 backdrop-blur-xl rounded-xl shadow-2xl p-4 flex items-center max-w-sm border border-white/10">
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <svg className="h-6 w-6 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div className="ml-3 text-sm font-medium text-white">
                    {message}
                </div>
            </div>
        </div>
    );
};

export default SocialProofNotification;