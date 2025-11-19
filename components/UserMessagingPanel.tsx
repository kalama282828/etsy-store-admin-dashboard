import React, { useEffect, useState } from 'react';
import { RegisteredUser } from '../types';
import LiveChatWidget from './LiveChatWidget';

interface UserMessagingPanelProps {
    users: RegisteredUser[];
}

const UserMessagingPanel: React.FC<UserMessagingPanelProps> = ({ users }) => {
    const [selectedEmail, setSelectedEmail] = useState(users[0]?.email || '');
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        if (!selectedEmail && users.length > 0) {
            setSelectedEmail(users[0].email);
        }
    }, [users, selectedEmail]);

    if (!users.length) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm text-slate-500">Henüz kullanıcı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Canlı Chat</h2>
                    <p className="text-sm text-slate-500">Bir kullanıcı seçip pencereyi açtığınızda mesajlaşmaya başlayabilirsiniz.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.email}>
                                {user.email}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setChatOpen((prev) => !prev)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        {chatOpen ? 'Pencereyi Kapat' : 'Chat Penceresini Aç'}
                    </button>
                </div>
            </div>
            {chatOpen && selectedEmail && (
                <div className="mt-4 border border-slate-200 rounded-2xl">
                    <LiveChatWidget email={selectedEmail} displayName="Admin" label={`Chat: ${selectedEmail}`} />
                </div>
            )}
        </div>
    );
};

export default UserMessagingPanel;
