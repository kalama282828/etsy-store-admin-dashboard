import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";
const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";

interface StripeConfig {
    stripe_publishable_key: string;
    stripe_secret_key: string;
    stripe_checkout_url: string;
}

const defaultConfig: StripeConfig = {
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_checkout_url: '',
};

const StripeSettings: React.FC = () => {
    const [config, setConfig] = useState<StripeConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('stripe_publishable_key, stripe_secret_key, stripe_checkout_url')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching stripe settings:', error);
                setError('Stripe ayarları yüklenirken bir hata oluştu.');
            } else if (data) {
                setConfig({
                    stripe_publishable_key: data.stripe_publishable_key || '',
                    stripe_secret_key: data.stripe_secret_key || '',
                    stripe_checkout_url: data.stripe_checkout_url || '',
                });
            } else {
                setConfig(defaultConfig);
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const { error: updateError } = await supabase
            .from('site_settings')
            .update({
                stripe_publishable_key: config.stripe_publishable_key,
                stripe_secret_key: config.stripe_secret_key,
                stripe_checkout_url: config.stripe_checkout_url,
            })
            .eq('id', 1);

        if (updateError) {
            console.error('Error updating stripe settings:', updateError);
            setError('Stripe ayarları kaydedilirken bir hata oluştu.');
        } else {
            setSuccessMessage('Stripe ayarları kaydedildi.');
            setTimeout(() => setSuccessMessage(null), 4000);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse mb-6"></div>
                <div className="space-y-4">
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Stripe Entegrasyon Ayarları</h1>
            <p className="text-sm text-slate-500 mb-6">
                Stripe API anahtarlarınızı ve ödeme sayfası URL&apos;nizi buradan yönetin. Gizli anahtarınızı kamuyla paylaşmayın;
                mümkünse sunucu tarafında çevresel değişkenlerde saklayın.
            </p>

            <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800 mb-6">
                Güvenlik notu: Stripe gizli anahtarlarının kullanıcı tarafına gönderilmesi önerilmez. Bu alan, hızlı demo/PoC
                ihtiyaçları için sağlanmıştır. Üretim ortamında bu değerleri yalnızca güvenli backend servisleri aracılığıyla kullanın.
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="stripe_publishable_key" className={labelBaseStyle}>Publishable Key</label>
                    <input
                        id="stripe_publishable_key"
                        name="stripe_publishable_key"
                        value={config.stripe_publishable_key}
                        onChange={handleInputChange}
                        placeholder="pk_live_xxx"
                        className={inputBaseStyle}
                    />
                </div>

                <div>
                    <label htmlFor="stripe_secret_key" className={labelBaseStyle}>Secret Key</label>
                    <input
                        id="stripe_secret_key"
                        name="stripe_secret_key"
                        value={config.stripe_secret_key}
                        onChange={handleInputChange}
                        placeholder="sk_live_xxx"
                        className={inputBaseStyle}
                    />
                </div>

                <div>
                    <label htmlFor="stripe_checkout_url" className={labelBaseStyle}>Checkout URL</label>
                    <input
                        id="stripe_checkout_url"
                        name="stripe_checkout_url"
                        value={config.stripe_checkout_url}
                        onChange={handleInputChange}
                        placeholder="https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
                        className={inputBaseStyle}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Stripe dashboard &gt; Checkouts bölümünden kopyaladığınız ödeme linkini buraya yapıştırın. Müşteri formunu tamamladığında bu link yeni sekmede açılır.
                    </p>
                </div>

                <div className="flex items-center justify-end space-x-4 border-t border-slate-200 pt-4">
                    {successMessage && <span className="text-sm text-green-600">{successMessage}</span>}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StripeSettings;
