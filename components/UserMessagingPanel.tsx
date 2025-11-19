import React, { useEffect, useState } from 'react';
import { RegisteredUser } from '../types';
import LiveChatWidget from './LiveChatWidget';
import { ADMIN_CHAT_ID } from '../constants';
import { supabase } from '../lib/supabase';

interface UserMessagingPanelProps {
    users: RegisteredUser[];
}

const UserMessagingPanel: React.FC<UserMessagingPanelProps> = ({ users }) => {
    const [selectedEmail, setSelectedEmail] = useState(users[0]?.email || '');

    useEffect(() => {
        if (!selectedEmail && users.length > 0) {
            setSelectedEmail(users[0].email);
        }
    }, [users, selectedEmail]);

    useEffect(() => {
        const markPresence = async (isOnline: boolean) => {
            await supabase.from('chat_presence').upsert({
                email: ADMIN_CHAT_ID,
                role: 'admin',
                is_online: isOnline,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
        };
        markPresence(true);
        return () => {
            markPresence(false);
        };
    }, []);

    if (!users.length) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm text-slate-500">Henüz kullanıcı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="border border-slate-200 rounded-2xl h-96 overflow-y-auto">
                    <ul className="divide-y divide-slate-200 text-sm">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className={`px-4 py-3 cursor-pointer ${selectedEmail === user.email ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                onClick={() => setSelectedEmail(user.email)}
                            >
                                <p>{user.email}</p>
                                <p className="text-xs text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : ''}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-2">
                    {selectedEmail ? (
                        <LiveChatWidget
                            mode="panel"
                            conversationId={selectedEmail}
                            senderId={ADMIN_CHAT_ID}
                            displayName="Admin"
                            counterpartId={selectedEmail}
                            role="admin"
                            label={`Chat: ${selectedEmail}`}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center text-sm text-slate-500">Bir kullanıcı seçin.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserMessagingPanel;
