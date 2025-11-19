import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LiveChatWidgetProps {
    conversationId: string; // user email or conversation key
    senderId: string; // current sender identifier
    displayName?: string;
    label?: string;
    role?: 'admin' | 'user' | 'visitor';
    counterpartId?: string;
    onUnreadChange?: (hasUnread: boolean) => void;
    mode?: 'floating' | 'panel';
    triggerLabel?: string;
    onClose?: () => void;
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
    mode = 'floating',
    triggerLabel,
    onClose,
}) => {
    const [open, setOpen] = useState(mode === 'panel');
    const [messages, setMessages] = useState<UserMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [statusOnline, setStatusOnline] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isOpen = mode === 'panel' ? true : open;

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('user_messages')
            .select('*')
            .eq('user_email', conversationId)
            .order('created_at', { ascending: true });
        if (!error && data) {
            setMessages(data as UserMessage[]);
        }
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
                        setHasUnread(true);
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
        if (isOpen && hasUnread) {
            setHasUnread(false);
        }
        onUnreadChange?.(hasUnread);
    }, [hasUnread, isOpen, onUnreadChange]);

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
        <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{statusOnline === null ? 'Durum alınıyor...' : statusOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                </div>
                {(mode === 'floating' || onClose) && (
                    <button onClick={() => onClose ? onClose() : setOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sent_by === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sent_by === senderId ? 'bg-primary-100 text-primary-900' : 'bg-slate-100 text-slate-700'}`}>
                            <p>{msg.message}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">{new Date(msg.created_at).toLocaleTimeString('tr-TR')}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-200 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Mesajınız..."
                    className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                    Gönder
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
                    {hasUnread && <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />}
                </button>
            )}
            {isOpen && chatBody}
        </div>
    );
};

export default LiveChatWidget;
