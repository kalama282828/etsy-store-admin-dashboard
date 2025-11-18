import React, { useEffect, useState } from 'react';
import { RegisteredUser } from '../types';
import { supabase } from '../lib/supabase';

interface UserMessagingPanelProps {
    users: RegisteredUser[];
}

interface UserMessage {
    id: number;
    user_email: string;
    message: string;
    created_at: string;
    sent_by: string | null;
}

const UserMessagingPanel: React.FC<UserMessagingPanelProps> = ({ users }) => {
    const [selectedUser, setSelectedUser] = useState<string>(users[0]?.email || '');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<UserMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = async (email: string) => {
        if (!email) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_messages')
            .select('*')
            .eq('user_email', email)
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) {
            setError(error.message);
            setMessages([]);
        } else {
            setError(null);
            setMessages((data as UserMessage[]) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser);
        }
    }, [selectedUser]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !message.trim()) return;
        setSending(true);
        const { error } = await supabase
            .from('user_messages')
            .insert({
                user_email: selectedUser,
                message: message.trim(),
                sent_by: 'admin',
            });
        if (error) {
            setError(error.message);
        } else {
            setMessage('');
            fetchMessages(selectedUser);
        }
        setSending(false);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Kullanıcı Mesajları</h2>
                    <p className="text-sm text-slate-500">Kayıtlı kullanıcılara mesaj gönderin ve geçmişi görüntüleyin.</p>
                </div>
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full md:w-64 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                    {users.map((user) => (
                        <option key={user.id} value={user.email}>
                            {user.email}
                        </option>
                    ))}
                </select>
            </div>

            <form onSubmit={handleSend} className="space-y-4 mb-6">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Kullanıcıya göndermek istediğiniz mesaj..."
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    rows={3}
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        {sending ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                    </button>
                </div>
            </form>

            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Son Mesajlar</h3>
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                {loading ? (
                    <p className="text-sm text-slate-500">Yükleniyor...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-500">Bu kullanıcı için mesaj bulunmuyor.</p>
                ) : (
                    <ul className="divide-y divide-slate-200 text-sm text-slate-600">
                        {messages.map((msg) => (
                            <li key={msg.id} className="py-3">
                                <p className="font-medium text-slate-900 mb-1">{msg.message}</p>
                                <p className="text-xs text-slate-500">
                                    {new Date(msg.created_at).toLocaleString('tr-TR')} · Gönderen: {msg.sent_by || 'bilinmiyor'}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserMessagingPanel;
