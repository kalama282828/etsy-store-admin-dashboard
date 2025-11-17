

import React, { useState } from 'react';
import { Customer } from '../types';
import { supabase } from '../lib/supabase';

interface CustomerFormModalProps {
    customer: Customer | null;
    onClose: () => void;
    onSave: () => void;
}

const defaultCustomer: Omit<Customer, 'id' | 'joinDate'> = {
    name: '',
    email: '',
    avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${Date.now()}`,
    plan: 'Basic',
    status: 'Trial',
    spent: 0,
};

const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";


const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Customer>>(customer || defaultCustomer);
    const [saving, setSaving] = useState(false);
    
    const isEditing = !!customer;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const dataToSave = {
            ...formData,
            spent: Number(formData.spent),
        };
        
        if(!isEditing) {
            dataToSave.joinDate = new Date().toISOString();
        }

        let error;
        if (isEditing) {
            const { error: updateError } = await supabase.from('customers').update(dataToSave).eq('id', customer!.id);
            error = updateError;
        } else {
            const { id, ...insertData } = dataToSave;
            const { error: insertError } = await supabase.from('customers').insert(insertData);
            error = insertError;
        }

        if (error) {
            alert('Müşteri kaydedilirken hata oluştu: ' + error.message);
        } else {
            onSave();
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative transform transition-all animate-scaleIn">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Bu müşterinin detaylarını yönetin.</p>
                 </div>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelBaseStyle}>Ad Soyad</label>
                            <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={inputBaseStyle}/>
                        </div>
                        <div>
                           <label htmlFor="email" className={labelBaseStyle}>E-posta</label>
                           <input id="email" type="email" name="email" value={formData.email || ''} onChange={handleChange} required className={inputBaseStyle}/>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="plan" className={labelBaseStyle}>Plan</label>
                            <select id="plan" name="plan" value={formData.plan || 'Basic'} onChange={handleChange} className={inputBaseStyle}>
                                <option>Basic</option>
                                <option>Pro</option>
                                <option>Premium</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="status" className={labelBaseStyle}>Durum</label>
                            <select id="status" name="status" value={formData.status || 'Trial'} onChange={handleChange} className={inputBaseStyle}>
                                <option>Active</option>
                                <option>Churned</option>
                                <option>Trial</option>
                            </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="spent" className={labelBaseStyle}>Toplam Harcama ($)</label>
                            <input id="spent" type="number" name="spent" value={formData.spent || 0} onChange={handleChange} required className={inputBaseStyle}/>
                        </div>
                        <div>
                            <label htmlFor="avatar" className={labelBaseStyle}>Avatar URL'si</label>
                            <input id="avatar" type="text" name="avatar" value={formData.avatar || ''} onChange={handleChange} required className={inputBaseStyle}/>
                        </div>
                     </div>
                     
                     <div className="flex justify-end space-x-3 pt-5 mt-5 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400">İptal</button>
                        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            {saving ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                        </button>
                     </div>
                 </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;