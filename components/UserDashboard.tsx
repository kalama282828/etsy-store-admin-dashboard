

import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';

interface UserDashboardProps {
    user: User;
    siteSettings: SiteSettings | null;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, siteSettings }) => {
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header section with consistent styling */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                           {siteSettings?.logo_url ? (
                                <img src={siteSettings.logo_url} alt={`${siteSettings.site_name} logo`} className="h-8 object-contain" />
                            ) : (
                               <>
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                                <span className="text-xl font-bold text-slate-800">{siteSettings?.site_name || 'Panelim'}</span>
                               </>
                            )}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>
            
            {/* Main content with animation and soft UI card */}
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-xl animate-fadeInUp">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Tekrar hoş geldin!</h1>
                    <p className="mt-1 text-lg text-slate-500 truncate">{user.email}</p>
                    
                    <div className="mt-8 border-t border-slate-200 pt-8">
                         <p className="text-slate-600">Burası kişisel paneliniz. Talep ettiğiniz mağaza analizi özelliği yakında burada mevcut olacak.</p>
                         <p className="mt-2 text-slate-600">Etsy mağazanızın sıralamasını yükseltmek için size en iyi araçları sunmak üzere çalışıyoruz.</p>
                         
                         <div className="mt-6 p-5 bg-primary-50 border border-primary-200 rounded-xl flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary-800">Sonraki Adım: Çok Yakında!</h3>
                                <p className="text-primary-700/90 text-sm">Tam mağaza analizi işlevselliğini kısa süre içinde etkinleştireceğiz. Sabrınız için teşekkür ederiz!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;