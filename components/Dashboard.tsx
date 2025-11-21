import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from './LanguageContext';
import { RegisteredUser, SiteSettings, Lead } from '../types';
import UserTable from './UserTable';
import LeadsTable from './LeadsTable';
import SiteSettingsEditor from './SiteSettingsEditor';
import UserMessagingPanel from './UserMessagingPanel';

interface DashboardProps {
    session: any;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState('dashboard');
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, leadsRes, settingsRes] = await Promise.all([
                supabase.from('registered_users').select('*').order('created_at', { ascending: false }),
                supabase.from('leads').select('*').order('created_at', { ascending: false }),
                supabase.from('site_settings').select('*').single()
            ]);

            if (usersRes.error) throw usersRes.error;
            if (leadsRes.error) throw leadsRes.error;

            setRegisteredUsers(usersRes.data || []);
            setLeads(leadsRes.data || []);
            if (settingsRes.data) setSiteSettings(settingsRes.data);

        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleUpdateUserUrl = async (userId: string, newUrl: string) => {
        try {
            const { error } = await supabase.rpc('update_user_store_url', {
                user_uuid: userId,
                new_url: newUrl
            });

            if (error) throw error;

            // Refresh data
            const { data: updatedUser, error: fetchError } = await supabase
                .from('registered_users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            setRegisteredUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            alert(t('success'));
        } catch (error: any) {
            console.error('Error updating URL:', error);
            alert(t('error') + ': ' + error.message);
        }
    };

    const handleUpdateLeadUrl = async (leadId: number, newUrl: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ store_url: newUrl })
                .eq('id', leadId);

            if (error) throw error;

            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, store_url: newUrl } : l));
            alert(t('success'));
        } catch (error: any) {
            console.error('Error updating lead URL:', error);
            alert(t('error') + ': ' + error.message);
        }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-metallic-400 text-sm font-medium">{t('stats_active_users')}</h3>
                                <p className="text-3xl font-bold text-white mt-2">{registeredUsers.length}</p>
                                <div className="mt-2 text-xs text-green-400 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                    +12% {t('stats_active_now')}
                                </div>
                            </div>
                            <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-metallic-400 text-sm font-medium">{t('leads_table_title')}</h3>
                                <p className="text-3xl font-bold text-white mt-2">{leads.length}</p>
                            </div>
                            <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-metallic-400 text-sm font-medium">{t('stats_total_revenue')}</h3>
                                <p className="text-3xl font-bold text-white mt-2">$0.00</p>
                            </div>
                            <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-metallic-400 text-sm font-medium">{t('stats_conversion_rate')}</h3>
                                <p className="text-3xl font-bold text-white mt-2">0%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <UserTable users={registeredUsers} onDelete={() => fetchData()} onUpdateUrl={handleUpdateUserUrl} />
                            <LeadsTable leads={leads} onUpdateUrl={handleUpdateLeadUrl} />
                        </div>
                    </div>
                );
            case 'booster':
                return (
                    <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">{t('dashboard_menu_booster')}</h2>
                        <SiteSettingsEditor />
                    </div>
                );
            case 'stripe':
                return (
                    <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">{t('dashboard_stripe_title')}</h2>
                        <p className="text-metallic-400">Stripe integration settings coming soon.</p>
                    </div>
                );
            case 'blog':
                return (
                    <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">{t('dashboard_blog_title')}</h2>
                        <p className="text-metallic-400">Blog management interface coming soon.</p>
                    </div>
                );
            case 'messages':
                return (
                    <div className="h-[calc(100vh-12rem)]">
                        <UserMessagingPanel users={registeredUsers} />
                    </div>
                );
            default:
                return null;
        }
    };

    const NavItem = ({ id, icon, label }: { id: string, icon: any, label: string }) => (
        <button
            onClick={() => setActiveView(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === id
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                : 'text-metallic-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
        >
            <div className={`${activeView === id ? 'text-primary-400' : 'text-metallic-500 group-hover:text-white'} transition-colors`}>
                {icon}
            </div>
            <span className="font-medium text-sm">{label}</span>
            {activeView === id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_currentColor]"></div>
            )}
        </button>
    );

    return (
        <div className="flex h-screen bg-metallic-950 overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-metallic-900 via-metallic-950 to-black z-0 pointer-events-none"></div>

            {/* Sidebar */}
            <aside className="w-64 bg-metallic-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-10">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            {siteSettings?.site_name || t('site_name_default')}
                        </span>
                    </div>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <NavItem
                        id="dashboard"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        }
                        label={t('dashboard_menu_dashboard')}
                    />
                    <NavItem
                        id="booster"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                        label={t('dashboard_menu_booster')}
                    />
                    <NavItem
                        id="stripe"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        }
                        label={t('dashboard_menu_stripe')}
                    />
                    <NavItem
                        id="blog"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        }
                        label={t('dashboard_menu_blog')}
                    />
                    <NavItem
                        id="messages"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        }
                        label={t('dashboard_menu_messages')}
                    />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-transparent relative z-10 custom-scrollbar">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">{t('dashboard_welcome')}</h1>
                            <p className="text-metallic-400 text-sm mt-1">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="p-2 rounded-xl bg-metallic-900/50 border border-white/10 text-metallic-400 hover:text-white hover:bg-white/5 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-metallic-900/50 border border-white/10 text-metallic-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all text-sm font-medium"
                            >
                                {t('site_name_default') === 'Admin' ? 'Logout' : 'Çıkış Yap'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {renderContent()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
