import React, { useEffect, useState } from 'react';
import LiveChatWidget from './LiveChatWidget';
import { ADMIN_CHAT_ID } from '../constants';

interface VisitorChatWidgetProps {
    language: 'tr' | 'en';
}

const VisitorChatWidget: React.FC<VisitorChatWidgetProps> = ({ language }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [hasProfile, setHasProfile] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const WELCOME_MESSAGE = "Merhabalar, ETSY Sıralama hizmeti veren hizmetimizi tanıtmaktan memnuniyet duyarım! Lütfen hemen bize mesaj atın ve birlikte mağazanızı analiz edelim";

    useEffect(() => {
        const storedName = localStorage.getItem('visitor_name');
        const storedEmail = localStorage.getItem('visitor_email');
        if (storedEmail) {
            setEmail(storedEmail);
            setHasProfile(true);
        } else {
            // New visitor, show 1 unread message (welcome message)
            setUnreadCount(1);
        }
        if (storedName) {
            setName(storedName);
        }
    }, []);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        localStorage.setItem('visitor_name', name.trim());
        localStorage.setItem('visitor_email', email.trim());
        setHasProfile(true);
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="relative bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-500 transition-all text-sm font-semibold shadow-primary-600/20"
                >
                    {language === 'en' ? 'Live Support' : 'Canlı Destek'}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold animate-pulse shadow-lg shadow-red-500/20">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}
            {open && (
                !hasProfile ? (
                    <div className="w-80 h-96 bg-metallic-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div>
                                <p className="text-sm font-semibold text-white">{language === 'en' ? 'Live Support' : 'Canlı Destek'}</p>
                                <p className="text-xs text-metallic-400">{language === 'en' ? 'We reply in a few minutes' : 'Birkaç dakika içinde yanıtlıyoruz'}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-metallic-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Welcome Message Bubble */}
                        <div className="p-4 flex-1 overflow-y-auto bg-black/20">
                            <div className="flex justify-start mb-4">
                                <div className="max-w-[90%] px-3 py-2 rounded-2xl text-sm bg-metallic-800 text-white shadow-sm border border-white/5">
                                    <p>{WELCOME_MESSAGE}</p>
                                    <span className="text-[10px] text-metallic-500 block mt-1">Az önce</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleStart} className="p-4 pt-2 border-t border-white/5 space-y-3 text-sm text-white bg-white/5">
                            <div>
                                <label className="block mb-1 text-metallic-300">{language === 'en' ? 'Your name' : 'Adınız'}</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white placeholder-metallic-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-metallic-300">{language === 'en' ? 'Email address' : 'E-posta'}</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white placeholder-metallic-600"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20">
                                {language === 'en' ? 'Start Chat' : 'Sohbeti Başlat'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="w-80 h-96">
                        <LiveChatWidget
                            mode="panel"
                            conversationId={email}
                            senderId={email}
                            displayName={name || email}
                            counterpartId={ADMIN_CHAT_ID}
                            role="visitor"
                            label={language === 'en' ? 'Support' : 'Destek'}
                            onUnreadCountChange={setUnreadCount}
                            onClose={() => setOpen(false)}
                            welcomeMessage={WELCOME_MESSAGE}
                        />
                    </div>
                )
            )}
        </div>
    );
};

export default VisitorChatWidget;
