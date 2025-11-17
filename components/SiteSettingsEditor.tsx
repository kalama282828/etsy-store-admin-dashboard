import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';
import DeleteIcon from './icons/DeleteIcon';

const BUCKET_NAME = 'site_assets';
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";
const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";

interface SiteSettingsEditorProps {
    onUpdate: () => void;
}

const SiteSettingsEditor: React.FC<SiteSettingsEditorProps> = ({ onUpdate }) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching site settings:", error);
                setError("Ayarlar yüklenirken bir hata oluştu.");
            } else {
                const normalized = data
                    ? {
                        ...data,
                        page_title: data.page_title || data.site_name || 'Etsy Admin',
                        favicon_url: data.favicon_url || null,
                        footer_text: data.footer_text || '',
                    }
                    : { site_name: 'Etsy Admin', logo_url: null, page_title: 'Etsy Admin', favicon_url: null, footer_text: '' };
                setSettings(normalized);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({ ...settings, [name]: value });
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !settings) return;

        setUploading(true);
        setError(null);

        // Delete old logo if it exists
        if (settings.logo_url) {
            const oldFileName = settings.logo_url.split('/').pop();
            if (oldFileName) {
                await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
            }
        }

        const fileName = `logo-${Date.now()}`;
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            setError(`Logo yüklenirken hata oluştu: ${uploadError.message}`);
        } else {
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
            setSettings({ ...settings, logo_url: urlData.publicUrl });
        }

        setUploading(false);
        event.target.value = '';
    };

    const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !settings) return;

        setUploading(true);
        setError(null);

        if (settings.favicon_url) {
            const oldFileName = settings.favicon_url.split('/').pop();
            if (oldFileName) {
                await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
            }
        }

        const fileName = `favicon-${Date.now()}`;
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Favicon upload error:", uploadError);
            setError(`Favicon yüklenirken hata oluştu: ${uploadError.message}`);
        } else {
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
            setSettings({ ...settings, favicon_url: urlData.publicUrl });
        }

        setUploading(false);
        event.target.value = '';
    };

    const handleDeleteLogo = async () => {
        if (!settings || !settings.logo_url) return;
        if (!window.confirm("Mevcut logoyu silmek istediğinizden emin misiniz?")) return;

        const fileName = settings.logo_url.split('/').pop();
        if (!fileName) {
            setError("Logo dosya adı alınamadı.");
            return;
        }

        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        if (deleteError) {
            setError(`Logo silinirken bir hata oluştu: ${deleteError.message}`);
        } else {
            setSettings({ ...settings, logo_url: null });
        }
    };

    const handleDeleteFavicon = async () => {
        if (!settings || !settings.favicon_url) return;
        if (!window.confirm("Mevcut faviconu silmek istediğinizden emin misiniz?")) return;

        const fileName = settings.favicon_url.split('/').pop();
        if (!fileName) {
            setError("Favicon dosya adı alınamadı.");
            return;
        }

        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        if (deleteError) {
            setError(`Favicon silinirken bir hata oluştu: ${deleteError.message}`);
        } else {
            setSettings({ ...settings, favicon_url: null });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const { error: updateError } = await supabase
            .from('site_settings')
            .update({
                site_name: settings.site_name,
                logo_url: settings.logo_url,
                page_title: settings.page_title || settings.site_name,
                favicon_url: settings.favicon_url,
                footer_text: settings.footer_text || '',
            })
            .eq('id', 1);

        if (updateError) {
            console.error("Error updating settings:", updateError);
            setError("Ayarlar kaydedilirken bir hata oluştu.");
        } else {
            setSuccessMessage("Ayarlar başarıyla güncellendi!");
            onUpdate(); // Notify App.tsx to refetch settings
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                 <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse mb-6"></div>
                 <div className="space-y-4">
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
                 </div>
            </div>
        );
    }
    
    if (!settings) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
             <h2 className="text-xl font-bold text-slate-800 mb-1">Site Ayarları</h2>
             <p className="text-sm text-slate-500 mb-6">Sitenizin genel görünümünü ve markasını buradan yönetin.</p>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="site_name" className={labelBaseStyle}>Site İsmi</label>
                    <input id="site_name" name="site_name" value={settings.site_name} onChange={handleInputChange} className={inputBaseStyle} />
                </div>

                <div>
                    <label htmlFor="page_title" className={labelBaseStyle}>Tarayıcı Sekme Başlığı</label>
                    <input
                        id="page_title"
                        name="page_title"
                        value={settings.page_title || ''}
                        onChange={handleInputChange}
                        placeholder="Örn: Etsy Admin Paneli"
                        className={inputBaseStyle}
                    />
                </div>
                
                <div>
                    <label className={labelBaseStyle}>Site Logosu</label>
                    <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                        <div className="w-24 h-12 flex items-center justify-center bg-slate-100 rounded-md overflow-hidden">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Mevcut Logo" className="h-full object-contain" />
                            ) : (
                                <span className="text-xs text-slate-500">Logo Yok</span>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                             <label htmlFor="logo-upload" className={`w-full text-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {uploading ? 'Yükleniyor...' : 'Yeni Logo Yükle'}
                            </label>
                            <input
                                id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml"
                                className="hidden" onChange={handleLogoUpload} disabled={uploading}
                            />
                            {settings.logo_url && (
                                <button type="button" onClick={handleDeleteLogo} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                                    <DeleteIcon /> Logoyu Sil
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelBaseStyle}>Favicon</label>
                <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-md overflow-hidden">
                        {settings.favicon_url ? (
                            <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                        ) : (
                                <span className="text-xs text-slate-500">Yok</span>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                             <label htmlFor="favicon-upload" className={`w-full text-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {uploading ? 'Yükleniyor...' : 'Favicon Yükle'}
                            </label>
                            <input
                                id="favicon-upload" type="file" accept="image/png, image/x-icon, image/svg+xml"
                                className="hidden" onChange={handleFaviconUpload} disabled={uploading}
                            />
                            <p className="text-xs text-slate-500">Önerilen boyut: 32x32px .ico veya .png</p>
                            {settings.favicon_url && (
                                <button type="button" onClick={handleDeleteFavicon} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                                    <DeleteIcon /> Faviconu Sil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="footer_text" className={labelBaseStyle}>Footer Metni</label>
                    <textarea
                        id="footer_text"
                        name="footer_text"
                        value={settings.footer_text || ''}
                        onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                        className={`${inputBaseStyle} min-h-[80px]`}
                        placeholder="© 2025 Şirket Adınız. Tüm hakları saklıdır."
                    />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                    {successMessage && <p className="text-sm text-green-600 animate-fadeIn">{successMessage}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={saving || uploading} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                 </div>
             </form>
        </div>
    );
};

export default SiteSettingsEditor;
