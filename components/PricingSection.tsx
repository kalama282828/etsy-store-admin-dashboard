import React, { useState, useEffect } from 'react';
import { Package } from '../types';
import CheckIcon from './icons/CheckIcon';
import { supabase } from '../lib/supabase';

interface PricingSectionProps {
    onPayClick?: (packageName: string) => void;
    language?: 'tr' | 'en';
}

const SubscriberCounter: React.FC<{ count?: number; language: 'tr' | 'en' }> = ({ count, language }) => {
    if (!count || count <= 0) {
        return null;
    }

    return (
        <div className="mt-4 text-center text-sm text-metallic-400">
            {language === 'en' ? (
                <>Currently <span className="font-bold text-primary-400">{count} people</span> subscribe to this plan</>
            ) : (
                <>Şu anda <span className="font-bold text-primary-400">{count} kişi</span> bu plana abone</>
            )}
        </div>
    );
};

const PricingSection: React.FC<PricingSectionProps> = ({ onPayClick, language = 'tr' }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchPackages = async () => {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .order('price', { ascending: true });

            if (error) {
                console.error('Error fetching packages:', error);
            } else {
                setPackages(data as Package[]);
            }
            setIsDataLoading(false);
        };

        fetchPackages();
        // Real-time subscription removed for free-tier compatibility.
    }, []);

    const handlePaymentSimulation = (planName: string) => {
        setPaymentLoading(planName);
        setSuccess(null);
        // This is a simulation, in a real app you'd integrate Stripe here
        setTimeout(() => {
            setPaymentLoading(null);
            setSuccess(planName);
            setTimeout(() => setSuccess(null), 3000);
        }, 2000);
    };

    const handleClick = (packageName: string) => {
        if (onPayClick) {
            onPayClick(packageName);
        } else {
            handlePaymentSimulation(packageName);
        }
    };

    return (
        <div className={`grid grid-cols-1 ${packages.length > 1 ? 'md:grid-cols-3' : ''} gap-8 items-start`}>
            {isDataLoading ? (
                <p className="text-metallic-400 col-span-full text-center">
                    {language === 'en' ? 'Plans are loading...' : 'Planlar yükleniyor...'}
                </p>
            ) : (
                packages.map((pkg) => (
                    <div key={pkg.name} className={`bg-white/[0.03] backdrop-blur-3xl p-8 rounded-3xl shadow-xl transition-transform transform ${pkg.isPopular ? 'border-2 border-primary-400/80 scale-105 shadow-[0_8px_32px_0_rgba(99,102,241,0.5)]' : 'border border-white/20 hover:border-white/40'}`}>
                        {pkg.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-primary-600/20">Popüler</div>}
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                            <p className="mt-2 text-4xl font-bold text-metallic-200">${pkg.price}<span className="text-base font-normal text-metallic-500">/ay</span></p>
                        </div>
                        <SubscriberCounter count={pkg.subscribers} language={language} />
                        <ul className="mt-6 space-y-3 text-sm text-metallic-300">
                            {pkg.features.map((feature) => (
                                <li key={feature} className="flex items-center">
                                    <CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleClick(pkg.name)}
                            disabled={paymentLoading !== null}
                            className={`w-full mt-8 py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300
                                ${pkg.isPopular ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20' : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'}
                                ${paymentLoading === pkg.name ? 'cursor-not-allowed opacity-70' : ''}
                                ${success === pkg.name ? 'cursor-not-allowed bg-green-500 text-white' : ''}
                                disabled:opacity-50
                            `}
                        >
                            {onPayClick
                                ? (language === 'en' ? 'Choose Plan' : 'Planı Seç')
                                : paymentLoading === pkg.name
                                    ? (language === 'en' ? 'Processing...' : 'İşleniyor...')
                                    : success === pkg.name
                                        ? (language === 'en' ? 'Payment Successful!' : 'Ödeme Başarılı!')
                                        : (language === 'en' ? 'Pay with Stripe' : 'Stripe ile Öde')
                            }
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default PricingSection;
