

import React, { useState, useEffect } from 'react';
import { Package } from '../types';
import { supabase } from '../lib/supabase';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

const PackageEditor: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    const fetchPackages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('price', { ascending: true });

        if (error) console.error('Error fetching packages', error);
        else setPackages(data as Package[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchPackages();
    }, []);
    
    const handleAddNew = () => {
        setEditingPackage({ name: '', price: 0, features: [], isPopular: false, subscribers: 15 });
        setIsModalOpen(true);
    };

    const handleEdit = (pkg: Package) => {
        setEditingPackage(pkg);
        setIsModalOpen(true);
    };

    const handleDelete = async (pkgId: number) => {
        if (window.confirm('Bu paketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            const { error } = await supabase.from('packages').delete().eq('id', pkgId);
            if (error) {
                alert('Paket silinirken hata oluştu: ' + error.message);
            } else {
                fetchPackages(); // Refresh list
            }
        }
    };
    
    const handleSave = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
        fetchPackages();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Paket Düzenleyici</h2>
                <button onClick={handleAddNew} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Yeni Ekle
                </button>
            </div>
            {loading ? (
                <p className="text-slate-500">Paketler yükleniyor...</p>
            ) : (
                <div className="space-y-3">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-lg transition-shadow hover:shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center">
                                        {pkg.name}
                                        {pkg.isPopular && <span className="ml-2 text-xs font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">Popüler</span>}
                                    </h3>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="text-sm text-slate-600">${pkg.price}/ay</p>
                                        {pkg.subscribers && (
                                            <p className="text-xs text-slate-500">({pkg.subscribers} abone)</p>
                                        )}
                                    </div>
                                    
                                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                        {pkg.features.map(f => <li key={f} className="flex items-center"><CheckIcon className="w-4 h-4 mr-2 text-green-500 flex-shrink-0"/><span>{f}</span></li>)}
                                    </ul>
                                </div>
                                <div className="flex space-x-1 flex-shrink-0 ml-2">
                                    <button onClick={() => handleEdit(pkg)} className="p-2 text-slate-500 rounded-md hover:bg-slate-200 hover:text-primary-600 transition-colors"><EditIcon/></button>
                                    <button onClick={() => handleDelete(pkg.id!)} className="p-2 text-slate-500 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"><DeleteIcon/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isModalOpen && editingPackage && (
                <PackageFormModal
                    pkg={editingPackage}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

// --- Modal Form Component ---
interface PackageFormModalProps {
    pkg: Package;
    onClose: () => void;
    onSave: () => void;
}

const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1";


const PackageFormModal: React.FC<PackageFormModalProps> = ({ pkg, onClose, onSave }) => {
    const [formData, setFormData] = useState<Package>({...pkg, features: pkg.features || []});
    const [featuresText, setFeaturesText] = useState((pkg.features || []).join('\n'));
    const [saving, setSaving] = useState(false);
    
    const isEditing = !!pkg.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'featuresText') {
            setFeaturesText(value);
            setFormData(prev => ({ ...prev, features: value.split('\n').filter(f => f.trim() !== '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const dataToSave = {
            ...formData,
            price: Number(formData.price),
            subscribers: Number(formData.subscribers) || 0
        };

        let error;
        if(isEditing) {
            const { error: updateError } = await supabase.from('packages').update(dataToSave).eq('id', pkg.id);
            error = updateError;
        } else {
            const { id, ...insertData } = dataToSave; // Don't send id on insert
            const { error: insertError } = await supabase.from('packages').insert(insertData);
            error = insertError;
        }

        if (error) {
            alert('Paket kaydedilirken hata oluştu: ' + error.message);
        } else {
            onSave();
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative transform transition-all animate-scaleIn">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Abonelik paketinizin detaylarını yönetin.</p>
                 </div>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                            <label htmlFor="name" className={labelBaseStyle}>Paket Adı</label>
                            <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required className={inputBaseStyle}/>
                        </div>
                        <div>
                            <label htmlFor="price" className={labelBaseStyle}>Fiyat (aylık)</label>
                            <input id="price" type="number" name="price" value={formData.price} onChange={handleChange} required className={inputBaseStyle} min="0" step="any"/>
                        </div>
                        <div>
                            <label htmlFor="subscribers" className={labelBaseStyle}>Görünen Abone Sayısı</label>
                            <input id="subscribers" type="number" name="subscribers" value={formData.subscribers || ''} onChange={handleChange} className={inputBaseStyle} min="0"/>
                        </div>
                     </div>
                      <div>
                        <label htmlFor="features" className={labelBaseStyle}>Özellikler (her satıra bir tane)</label>
                        <textarea id="features" name="featuresText" value={featuresText} onChange={handleChange} rows={5} className={inputBaseStyle}></textarea>
                     </div>
                     <div className="pt-2">
                         <label htmlFor="isPopular" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                             <span className="font-medium text-slate-700 text-sm">Popüler Olarak İşaretle</span>
                             <div className="relative">
                                <input id="isPopular" type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="sr-only peer"/>
                                <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                             </div>
                         </label>
                     </div>
                     <div className="flex justify-end space-x-3 pt-5 mt-5 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400">İptal</button>
                        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            {saving ? 'Kaydediliyor...' : 'Paketi Kaydet'}
                        </button>
                     </div>
                 </form>
            </div>
        </div>
    );
};

export default PackageEditor;