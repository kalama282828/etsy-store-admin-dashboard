import React, { useEffect, useState } from 'react';
import { RegisteredUser } from '../types';
import LiveChatWidget from './LiveChatWidget';
import { ADMIN_CHAT_ID } from '../constants';
import { supabase } from '../lib/supabase';
import { useLanguage } from './LanguageContext';

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
    const { t } = useLanguage();
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [activeConversations, setActiveConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('active');

    useEffect(() => {
        fetchConversations();
        
        // Listen for new messages so the conversation list stays in sync in real-time.
        const channel = supabase
            .channel('admin-conversation-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => fetchConversations()
            )
            .subscribe();

        // Poll as a fallback in case realtime is disabled.
        const intervalId = window.setInterval(fetchConversations, 7000);

        return () => {
            window.clearInterval(intervalId);
            supabase.removeChannel(channel);
        };
    }, [users]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const { data: messages, error } = await supabase
                .from('messages')
                .select('conversation_id, sender_id, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by conversation id (email)
            const conversationMap = new Map<string, ConversationItem>();

            messages?.forEach((msg) => {
                // Fallback: some eski kayıtlar conversation_id içermeyebilir, o zaman sender_id'yi kullan.
                const conversationEmail = msg.conversation_id || (msg.sender_id !== 'admin' ? msg.sender_id : null);
                if (!conversationEmail) return;

                const already = conversationMap.get(conversationEmail);

                if (!already) {
                    const user = users.find(u => u.email === conversationEmail);
                    conversationMap.set(conversationEmail, {
                        email: conversationEmail,
                        isRegistered: !!user,
                        lastActive: msg.created_at,
                        name: user?.etsy_store_url,
                        isArchived: false // Default, will be updated below
                    });
                } else if (new Date(msg.created_at).getTime() > new Date(already.lastActive || '').getTime()) {
                    conversationMap.set(conversationEmail, { ...already, lastActive: msg.created_at });
                }
            });

            // Fetch archived status
            const { data: conversationStates, error: stateError } = await supabase
                .from('conversation_states')
                .select('user_email, is_archived');

            if (!stateError && conversationStates) {
                conversationStates.forEach(state => {
                    if (conversationMap.has(state.user_email)) {
                        const conv = conversationMap.get(state.user_email)!;
                        conv.isArchived = state.is_archived;
                        conversationMap.set(state.user_email, conv);
                    }
                });
            }

            // Most recent first
            const sorted = Array.from(conversationMap.values()).sort((a, b) => {
                const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
                const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
                return bTime - aTime;
            });
            setActiveConversations(sorted);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (email: string) => {
        try {
            const conversation = activeConversations.find(c => c.email === email);
            if (!conversation) return;

            const newArchivedState = !conversation.isArchived;

            const { error } = await supabase
                .from('conversation_states')
                .upsert({
                    user_email: email,
                    is_archived: newArchivedState,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_email' });

            if (error) throw error;

            // Update local state
            setActiveConversations(prev => prev.map(c =>
                c.email === email ? { ...c, isArchived: newArchivedState } : c
            ));

            // If we're archiving, we might want to clear selection if it was the selected one
            if (newArchivedState && selectedEmail === email && activeTab === 'active') {
                setSelectedEmail('');
            }
        } catch (error) {
            console.error('Error archiving conversation:', error);
            alert(t('error'));
        }
    };

    const handleDelete = async (email: string) => {
        if (!window.confirm(t('delete_confirm'))) return;

        try {
            // Delete messages in this conversation
            const { error: msgError } = await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', email);

            if (msgError) throw msgError;

            // Delete state
            const { error: stateError } = await supabase
                .from('conversation_states')
                .delete()
                .eq('user_email', email);

            if (stateError) throw stateError;

            // Update local state
            setActiveConversations(prev => prev.filter(c => c.email !== email));
            if (selectedEmail === email) {
                setSelectedEmail('');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert(t('error'));
        }
    };

    return (
        <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl overflow-hidden h-[600px] flex">
            {/* Sidebar - Conversation List */}
            <div className="w-1/3 border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white mb-4 tracking-tight">{t('messages_title')}</h2>
                    <div className="flex p-1 bg-black/40 rounded-xl mb-2">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'active'
                                ? 'bg-metallic-800 text-white shadow-lg'
                                : 'text-metallic-400 hover:text-metallic-200'
                                }`}
                        >
                            {t('messages_tab_active')}
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'archived'
                                ? 'bg-metallic-800 text-white shadow-lg'
                                : 'text-metallic-400 hover:text-metallic-200'
                                }`}
                        >
                            {t('messages_tab_archived')}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-center text-metallic-500 text-sm">{t('loading')}</div>
                    ) : activeConversations.length === 0 ? (
                        <div className="p-4 text-center text-metallic-500 text-sm">
                            {activeTab === 'active' ? t('messages_no_active') : t('messages_no_archived')}
                        </div>
                    ) : (
                        activeConversations
                            .filter(c => activeTab === 'archived' ? c.isArchived : !c.isArchived)
                            .map((conv) => (
                                <div
                                    key={conv.email}
                                    onClick={() => setSelectedEmail(conv.email)}
                                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${selectedEmail === conv.email ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'border-l-2 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-semibold text-sm ${selectedEmail === conv.email ? 'text-white' : 'text-metallic-200'}`}>
                                            {conv.name || conv.email}
                                        </span>
                                        {conv.isRegistered && (
                                            <span className="bg-primary-500/10 text-primary-400 text-[10px] px-2 py-0.5 rounded-full border border-primary-500/20">
                                                {t('user_status_registered')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-metallic-400 truncate mb-1">
                                        {conv.email}
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-metallic-500">
                                            {conv.lastActive ? new Date(conv.lastActive).toLocaleDateString() : ''}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {activeTab === 'active' ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleArchive(conv.email);
                                                    }}
                                                    className="p-1 hover:bg-metallic-700 rounded text-metallic-400 hover:text-white"
                                                    title={t('archive')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                                        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(conv.email);
                                                    }}
                                                    className="p-1 hover:bg-red-900/30 rounded text-metallic-400 hover:text-red-400"
                                                    title={t('delete')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-transparent relative">
                {selectedEmail ? (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md">
                            <div>
                                <h3 className="font-bold text-white">
                                    {activeConversations.find(c => c.email === selectedEmail)?.name || selectedEmail}
                                </h3>
                                <span className="text-xs text-metallic-400">{selectedEmail}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <LiveChatWidget
                                mode="panel"
                                conversationId={selectedEmail}
                                senderId={ADMIN_CHAT_ID}
                                displayName="Admin"
                                counterpartId={selectedEmail}
                                role="admin"
                                label={`Chat: ${selectedEmail}`}
                                onMessageCreated={fetchConversations}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-metallic-500 flex-col gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>{t('messages_select_conversation')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMessagingPanel;
