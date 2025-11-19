import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RegisteredUser } from '../types';

interface LiveChatWidgetProps {
    email: string;
    displayName?: string;
    label?: string;
}

interface UserMessage {
    id: number;
    user_email: string;
    message: string;
    sent_by: string | null;
    created_at: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ email, displayName, label }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<UserMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('user_messages')
            .select('*')
            .eq('user_email', email)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data as UserMessage[]);
        }
    };

    useEffect(() => {
        fetchMessages();
        const channel = supabase
            .channel(`live-chat-${email}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_messages', filter: `user_email=eq.${email}` }, () => {
                fetchMessages();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [email]);

    useEffect(() => {
        if (open && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        const { error } = await supabase
            .from('user_messages')
            .insert({
                user_email: email,
                message: input.trim(),
                sent_by: displayName || email,
            });
        if (!error) {
            setInput('');
        }
        setLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                    Canlı Destek
                </button>
            )}
            {open && (
                <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{label || 'Canlı Destek'}</p>
                            <p className="text-xs text-slate-500">{displayName ? displayName : email}</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sent_by === email ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sent_by === email ? 'bg-primary-100 text-primary-900' : 'bg-slate-100 text-slate-700'}`}>
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
            )}
        </div>
    );
};

export default LiveChatWidget;
