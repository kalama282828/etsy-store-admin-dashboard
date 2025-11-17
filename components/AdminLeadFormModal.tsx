import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-400";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";

interface AdminLeadFormModalProps {
    onClose: () => void;
    onSaved: () => void;
}

const packageOptions = ['Basic', 'Pro', 'Premium'];

const AdminLeadFormModal: React.FC<AdminLeadFormModalProps> = ({ onClose, onSaved }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [storeUrl, setStoreUrl] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(packageOptions[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !email) {
            setError('İsim ve e-posta alanları zorunludur.');
            return;
        }

        setLoading(true);
        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                name,
                email,
                store_url: storeUrl,
                selected_package: selectedPackage
            });

        if (insertError) {
            setError(insertError.message || 'Lead kaydedilirken hata oluştu.');
        } else {
            onSaved();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative animate-scaleIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-full p-1"
                    aria-label="Kapat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Yeni Lead Ekle</h3>
                    <p className="mt-1 text-slate-500 text-sm">Kampanyalardan gelen müşteri adaylarını manuel ekleyebilirsiniz.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="lead_name" className={labelBaseStyle}>Ad Soyad</label>
                        <input id="lead_name" value={name} onChange={(e) => setName(e.target.value)} className={inputBaseStyle} required />
                    </div>
                    <div>
                        <label htmlFor="lead_email" className={labelBaseStyle}>E-posta</label>
                        <input id="lead_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseStyle} required />
                    </div>
                    <div>
                        <label htmlFor="lead_store" className={labelBaseStyle}>Mağaza URL (Opsiyonel)</label>
                        <input id="lead_store" type="url" placeholder="https://www.etsy.com/shop/..." value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} className={inputBaseStyle} />
                    </div>
                    <div>
                        <label htmlFor="lead_package" className={labelBaseStyle}>Paket</label>
                        <select id="lead_package" value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} className={inputBaseStyle}>
                            {packageOptions.map(pkg => (
                                <option key={pkg} value={pkg}>{pkg}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-5 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors">İptal</button>
                        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {loading ? 'Kaydediliyor...' : 'Lead Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLeadFormModal;
