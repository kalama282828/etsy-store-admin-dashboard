import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import PricingSection from './PricingSection';
import LeadCaptureModal from './LeadCaptureModal';
// FIX: Import FileObject from local types to resolve module export error.
import { SiteContent, ConversionSettings, Package, FileObject, SiteSettings } from '../types';
import { supabase } from '../lib/supabase';
import SocialProofNotification from './SocialProofNotification';
import TurkeyMap from './ActiveSubscriptionsBooster';
import BlogSection from './BlogSection';
import VisitorChatWidget from './VisitorChatWidget';
import PromotionBanner from './PromotionBanner';

const BUCKET_NAME = 'proof_images';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hwukwjitrnzmlglaukmg.supabase.co';

const EN_CONTENT: SiteContent = {
    hero: {
        title: 'Grow your Etsy shop with AI',
        subtitle: 'Our platform helps Etsy service providers launch proof-driven funnels in minutes.',
        formPlaceholder: 'Paste your Etsy shop URL',
        formButton: 'Get Started',
    },
    features: {
        title: 'Everything you need',
        subtitle: 'Keyword intelligence, conversion widgets and package editors built for Etsy experts.',
        cards: [
            { title: 'AI keyword research', description: 'Discover buyer-ready search terms and highlight them in your listings.' },
            { title: 'Conversion boosters', description: 'Launch social proof and lead capture modals optimized for Etsy services.' },
            { title: 'Package management', description: 'Edit price tiers, bullet points and feature highlights instantly.' },
        ],
    },
    pricing: {
        title: 'Flexible Plans',
        subtitle: 'Choose a plan that matches your service workflow.',
    },
    proof: {
        title: 'Success stories',
        subtitle: 'Trusted by boutique Etsy agencies across the globe.',
    },
};

import { useLanguage } from './LanguageContext';

interface LoginScreenProps {
    siteSettings: SiteSettings | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ siteSettings }) => {
    const { language, setLanguage } = useLanguage();
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [content, setContent] = useState<SiteContent | null>(null);
    const [loadingContent, setLoadingContent] = useState(true);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [proofImages, setProofImages] = useState<FileObject[]>([]);


    const fetchProofImages = async () => {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
            limit: 12,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });
        if (error) {
            console.error("Error fetching proof images:", error);
        } else {
            setProofImages(data || []);
        }
    };


    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingContent(true);

            const contentPromise = supabase
                .from('site_content')
                .select('content')
                .eq('id', 1)
                .single();

            const imagesPromise = fetchProofImages();

            const [contentRes] = await Promise.all([contentPromise, imagesPromise]);

            if (contentRes.error) {
                console.error("Error fetching site content:", contentRes.error);
            } else {
                setContent(contentRes.data.content);
            }
            setLoadingContent(false);
        };
        fetchInitialData();
    }, []);

    const getTimeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " yıl önce";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " ay önce";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " gün önce";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " saat önce";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " dakika önce";
        return "az önce";
    };

    useEffect(() => {
        let timeoutId: number;

        const setupNotifications = async () => {
            const { data: settingsData, error: settingsError } = await supabase
                .from('conversion_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (settingsError || !settingsData || !settingsData.is_enabled) {
                return;
            }

            const settings: ConversionSettings = settingsData;

            let { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('name, selected_package, created_at')
                .limit(10)
                .order('created_at', { ascending: false });

            if (leadsError) {
                console.error("Error fetching leads for notifications:", leadsError);
                return;
            }

            // If no real leads, use mock data to ensure the feature is visible
            if (!leadsData || leadsData.length === 0) {
                leadsData = [
                    { name: 'Ayşe T.', selected_package: 'Pro', created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
                    { name: 'Murat S.', selected_package: 'Premium', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
                    { name: 'Zeynep A.', selected_package: 'Basic', created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
                    { name: 'Can B.', selected_package: 'Pro', created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
                ];
            }


            const showRandomNotification = () => {
                const randomLead = leadsData![Math.floor(Math.random() * leadsData!.length)];
                if (!settings.templates || settings.templates.length === 0) return;
                const randomTemplate = settings.templates[Math.floor(Math.random() * settings.templates.length)];

                const timeAgo = getTimeAgo(new Date(randomLead.created_at));

                const message = randomTemplate
                    .replace('{{name}}', randomLead.name.split(' ')[0])
                    .replace('{{package}}', randomLead.selected_package)
                    .replace('{{time}}', timeAgo);

                setNotificationMessage(message);
            };

            const getRandomInterval = () => {
                return (settings.min_interval * 1000) + Math.random() * 12000;
            }

            const scheduleNext = () => {
                timeoutId = window.setTimeout(() => {
                    showRandomNotification();
                    scheduleNext();
                }, getRandomInterval());
            }

            // Delay initial start using the value from settings
            timeoutId = window.setTimeout(scheduleNext, settings.min_interval * 1000);
        };

        setupNotifications();

        return () => clearTimeout(timeoutId);
    }, []);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim() === '' || !url.includes('etsy.com/shop/')) {
            setError('Lütfen geçerli bir Etsy mağaza URL\'si girin.');
        } else {
            setError('');
            setIsAuthModalOpen(true);
        }
    };

    const handlePayClick = (packageName: string) => {
        setSelectedPackage(packageName);
        setIsLeadModalOpen(true);
    };

    const displayContent = language === 'en' ? EN_CONTENT : (content || EN_CONTENT);

    if (language === 'tr' && (loadingContent || !content)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    const featureIcons = [
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>,
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>,
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>,
    ];


    return (
        <>
            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden">
                <PromotionBanner text={siteSettings?.promotion_banner_text} isActive={siteSettings?.promotion_banner_active} />
                <div className="fixed bottom-6 left-6 z-50 flex gap-2">
                    {(['tr', 'en'] as const).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${language === lang ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>
                {isAuthModalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative transform transition-all animate-scaleIn">
                            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <Auth etsyUrl={url} language={language} />
                        </div>
                    </div>
                )}

                {isLeadModalOpen && (
                    <LeadCaptureModal
                        packageName={selectedPackage}
                        onClose={() => setIsLeadModalOpen(false)}
                        stripeCheckoutUrl={siteSettings?.stripe_checkout_url || undefined}
                    />
                )}

                <SocialProofNotification message={notificationMessage} />

                <header
                    className="absolute left-0 right-0 z-10 py-6 px-4 sm:px-6 lg:px-8 transition-all duration-300"
                    style={{ top: siteSettings?.promotion_banner_active ? '44px' : '0' }}
                >
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            {siteSettings?.logo_url ? (
                                <img src={siteSettings.logo_url} alt={`${siteSettings.site_name} logo`} className="h-8 object-contain" />
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 4a1 1 0 100 2h4a1 1 0 100-2H8z" /><path fillRule="evenodd" d="M3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3.293 8.293a1 1 0 011.414 0L6 9.586V14a1 1 0 11-2 0V9.586L2.293 7.707a1 1 0 010-1.414zM11 14V9.586L12.293 8.293a1 1 0 111.414 1.414L12 11.414V14a1 1 0 11-2 0zM7 14V9.586l-1.707-1.707a1 1 0 00-1.414 1.414L6 11.414V14a1 1 0 102 0zm5 0V9.586l1.707-1.707a1 1 0 10-1.414-1.414L12 11.414V14a1 1 0 102 0z" clipRule="evenodd" /><path d="M4 16a1 1 0 100 2h12a1 1 0 100-2H4z" />
                                    </svg>
                                    <span className="text-xl font-bold text-slate-800">{siteSettings?.site_name || 'Etsy Admin'}</span>
                                </>
                            )}
                        </div>
                        <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-full hover:bg-primary-50 transition-colors">
                            {language === 'en' ? 'Sign In' : 'Giriş Yap'}
                        </button>
                    </div>
                </header>

                <main>
                    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight animate-fadeInUp">
                                {displayContent.hero.title}
                            </h1>
                            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                {displayContent.hero.subtitle}
                            </p>
                            <form onSubmit={handleUrlSubmit} className="mt-8 max-w-xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={displayContent.hero.formPlaceholder}
                                        className="flex-grow w-full px-5 py-3.5 text-base bg-white border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                    />
                                    <button
                                        type="submit"
                                        className="px-8 py-3.5 text-base font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        {displayContent.hero.formButton}
                                    </button>
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </form>
                        </div>
                    </section>

                    <section className="py-20 lg:py-24 bg-slate-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <TurkeyMap />
                        </div>
                    </section>

                    {proofImages.length > 0 && (
                        <section className="py-20 bg-slate-50 overflow-hidden">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">{displayContent.proof.title}</h2>
                                <p className="text-center text-slate-500 mt-4 max-w-2xl mx-auto text-lg">{displayContent.proof.subtitle}</p>
                            </div>
                            <div className="mt-12">
                                <div className="flex animate-marquee-slow">
                                    {[...proofImages, ...proofImages].map((image, index) => (
                                        <div key={`${image.id}-${index}`} className="flex-shrink-0 w-[450px] aspect-video mx-4 rounded-xl overflow-hidden shadow-xl">
                                            <img src={`${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${image.name}`} alt={`Proof image ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="py-20 lg:py-28 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-900">{displayContent.pricing.title}</h2>
                                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">{displayContent.pricing.subtitle}</p>
                            </div>
                            <div className="mt-16 max-w-5xl mx-auto">
                                <PricingSection onPayClick={handlePayClick} language={language} />
                            </div>
                        </div>
                    </section>

                    <section className="py-20 lg:py-28 bg-slate-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-base font-semibold text-primary-600 tracking-wider uppercase">
                                    {language === 'en' ? 'Features' : 'Özellikler'}
                                </h2>
                                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{displayContent.features.title}</p>
                                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">{displayContent.features.subtitle}</p>
                            </div>
                            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {displayContent.features.cards.map((feature, index) => (
                                    <div key={index} className="bg-white p-6 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:-translate-y-2 border border-slate-200/80">
                                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                                            {featureIcons[index % featureIcons.length]}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mt-5">{feature.title}</h3>
                                        <p className="mt-2 text-slate-600">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    <BlogSection />
                    <VisitorChatWidget language={language} />
                </main>
            </div>
        </>
    );
};

export default LoginScreen;
