import React, { useEffect, useState, useMemo } from 'react';
import { RegisteredUser } from '../types';
import LiveChatWidget from './LiveChatWidget';
import { ADMIN_CHAT_ID } from '../constants';
import { supabase } from '../lib/supabase';

interface UserMessagingPanelProps {
    users: RegisteredUser[];
}

interface ConversationItem {
    email: string;
    isRegistered: boolean;
    lastActive?: string;
    name?: string;
}

const UserMessagingPanel: React.FC<UserMessagingPanelProps> = ({ users }) => {
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [activeConversations, setActiveConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            // 1. Get all unique users who have sent messages
            const { data: messages, error } = await supabase
                .from('user_messages')
                .select('user_email, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching messages:', error);
                setLoading(false);
                return;
            }

            // 2. Process messages to get unique emails and latest activity
            const conversationMap = new Map<string, string>(); // email -> last_created_at

            messages?.forEach((msg: any) => {
                if (msg.user_email === ADMIN_CHAT_ID) return; // Don't list admin as a conversation partner
                if (!conversationMap.has(msg.user_email)) {
                    conversationMap.set(msg.user_email, msg.created_at);
                }
            });

            // 3. Merge with registered users
            // Create a map of registered users for easy lookup
            const registeredUserMap = new Map<string, RegisteredUser>(users.map(u => [u.email, u]));

            // Start with users from messages
            const combinedConversations: ConversationItem[] = Array.from(conversationMap.entries()).map(([email, lastActive]) => ({
                email,
                isRegistered: registeredUserMap.has(email),
                lastActive,
                name: registeredUserMap.get(email)?.email // Use email as name since RegisteredUser interface has email
            }));

            // Add registered users who haven't messaged yet (optional, but good for visibility)
            users.forEach(user => {
                if (!conversationMap.has(user.email)) {
                    combinedConversations.push({
                        email: user.email,
                        isRegistered: true,
                        lastActive: user.created_at, // Use account creation as fallback
                    });
                }
            });

            // Sort by last active (most recent first)
            combinedConversations.sort((a, b) => {
                const dateA = new Date(a.lastActive || 0).getTime();
                const dateB = new Date(b.lastActive || 0).getTime();
                return dateB - dateA;
            });

            setActiveConversations(combinedConversations);

            // Select first conversation if none selected
            if (!selectedEmail && combinedConversations.length > 0) {
                setSelectedEmail(combinedConversations[0].email);
            }

            setLoading(false);
        };

        fetchConversations();

        // Subscribe to new messages to update the list order
        const channel = supabase
            .channel('public:user_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_messages' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [users]); // Re-run if users prop changes, but mainly we rely on internal fetch

    // Handle initial selection if users prop loads later
    useEffect(() => {
        if (!selectedEmail && activeConversations.length > 0) {
            setSelectedEmail(activeConversations[0].email);
        }
    }, [activeConversations, selectedEmail]);


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

    if (loading && activeConversations.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (activeConversations.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm text-slate-500">Henüz mesaj veya kullanıcı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="border border-slate-200 rounded-2xl h-[600px] overflow-y-auto flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                        <h3 className="font-semibold text-slate-700">Sohbetler</h3>
                    </div>
                    <ul className="divide-y divide-slate-100 text-sm flex-1 overflow-y-auto">
                        {activeConversations.map((conv) => (
                            <li
                                key={conv.email}
                                className={`px-4 py-4 cursor-pointer transition-colors ${selectedEmail === conv.email ? 'bg-primary-50 border-l-4 border-primary-600' : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'}`}
                                onClick={() => setSelectedEmail(conv.email)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-medium ${selectedEmail === conv.email ? 'text-primary-900' : 'text-slate-900'}`}>
                                        {conv.email}
                                    </span>
                                    {conv.isRegistered ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Üye</span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Ziyaretçi</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {conv.lastActive ? new Date(conv.lastActive).toLocaleString('tr-TR') : 'Tarih yok'}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-2 h-[600px] flex flex-col">
                    {selectedEmail ? (
                        <LiveChatWidget
                            mode="panel"
                            conversationId={selectedEmail}
                            senderId={ADMIN_CHAT_ID}
                            displayName="Admin"
                            counterpartId={selectedEmail}
                            role="admin"
                            label={`Sohbet: ${selectedEmail}`}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                            Bir kullanıcı seçin.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserMessagingPanel;
