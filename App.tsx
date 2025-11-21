

import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import UserDashboard from './components/UserDashboard';
import Footer from './components/layout/Footer';
import { SiteSettings } from './types';
import { LanguageProvider, useLanguage } from './components/LanguageContext';

// Admin panel credentials for demonstration.
// To login as admin, use:
// Email: rahimolkam@gmail.com
// Password: your chosen password during sign-up
// IMPORTANT: You must first sign up with this email.
const ADMIN_EMAIL = 'rahimolkam@gmail.com';

const SupabaseCredentialsWarning: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-900 p-4">
      <div className="max-w-2xl text-center bg-white p-8 rounded-lg border-2 border-red-200 shadow-lg">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="mt-4 text-2xl font-bold">Supabase Yapılandırması Gerekli</h1>
        <p className="mt-2">
          Uygulamanın çalışması için Supabase proje bilgilerinizi girmeniz gerekiyor. Lütfen aşağıdaki dosyayı açın ve kendi Supabase projenizin URL'si ve Anon Anahtarı ile güncelleyin:
        </p>
        <div className="mt-4 bg-slate-100 p-3 rounded-md text-left font-mono text-sm text-slate-800">
          <code>/lib/supabase.ts</code>
        </div>
        <p className="mt-4 text-sm">
          Bu bilgileri Supabase projenizin "Project Settings" &gt; "API" bölümünde bulabilirsiniz.
        </p>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { language, setLanguage } = useLanguage();

  // Check for placeholder credentials before doing anything else.
  if (supabaseUrl.includes('your-project-url') || supabaseAnonKey.includes('your-anon-key')) {
    return <SupabaseCredentialsWarning />;
  }

  const fetchSiteSettings = async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error fetching site settings:", error);
    } else {
      const normalized = data
        ? {
          ...data,
          page_title: data.page_title || data.site_name || 'Etsy Store Admin',
          stripe_publishable_key: data.stripe_publishable_key || '',
          stripe_secret_key: data.stripe_secret_key || '',
          stripe_checkout_url: data.stripe_checkout_url || '',
          favicon_url: data.favicon_url || '',
          footer_text: data.footer_text || '',
          blog_topic: data.blog_topic || '',
          gemini_api_key: data.gemini_api_key || '',
          promotion_banner_text: data.promotion_banner_text || '',
          promotion_banner_text_en: data.promotion_banner_text_en || '',
          promotion_banner_active: data.promotion_banner_active || false,
        }
        : {
          site_name: 'Etsy Admin',
          logo_url: null,
          page_title: 'Etsy Store Admin',
          stripe_publishable_key: '',
          stripe_secret_key: '',
          stripe_checkout_url: '',
          favicon_url: '',
          footer_text: '',
          blog_topic: '',
          gemini_api_key: '',
          promotion_banner_text: '',
          promotion_banner_active: false,
        };
      setSiteSettings(normalized);
    }
    setLoadingSettings(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    fetchSiteSettings();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fallbackTitle = siteSettings?.page_title || siteSettings?.site_name || 'Etsy Store Admin';
    document.title = fallbackTitle;
  }, [siteSettings?.page_title, siteSettings?.site_name, siteSettings?.footer_text]);

  useEffect(() => {
    const faviconHref = siteSettings?.favicon_url || '/favicon.ico';
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link?.href !== faviconHref) {
      link.href = faviconHref;
    }
  }, [siteSettings?.favicon_url]);

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-2xl font-semibold">Yükleniyor...</span>
      </div>
    );
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1">
          <LoginScreen siteSettings={siteSettings} />
        </div>
        <Footer text={siteSettings?.footer_text} />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-metallic-950 text-metallic-200 flex flex-col">
        <div className="flex-1">
          {session ? (
            isAdmin ? (
              <Dashboard siteSettings={siteSettings} onSettingsUpdate={fetchSiteSettings} />
            ) : (
              <UserDashboard user={session.user} siteSettings={siteSettings} />
            )
          ) : (
            // This part should ideally not be reached if !session check above works
            // but included for completeness based on the provided snippet's structure
            <LoginScreen siteSettings={siteSettings} />
          )}
        </div>
        <Footer text={siteSettings?.footer_text} />
      </div>
    </LanguageProvider>
  );
};

export default App;
