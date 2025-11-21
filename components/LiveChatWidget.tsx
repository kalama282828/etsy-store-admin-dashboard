import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from './LanguageContext';

interface LiveChatWidgetProps {
    conversationId: string; // user email or conversation key
    senderId: string; // current sender identifier
    displayName?: string;
    label?: string;
    role?: 'admin' | 'user' | 'visitor';
    counterpartId?: string;
    welcomeMessage?: string;
    onUnreadCountChange?: (count: number) => void;
}

interface UserMessage {
    id: number;
    user_email: string;
    message: string;
    sent_by: string | null;
    created_at: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
    conversationId,
    senderId,
    displayName,
    label = 'Canlı Destek',
    role = 'user',
    counterpartId,
    onUnreadChange,
    onUnreadCountChange,
    mode = 'floating',
    triggerLabel,
    onClose,
    welcomeMessage,
}) => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(mode === 'panel');
    const [messages, setMessages] = useState<UserMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [statusOnline, setStatusOnline] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isOpen = mode === 'panel' ? true : open;

    const getWelcomeMessageObj = (): UserMessage | null => {
        if (!welcomeMessage) return null;
        return {
            id: -1,
            user_email: conversationId,
            message: welcomeMessage,
            sent_by: counterpartId || 'admin', // Treat as received from admin
            created_at: new Date().toISOString(),
        };
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('user_messages')
            .select('*')
            .eq('user_email', conversationId)
            .order('created_at', { ascending: true });

        let msgs = (data as UserMessage[]) || [];

        const welcomeMsg = getWelcomeMessageObj();
        if (welcomeMsg) {
            // Only add welcome message if it's not already in the DB (simple check)
            // or just always prepend it for display if the chat is empty?
            // Let's prepend it if the chat is empty OR if we want it always visible at the start.
            // Usually welcome messages are transient or persisted. 
            // For now, let's prepend it if the list is empty or just purely visual.
            // If we prepend it, it might look like a duplicate if we save it later.
            // Let's just prepend it purely for display.
            if (msgs.length === 0) {
                msgs = [welcomeMsg];
            }
        }
        setMessages(msgs);
    };

    useEffect(() => {
        fetchMessages();
        const channel = supabase
            .channel(`live-chat-${conversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_messages', filter: `user_email=eq.${conversationId}` }, (payload) => {
                if (payload.new) {
                    const msg = payload.new as UserMessage;
                    setMessages((prev) => [...prev, msg]);
                    if (msg.sent_by !== senderId && !isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, senderId, isOpen]);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            setUnreadCount(0);
        }
        onUnreadChange?.(unreadCount > 0);
        onUnreadCountChange?.(unreadCount);
    }, [unreadCount, isOpen, onUnreadChange, onUnreadCountChange]);

    const markPresence = async (online: boolean) => {
        await supabase
            .from('chat_presence')
            .upsert({
                email: senderId,
                role,
                is_online: online,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
    };

    useEffect(() => {
        if (!role) return;
        if (isOpen) {
            markPresence(true);
        } else if (mode === 'floating') {
            markPresence(false);
        }
        return () => {
            markPresence(false);
        };
    }, [isOpen, role, senderId, mode]);

    useEffect(() => {
        if (!counterpartId) return;
        const fetchStatus = async () => {
            const { data } = await supabase
                .from('chat_presence')
                .select('is_online')
                .eq('email', counterpartId)
                .maybeSingle();
            if (data) setStatusOnline(!!data.is_online);
        };
        fetchStatus();
        const channel = supabase
            .channel(`presence-${counterpartId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_presence', filter: `email=eq.${counterpartId}` }, (payload) => {
                setStatusOnline((payload.new as any)?.is_online ?? false);
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [counterpartId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        const { error } = await supabase
            .from('user_messages')
            .insert({
                user_email: conversationId,
                message: input.trim(),
                sent_by: senderId,
            });
        if (!error) {
            setInput('');
            fetchMessages();
        }
        setLoading(false);
    };

    const chatBody = (
        <div className="w-full h-full flex flex-col bg-metallic-900 rounded-2xl shadow-2xl border border-metallic-800">
            <div className="px-4 py-3 border-b border-metallic-800 flex items-center justify-between bg-metallic-950/50 rounded-t-2xl">
                <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-metallic-400">{statusOnline === null ? t('status_checking') : statusOnline ? t('status_online') : t('status_offline')}</p>
                </div>
                {(mode === 'floating' || onClose) && (
                    <button onClick={() => onClose ? onClose() : setOpen(false)} className="text-metallic-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3 custom-scrollbar bg-metallic-900">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sent_by === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sent_by === senderId ? 'bg-primary-900/40 text-primary-200 border border-primary-900/50' : 'bg-metallic-800 text-metallic-200 border border-metallic-700'}`}>
                            <p>{msg.message}</p>
                            <span className={`text-[10px] block mt-1 ${msg.sent_by === senderId ? 'text-primary-400/70' : 'text-metallic-500'}`}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-metallic-800 flex gap-2 bg-metallic-950/30 rounded-b-2xl">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat_placeholder')}
                    className="flex-1 rounded-full border border-metallic-700 bg-metallic-950 px-3 py-2 text-sm text-metallic-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-metallic-600"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 transition-colors shadow-lg shadow-primary-900/20"
                >
                    {t('send')}
                </button>
            </form>
        </div>
    );

    if (mode === 'panel') {
        return chatBody;
    }

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {!isOpen && (
                <button
                    onClick={() => setOpen(true)}
                    className="relative bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                    {triggerLabel || label}
                    {unreadCount > 0 && <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />}
                </button>
            )}
            {isOpen && chatBody}
        </div>
    );
};

export default LiveChatWidget;
