

import React, { useState, useEffect } from 'react';
import { Customer, RegisteredUser, Lead, SiteSettings } from '../types';
import StatsCards from './StatsCards';
import CustomerTable from './CustomerTable';
import Header from './Header';
import { supabase } from '../lib/supabase';
import UserTable from './UserTable';
import LeadsTable from './LeadsTable';
import PackageEditor from './PackageEditor';
import ContentEditor from './ContentEditor';
import ProofEditor from './ProofEditor';
import ConversionBooster from './ConversionBooster';
import LayoutDashboardIcon from './icons/LayoutDashboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import SiteSettingsEditor from './SiteSettingsEditor';
import StripeSettings from './StripeSettings';
import CreditCardIcon from './icons/CreditCardIcon';
import BlogManager from './BlogManager';
import BlogGeneratorPanel from './BlogGeneratorPanel';
import UserMessagingPanel from './UserMessagingPanel';

interface DashboardProps {
    siteSettings: SiteSettings | null;
    onSettingsUpdate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ siteSettings, onSettingsUpdate }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('dashboard');

    const fetchData = async () => {
        // Don't set loading to true on refetch to avoid flickering
        setError(null);

        try {
            const [customerRes, userRes, leadRes] = await Promise.all([
                supabase.from('customers').select('*').order('join_date', { ascending: false }),
                supabase.rpc('get_all_users'),
                supabase.from('leads').select('*').order('created_at', { ascending: false })
            ]);

            if (customerRes.error) throw new Error(`Müşteri verileri alınırken hata: ${customerRes.error.message}`);
            setCustomers(customerRes.data as Customer[]);

            if (userRes.error) {
                if (userRes.error.message.includes('function public.get_all_users() does not exist')) {
                    throw new Error('Yönetici özelliği yapılandırılmamış: `get_all_users` RPC fonksiyonu eksik. Lütfen kurulum SQL betiğini çalıştırın.');
                }
                throw new Error(`Kayıtlı kullanıcılar alınırken hata: ${userRes.error.message}`);
            }
            setRegisteredUsers(userRes.data as RegisteredUser[]);

            if (leadRes.error) throw new Error(`Müşteri adayları alınırken hata: ${leadRes.error.message}`);
            setLeads(leadRes.data as Lead[]);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch only. Real-time subscriptions removed for free-tier compatibility.
        fetchData();
    }, []);

    const handleDeleteUser = async (userId: string) => {
        try {
            const { error } = await supabase.rpc('delete_user', { user_id: userId });
            if (error) throw error;

            // Refresh the user list
            fetchData();
            alert('Kullanıcı başarıyla silindi.');
        } catch (err: any) {
            console.error('Kullanıcı silinirken hata:', err);
            alert(`Kullanıcı silinemedi: ${err.message}`);
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-slate-900">Tekrar hoş geldin, Admin!</h1>
                        <StatsCards customers={customers} />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <ContentEditor />
                            <SiteSettingsEditor onUpdate={onSettingsUpdate} />
                        </div>
                        <ProofEditor />
                        <LeadsTable leads={leads} onRefresh={fetchData} />
                        <BlogManager />
                        <UserTable users={registeredUsers} onDelete={handleDeleteUser} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <CustomerTable customers={customers} onDataChange={fetchData} />
                            </div>
                            <div>
                                <PackageEditor />
                            </div>
                        </div>
                    </div>
                );
            case 'booster':
                return <ConversionBooster />;
            case 'stripe':
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-slate-900">Stripe Entegrasyonu</h1>
                        <StripeSettings />
                    </div>
                );
            case 'blog':
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-slate-900">Blog & AI İçerik</h1>
                        <BlogGeneratorPanel />
                        <BlogManager />
                    </div>
                );
            case 'messages':
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-slate-900">Mesajlar</h1>
                        <UserMessagingPanel users={registeredUsers} />
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="bg-slate-100 min-h-screen flex">
            <aside className="w-64 bg-white flex-shrink-0 border-r border-slate-200 flex flex-col">
                <div className="h-16 flex items-center px-6 space-x-2 border-b border-slate-200">
                    {siteSettings?.logo_url ? (
                        <img src={siteSettings.logo_url} alt={`${siteSettings.site_name} logo`} className="h-8 max-w-[120px] object-contain" />
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 4a1 1 0 100 2h4a1 1 0 100-2H8z" />
                                <path fillRule="evenodd" d="M3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3.293 8.293a1 1 0 011.414 0L6 9.586V14a1 1 0 11-2 0V9.586L2.293 7.707a1 1 0 010-1.414zM11 14V9.586L12.293 8.293a1 1 0 111.414 1.414L12 11.414V14a1 1 0 11-2 0zM7 14V9.586l-1.707-1.707a1 1 0 00-1.414 1.414L6 11.414V14a1 1 0 102 0zm5 0V9.586l1.707-1.707a1 1 0 10-1.414-1.414L12 11.414V14a1 1 0 102 0z" clipRule="evenodd" />
                                <path d="M4 16a1 1 0 100 2h12a1 1 0 100-2H4z" />
                            </svg>
                            <span className="text-xl font-bold text-slate-800">{siteSettings?.site_name || 'Yönetim'}</span>
                        </>
                    )}
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <NavItem
                        icon={<LayoutDashboardIcon />}
                        label="Yönetim Paneli"
                        isActive={activeView === 'dashboard'}
                        onClick={() => setActiveView('dashboard')}
                    />
                    <NavItem
                        icon={<SparklesIcon />}
                        label="Dönüşüm Arttırıcı"
                        isActive={activeView === 'booster'}
                        onClick={() => setActiveView('booster')}
                    />
                    <NavItem
                        icon={<CreditCardIcon />}
                        label="Stripe Ayarları"
                        isActive={activeView === 'stripe'}
                        onClick={() => setActiveView('stripe')}
                    />
                    <NavItem
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1h-7v2h5a1 1 0 110 2H8a1 1 0 110-2h5v-2H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 9h14V7H5v7z" />
                            </svg>
                        }
                        label="Blog / AI"
                        isActive={activeView === 'blog'}
                        onClick={() => setActiveView('blog')}
                    />
                    <NavItem
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75zm2.25-.75a.75.75 0 0 0-.75.75v.305l8.25 5.156 8.25-5.156v-.305a.75.75 0 0 0-.75-.75h-15zm15.75 3.195-7.614 4.764a.75.75 0 0 1-.772 0L4.5 9.195v8.055a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75V9.195z" />
                            </svg>
                        }
                        label="Mesajlar"
                        isActive={activeView === 'messages'}
                        onClick={() => setActiveView('messages')}
                    />
                </nav>
            </aside>
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                    {loading && (
                        <div className="text-center py-10">
                            <svg className="animate-spin mx-auto h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-slate-600">Veriler yükleniyor...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                            <p className="font-bold">Veri Alınırken Hata Oluştu</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && renderView()}
                </main>
            </div>
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${isActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
        }
    >
        <span className={isActive ? 'text-primary-600' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
    </button>
)

export default Dashboard;
