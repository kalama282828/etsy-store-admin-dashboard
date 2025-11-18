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
        <div className="mt-4 text-center text-sm text-slate-500">
            {language === 'en' ? (
                <>Currently <span className="font-bold text-primary-600">{count} people</span> subscribe to this plan</>
            ) : (
                <>Şu anda <span className="font-bold text-primary-600">{count} kişi</span> bu plana abone</>
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
                <p className="text-slate-500 col-span-full text-center">
                    {language === 'en' ? 'Plans are loading...' : 'Planlar yükleniyor...'}
                </p>
            ) : (
                packages.map((pkg) => (
                    <div key={pkg.name} className={`bg-white p-8 rounded-2xl shadow-md border-2 transition-transform transform ${pkg.isPopular ? 'border-primary-500 scale-105' : 'border-transparent'}`}>
                        {pkg.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popüler</div>}
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-800">{pkg.name}</h3>
                            <p className="mt-2 text-4xl font-bold text-slate-900">${pkg.price}<span className="text-base font-normal text-slate-500">/ay</span></p>
                        </div>
                        <SubscriberCounter count={pkg.subscribers} language={language} />
                        <ul className="mt-6 space-y-3 text-sm text-slate-600">
                            {pkg.features.map((feature) => (
                                <li key={feature} className="flex items-center">
                                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleClick(pkg.name)}
                            disabled={paymentLoading !== null}
                            className={`w-full mt-8 py-3 px-4 rounded-full font-semibold text-base transition-colors duration-300
                                ${pkg.isPopular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                                ${paymentLoading === pkg.name ? 'cursor-not-allowed bg-slate-300' : ''}
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
