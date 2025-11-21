import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';
import DeleteIcon from './icons/DeleteIcon';

const BUCKET_NAME = 'site_assets';
const labelBaseStyle = "block text-sm font-medium text-metallic-300 mb-1.5";
const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-white bg-black/20 border border-white/10 rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-black/30 placeholder-metallic-500";

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
                        blog_topic: data.blog_topic || '',
                        promotion_banner_text: data.promotion_banner_text || '',
                        promotion_banner_text_en: data.promotion_banner_text_en || '',
                        promotion_banner_active: data.promotion_banner_active || false,
                    }
                    : {
                        site_name: 'Etsy Admin',
                        logo_url: null,
                        page_title: 'Etsy Admin',
                        favicon_url: null,
                        footer_text: '',
                        blog_topic: '',
                        promotion_banner_text: '',
                        promotion_banner_text_en: '',
                        promotion_banner_active: false
                    };
                setSettings(normalized);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value
        });
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
                blog_topic: settings.blog_topic || '',
                promotion_banner_text: settings.promotion_banner_text,
                promotion_banner_text_en: settings.promotion_banner_text_en,
                promotion_banner_active: settings.promotion_banner_active,
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
            <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <div className="h-8 bg-white/5 rounded-lg w-1/3 animate-pulse mb-6"></div>
                <div className="space-y-4">
                    <div className="h-12 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-white/5 rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">Site Ayarları</h2>
            <p className="text-sm text-metallic-400 mb-6">Sitenizin genel görünümünü ve markasını buradan yönetin.</p>

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
                    <div className="flex items-center gap-4 p-3 border border-white/10 rounded-xl bg-black/20">
                        <div className="w-24 h-12 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden border border-white/5">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Mevcut Logo" className="h-full object-contain" />
                            ) : (
                                <span className="text-xs text-metallic-500">Logo Yok</span>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                            <label htmlFor="logo-upload" className={`w-full text-center px-4 py-2 text-sm font-medium text-metallic-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {uploading ? 'Yükleniyor...' : 'Yeni Logo Yükle'}
                            </label>
                            <input
                                id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml"
                                className="hidden" onChange={handleLogoUpload} disabled={uploading}
                            />
                            {settings.logo_url && (
                                <button type="button" onClick={handleDeleteLogo} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all">
                                    <DeleteIcon /> Logoyu Sil
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelBaseStyle}>Favicon</label>
                    <div className="flex items-center gap-4 p-3 border border-white/10 rounded-xl bg-black/20">
                        <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden border border-white/5">
                            {settings.favicon_url ? (
                                <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                            ) : (
                                <span className="text-xs text-metallic-500">Yok</span>
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                            <label htmlFor="favicon-upload" className={`w-full text-center px-4 py-2 text-sm font-medium text-metallic-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {uploading ? 'Yükleniyor...' : 'Favicon Yükle'}
                            </label>
                            <input
                                id="favicon-upload" type="file" accept="image/png, image/x-icon, image/svg+xml"
                                className="hidden" onChange={handleFaviconUpload} disabled={uploading}
                            />
                            <p className="text-xs text-metallic-500">Önerilen boyut: 32x32px .ico veya .png</p>
                            {settings.favicon_url && (
                                <button type="button" onClick={handleDeleteFavicon} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all">
                                    <DeleteIcon /> Faviconu Sil
                                </button>
                            )}
                        </div>
                    </div>
                </div>



                <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                    <h3 className="text-lg font-semibold text-primary-400 mb-4">Promosyon Bannerı</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="promotion_banner_active"
                                name="promotion_banner_active"
                                checked={settings.promotion_banner_active || false}
                                onChange={handleInputChange}
                                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-white/10 bg-black/20 rounded"
                            />
                            <label htmlFor="promotion_banner_active" className="text-sm font-medium text-white">
                                Banner Aktif
                            </label>
                        </div>

                        <div>
                            <label htmlFor="promotion_banner_text" className={labelBaseStyle}>Banner Metni</label>
                            <input
                                id="promotion_banner_text"
                                name="promotion_banner_text"
                                value={settings.promotion_banner_text || ''}
                                onChange={handleInputChange}
                                placeholder="Örn: %20 İndirim Fırsatı!"
                                className={inputBaseStyle}
                            />
                            <p className="text-xs text-metallic-500 mt-1">Bu metin sitenin en üstünde kayan yazı olarak görünecektir.</p>
                        </div>

                        <div>
                            <label htmlFor="promotion_banner_text_en" className={labelBaseStyle}>Banner Metni (İngilizce)</label>
                            <input
                                id="promotion_banner_text_en"
                                name="promotion_banner_text_en"
                                value={settings.promotion_banner_text_en || ''}
                                onChange={handleInputChange}
                                placeholder="Ex: 20% Discount Opportunity!"
                                className={inputBaseStyle}
                            />
                            <p className="text-xs text-metallic-500 mt-1">İngilizce dil seçeneğinde görünecek metin.</p>
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

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/5">
                    {successMessage && <p className="text-sm text-green-400 animate-fadeIn">{successMessage}</p>}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button type="submit" disabled={saving || uploading} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/20">
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form >
        </div >
    );
};

export default SiteSettingsEditor;
