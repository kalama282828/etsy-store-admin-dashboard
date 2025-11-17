

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LeadCaptureModalProps {
    packageName: string;
    onClose: () => void;
}

const inputBaseStyle = "block w-full px-4 py-2.5 text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-400";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ packageName, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [storeUrl, setStoreUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!name || !email) {
            setError('İsim ve e-posta alanları zorunludur.');
            setLoading(false);
            return;
        }

        try {
            const { error: insertError } = await supabase
                .from('leads')
                .insert({
                    name,
                    email,
                    store_url: storeUrl,
                    selected_package: packageName
                });
            
            if (insertError) throw insertError;

            setSuccess(true);
        } catch (err: any) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error('Error saving lead:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative transform transition-all duration-300 animate-scaleIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-full p-1"
                    aria-label="Kapat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {success ? (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-slate-800">Teşekkürler!</h3>
                        <p className="mt-2 text-slate-600">Bilgilerinizi aldık. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
                        <button
                            onClick={onClose}
                            className="mt-6 w-full inline-flex justify-center rounded-full border border-transparent shadow-sm px-4 py-2.5 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300"
                        >
                            Kapat
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                             <h3 className="text-xl font-bold text-slate-800">Neredeyse Tamam!</h3>
                             <p className="mt-1 text-slate-500">İletişim bilgilerinizi bırakın, size geri dönelim.</p>
                             <div className="mt-2 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full px-3 py-1 inline-block">
                                Seçilen Paket: {packageName}
                            </div>
                        </div>
                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                             <div>
                                <label htmlFor="name" className={labelBaseStyle}>Ad Soyad</label>
                                <input type="text" name="name" id="name" required value={name} onChange={e => setName(e.target.value)} className={inputBaseStyle} />
                            </div>
                            <div>
                                <label htmlFor="email" className={labelBaseStyle}>E-posta Adresi</label>
                                <input type="email" name="email" id="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputBaseStyle} />
                            </div>
                            <div>
                                <label htmlFor="store_url" className={labelBaseStyle}>Etsy Mağaza URL (İsteğe Bağlı)</label>
                                <input type="url" name="store_url" id="store_url" value={storeUrl} onChange={e => setStoreUrl(e.target.value)} className={inputBaseStyle} placeholder="https://www.etsy.com/shop/..." />
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div className="pt-2">
                                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50">
                                    {loading ? 'Gönderiliyor...' : 'Gönder'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LeadCaptureModal;