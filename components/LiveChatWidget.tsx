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
    conversation_id: string;  // Changed from user_email
    sender_id: string;         // Changed from sent_by
    message: string;
    is_admin_message?: boolean;
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
            conversation_id: conversationId,
            sender_id: counterpartId || 'admin',
            message: welcomeMessage,
            is_admin_message: true,
            created_at: new Date().toISOString(),
        };
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                if (payload.new) {
                    const msg = payload.new as UserMessage;
                    setMessages((prev) => [...prev, msg]);
                    if (msg.sender_id !== senderId && !isOpen) {
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
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                message: input.trim(),
                is_admin_message: role === 'admin',
            });
        if (!error) {
            setInput('');
            fetchMessages();
        }
        setLoading(false);
    };

    const chatBody = (
        <div className="w-full h-full flex flex-col bg-metallic-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div>
                    <p className="text-sm font-bold text-white tracking-tight">{label}</p>
                    <p className="text-xs text-metallic-400">{statusOnline === null ? t('status_checking') : statusOnline ? t('status_online') : t('status_offline')}</p>
                </div>
                {(mode === 'floating' || onClose) && (
                    <button onClick={() => onClose ? onClose() : setOpen(false)} className="text-metallic-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3 custom-scrollbar bg-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.sender_id === senderId ? 'bg-primary-600 text-white rounded-br-none' : 'bg-metallic-800 text-metallic-200 rounded-bl-none border border-white/5'}`}>
                            <p>{msg.message}</p>
                            <span className={`text-[10px] block mt-1 ${msg.sender_id === senderId ? 'text-primary-200' : 'text-metallic-500'}`}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/5 flex gap-2 bg-black/20">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat_placeholder')}
                    className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder-metallic-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
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
