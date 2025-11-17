

import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Package, SiteSettings, Lead } from '../types';

interface UserDashboardProps {
    user: User;
    siteSettings: SiteSettings | null;
}

const checklist = [
    { id: 1, label: 'Mağaza URL doğrulandı', description: 'Kaydınız sırasında gönderilen mağaza adresini kontrol ediyoruz.' },
    { id: 2, label: 'Analiz raporu hazırlanıyor', description: 'Ürünleriniz ve anahtar kelime puanları çıkarılıyor.' },
    { id: 3, label: 'Strateji görüşmesi', description: 'Strateji ekibimiz sizinle iletişime geçecek.' },
];

const UserDashboard: React.FC<UserDashboardProps> = ({ user, siteSettings }) => {
    const [leadInfo, setLeadInfo] = useState<Lead | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const leadPromise = supabase
                .from('leads')
                .select('*')
                .ilike('email', user.email || '')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            const packagePromise = supabase
                .from('packages')
                .select('*')
                .order('price', { ascending: true });

            const [{ data: leadData, error: leadError }, { data: packageData, error: packageError }] = await Promise.all([leadPromise, packagePromise]);

            if (leadError && leadError.code !== 'PGRST116') {
                console.error('Lead fetch error', leadError);
                setError('Lead bilgileri alınırken bir hata oluştu.');
            } else {
                setLeadInfo(leadData || null);
            }

            if (packageError) {
                console.error('Package fetch error', packageError);
            } else {
                setPackages((packageData as Package[]) || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [user.email]);

    const currentPackage = useMemo(() => {
        if (!leadInfo) return null;
        return packages.find(pkg => pkg.name === leadInfo.selected_package) || null;
    }, [leadInfo, packages]);

    const profileItems = [
        { label: 'E-posta', value: user.email },
        { label: 'Mağaza URL', value: leadInfo?.store_url || user.user_metadata?.etsy_store_url || 'Belirtilmemiş' },
        { label: 'Seçilen Paket', value: leadInfo?.selected_package || 'Henüz paket seçilmemiş' },
        { label: 'Kayıt Tarihi', value: leadInfo?.created_at ? new Date(leadInfo.created_at).toLocaleString('tr-TR') : 'Bekleniyor' },
    ];

    return (
        <div className="min-h-screen bg-slate-100">
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
            
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Merhaba</p>
                                <h1 className="text-3xl font-semibold text-slate-900">{user.user_metadata?.full_name || user.email}</h1>
                                <p className="text-slate-500 mt-1">
                                    Lead talebiniz {leadInfo?.created_at ? new Date(leadInfo.created_at).toLocaleDateString('tr-TR') : 'henüz kaydedilmedi'} tarihinde alındı.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Paket</p>
                                    <p className="text-lg font-semibold text-slate-800">{leadInfo?.selected_package || 'Seçilmedi'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Durum</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${leadInfo ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {leadInfo ? 'İşlemde' : 'Bekliyor'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Hesap Özeti</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profileItems.map((item) => (
                                    <div key={item.label} className="border border-slate-100 rounded-xl p-4">
                                        <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
                                        <dd className="text-sm font-medium text-slate-900 mt-1 break-all">{item.value || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">Onboarding Durumu</h2>
                            <div className="space-y-3">
                                {checklist.map((item, idx) => {
                                    const completed = leadInfo ? idx === 0 || idx === 1 : idx === 0;
                                    return (
                                        <div key={item.id} className="flex items-start gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${completed ? 'bg-primary-500' : 'bg-slate-300'}`}>
                                                {completed ? (
                                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-sm">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                                                <p className="text-xs text-slate-500">{item.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow lg:col-span-2">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan Detayları</h2>
                            {currentPackage ? (
                                <div className="border border-primary-200 rounded-2xl p-5 bg-primary-50/40">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs text-primary-600 uppercase tracking-wide">Seçili Plan</p>
                                            <h3 className="text-2xl font-bold text-primary-800">{currentPackage.name}</h3>
                                        </div>
                                        <p className="text-3xl font-semibold text-primary-800 mt-2 sm:mt-0">
                                            ${currentPackage.price}
                                            <span className="text-base font-normal text-primary-600"> / ay</span>
                                        </p>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                        {currentPackage.features.map(feature => (
                                            <li key={feature} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Henüz kayıtlı bir paket bulunamadı. Başvurunuz işlendiğinde buradan takip edebilirsiniz.</p>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">Destek</h2>
                            <p className="text-sm text-slate-600">
                                Sorularınız mı var? Ekibimiz hafta içi 09:00 - 18:00 saatleri arasında yanıt veriyor.
                            </p>
                            <div className="mt-4 space-y-2 text-sm">
                                <a href="mailto:support@example.com" className="block px-4 py-2 rounded-lg border border-slate-200 hover:bg-primary-50 text-primary-700 text-center">
                                    support@example.com
                                </a>
                                <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-center">
                                    Görüşme Planla
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary-600 text-white rounded-2xl p-6 shadow flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-primary-100">Powered by Etsy Growth Lab</p>
                            <h3 className="text-2xl font-semibold mt-1">Analiz raporunuz hazırlanıyor</h3>
                            <p className="text-primary-100 mt-2 text-sm">Hazır olduğunda size e-posta ile bildireceğiz.</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/15 text-white text-sm font-semibold">
                                Talep ID: {leadInfo?.id || 'bekleniyor'}
                            </span>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-white/60 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-medium text-slate-700">Bilgiler yükleniyor...</span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;
