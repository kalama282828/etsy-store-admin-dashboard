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
    isArchived?: boolean;
}

type Tab = 'active' | 'archived';

const UserMessagingPanel: React.FC<UserMessagingPanelProps> = ({ users }) => {
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [activeConversations, setActiveConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('active');

    const handleArchive = async (email: string, archive: boolean) => {
        // Optimistic update
        setActiveConversations(prev => prev.map(c =>
            c.email === email ? { ...c, isArchived: archive } : c
        ));

        // If we are archiving the currently selected one, deselect it
        if (archive && selectedEmail === email) {
            setSelectedEmail('');
        }

        const { error } = await supabase
            .from('conversation_states')
            .upsert({
                user_email: email,
                is_archived: archive,
                is_deleted: false
            }, { onConflict: 'user_email' });

        if (error) {
            console.error('Error archiving conversation:', error);
            // Revert on error (could add toast here)
        }
    };

    const handleDelete = async (email: string) => {
        if (!window.confirm('Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

        // Optimistic update
        setActiveConversations(prev => prev.filter(c => c.email !== email));
        if (selectedEmail === email) setSelectedEmail('');

        const { error } = await supabase
            .from('conversation_states')
            .upsert({
                user_email: email,
                is_deleted: true
            }, { onConflict: 'user_email' });

        if (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            // 1. Get all unique users who have sent messages
            const { data: messages, error } = await supabase
                .from('user_messages')
                .select('user_email, created_at')
                .order('created_at', { ascending: false });

            const { data: states, error: statesError } = await supabase
                .from('conversation_states')
                .select('*');

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
            const stateMap = new Map(states?.map((s: any) => [s.user_email, s]) || []);

            // Start with users from messages
            const combinedConversations: ConversationItem[] = Array.from(conversationMap.entries()).map(([email, lastActive]) => ({
                email,
                isRegistered: registeredUserMap.has(email),
                lastActive,
                name: registeredUserMap.get(email)?.email, // Use email as name since RegisteredUser interface has email
                isArchived: stateMap.get(email)?.is_archived || false
            }));

            // Add registered users who haven't messaged yet (optional, but good for visibility)
            users.forEach(user => {
                if (!conversationMap.has(user.email)) {
                    combinedConversations.push({
                        email: user.email,
                        isRegistered: true,
                        lastActive: user.created_at, // Use account creation as fallback
                        isArchived: stateMap.get(user.email)?.is_archived || false
                    });
                }
            });

            // Filter out deleted conversations
            const nonDeleted = combinedConversations.filter(c => !stateMap.get(c.email)?.is_deleted);

            // Sort by last active (most recent first)
            combinedConversations.sort((a, b) => {
                const dateA = new Date(a.lastActive || 0).getTime();
                const dateB = new Date(b.lastActive || 0).getTime();
                return dateB - dateA;
            });

            setActiveConversations(nonDeleted);

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
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeTab === 'active' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                Aktif
                            </button>
                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeTab === 'archived' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                Arşiv
                            </button>
                        </div>
                    </div>
                    <ul className="divide-y divide-slate-100 text-sm flex-1 overflow-y-auto">
                        {activeConversations
                            .filter(c => activeTab === 'archived' ? c.isArchived : !c.isArchived)
                            .map((conv) => (
                                <li
                                    key={conv.email}
                                    className={`px-4 py-4 cursor-pointer transition-colors group relative ${selectedEmail === conv.email ? 'bg-primary-50 border-l-4 border-primary-600' : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'}`}
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

                                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleArchive(conv.email, !conv.isArchived); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                            title={conv.isArchived ? "Arşivden Çıkar" : "Arşivle"}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(conv.email); }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            title="Sil"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
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
