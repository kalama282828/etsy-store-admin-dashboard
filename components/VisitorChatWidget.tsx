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
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem('visitor_name');
        const storedEmail = localStorage.getItem('visitor_email');
        if (storedEmail) {
            setEmail(storedEmail);
            setHasProfile(true);
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
                    className="relative bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                    {language === 'en' ? 'Live Support' : 'Canlı Destek'}
                    {hasUnread && <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />}
                </button>
            )}
            {open && (
                !hasProfile ? (
                    <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{language === 'en' ? 'Live Support' : 'Canlı Destek'}</p>
                                <p className="text-xs text-slate-500">{language === 'en' ? 'We reply in a few minutes' : 'Birkaç dakika içinde yanıtlıyoruz'}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleStart} className="p-4 space-y-3 text-sm text-slate-700">
                            <div>
                                <label className="block mb-1">{language === 'en' ? 'Your name' : 'Adınız'}</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">{language === 'en' ? 'Email address' : 'E-posta'}</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700">
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
                            onUnreadChange={setHasUnread}
                            onClose={() => setOpen(false)}
                        />
                    </div>
                )
            )}
        </div>
    );
};

export default VisitorChatWidget;
