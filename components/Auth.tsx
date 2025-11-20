

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
    etsyUrl?: string;
    language?: 'tr' | 'en';
}

const inputBaseStyle = "block w-full px-4 py-2.5 text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-400";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";

const texts = {
    tr: {
        loginTitle: 'Tekrar Hoş Geldiniz',
        signupTitle: 'Hesap Oluştur',
        loginToggle: 'Giriş Yap',
        signupToggle: 'Kayıt Ol',
        emailLabel: 'E-posta adresi',
        passwordLabel: 'Şifre',
        submitLogin: 'Giriş Yap',
        submitSignup: 'Kayıt Ol',
        processing: 'İşleniyor...',
        noAccount: 'Hesabınız yok mu?',
        haveAccount: 'Zaten bir hesabınız var mı?',
    },
    en: {
        loginTitle: 'Welcome back',
        signupTitle: 'Create an account',
        loginToggle: 'Sign In',
        signupToggle: 'Sign Up',
        emailLabel: 'Email address',
        passwordLabel: 'Password',
        submitLogin: 'Sign In',
        submitSignup: 'Sign Up',
        processing: 'Processing...',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
    },
};

const Auth: React.FC<AuthProps> = ({ etsyUrl, language = 'tr' }) => {
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [shopUrl, setShopUrl] = useState(etsyUrl || '');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const locale = texts[language];

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle the redirect.
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            etsy_store_url: shopUrl || null
                        }
                    }
                });
                if (error) throw error;
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setMessage({ type: 'error', text: 'Bu kullanıcı zaten mevcut.' });
                } else {
                    setMessage({ type: 'success', text: 'Onay bağlantısı için e-postanızı kontrol edin!' });
                }
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.error_description || error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-center text-slate-800">
                    {isLogin ? locale.loginTitle : locale.signupTitle}
                </h2>
                <p className="text-center text-slate-500">
                    {isLogin ? locale.noAccount : locale.haveAccount}
                    <button onClick={() => { setIsLogin(!isLogin); setMessage(null) }} className="font-medium text-primary-600 hover:text-primary-500 ml-1">
                        {isLogin ? locale.signupToggle : locale.loginToggle}
                    </button>
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleAuth}>
                <div>
                    <label htmlFor="email" className={labelBaseStyle}>
                        {locale.emailLabel}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputBaseStyle}
                    />
                </div>

                {!isLogin && (
                    <div>
                        <label htmlFor="etsyUrl" className={labelBaseStyle}>
                            Etsy Mağaza Linki
                        </label>
                        <input
                            id="etsyUrl"
                            name="etsyUrl"
                            type="url"
                            placeholder="https://www.etsy.com/shop/YourShop"
                            required
                            value={shopUrl}
                            onChange={(e) => setShopUrl(e.target.value)}
                            className={inputBaseStyle}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="password" className={labelBaseStyle}>
                        {locale.passwordLabel}
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputBaseStyle}
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? locale.processing : (isLogin ? locale.submitLogin : locale.submitSignup)}
                    </button>
                </div>
            </form >
            {message && (
                <p className={`text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {message.text}
                </p>
            )}
        </div >
    );
};

export default Auth;
