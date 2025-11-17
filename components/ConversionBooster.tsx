

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ConversionSettings } from '../types';
import DeleteIcon from './icons/DeleteIcon';

const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";
const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";

const defaultSettings: ConversionSettings = {
    is_enabled: false,
    templates: ["{{name}}, {{package}} paketini {{time}} satın aldı."],
    min_interval: 8,
};

const ConversionBooster: React.FC = () => {
    const [settings, setSettings] = useState<ConversionSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [newTemplate, setNewTemplate] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('conversion_settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error("Error fetching settings:", error.message);
                setError(`Ayarlar yüklenirken bir hata oluştu: ${error.message}`);
            } else {
                setSettings(data || defaultSettings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const { error: saveError } = await supabase
            .from('conversion_settings')
            .upsert({ id: 1, ...settings }, { onConflict: 'id' });

        if (saveError) {
            console.error("Error saving settings:", saveError.message);
            setError(`Ayarlar kaydedilirken bir hata oluştu: ${saveError.message}`);
        } else {
            setSuccessMessage("Ayarlar başarıyla güncellendi!");
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setSaving(false);
    };

    const addTemplate = () => {
        if (newTemplate.trim() && settings) {
            setSettings({
                ...settings,
                templates: [...settings.templates, newTemplate.trim()]
            });
            setNewTemplate('');
        }
    };
    
    const removeTemplate = (index: number) => {
        if (settings) {
            const updatedTemplates = settings.templates.filter((_, i) => i !== index);
            setSettings({ ...settings, templates: updatedTemplates });
        }
    };

    if (loading) {
        return <div className="bg-white p-6 rounded-2xl shadow-xl animate-pulse h-96"></div>;
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold text-slate-900 mb-2">Dönüşüm Arttırıcı</h1>
             <p className="text-slate-600 mb-6">Ana sayfada sosyal kanıt bildirimlerini etkinleştirerek dönüşümleri artırın.</p>
             
             {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-6" role="alert">
                    <p className="font-bold">Bir Hata Oluştu</p>
                    <p className="text-sm">{error}</p>
                </div>
             )}


             {settings && (
                 <div className="space-y-8">
                     {/* Enable/Disable Toggle */}
                    <div className="p-4 border border-slate-200 rounded-lg">
                        <label htmlFor="is_enabled" className="flex items-center justify-between cursor-pointer">
                             <span className="font-semibold text-slate-800 text-base">Sosyal Kanıt Bildirimleri</span>
                             <div className="relative">
                                <input 
                                    id="is_enabled" 
                                    type="checkbox" 
                                    checked={settings.is_enabled} 
                                    onChange={(e) => setSettings({...settings, is_enabled: e.target.checked})} 
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                             </div>
                         </label>
                         <p className="text-sm text-slate-500 mt-2">
                            Bu özellik etkinleştirildiğinde, ana sayfayı ziyaret eden kullanıcılara sol altta rastgele satın alma bildirimleri gösterilir.
                         </p>
                    </div>

                     {/* Interval Settings */}
                    <div className="p-4 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-1">Gösterim Sıklığı</h3>
                        <p className="text-sm text-slate-500 mb-4">Bildirimler için minimum bekleme süresini saniye olarak ayarlayın. Gerçek bekleme süresi, bu değer ile bu değerin 12 saniye fazlası arasında rastgele seçilecektir.</p>
                        <div className="max-w-xs">
                            <label htmlFor="min_interval" className={labelBaseStyle}>Minimum Bekleme Süresi (saniye)</label>
                            <input
                                id="min_interval"
                                type="number"
                                min="1"
                                value={settings.min_interval || 8}
                                onChange={(e) => setSettings({...settings, min_interval: parseInt(e.target.value, 10) || 1})}
                                className={inputBaseStyle}
                            />
                        </div>
                    </div>


                    {/* Template Manager */}
                    <div className="p-4 border border-slate-200 rounded-lg">
                         <h3 className="font-semibold text-lg text-slate-700 mb-1">Bildirim Şablonları</h3>
                         <p className="text-sm text-slate-500 mb-4">Sistem, gösterilecek her bildirim için bu şablonlardan rastgele birini seçecektir.</p>

                        <div className="space-y-2 mb-4">
                            {settings.templates.map((template, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                                    <span className="text-slate-700">{template}</span>
                                    <button onClick={() => removeTemplate(index)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            ))}
                             {settings.templates.length === 0 && <p className="text-center text-slate-500 py-4">Henüz şablon eklenmemiş.</p>}
                        </div>
                        
                        <div>
                            <label htmlFor="new_template" className={labelBaseStyle}>Yeni Şablon Ekle</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    id="new_template"
                                    value={newTemplate}
                                    onChange={(e) => setNewTemplate(e.target.value)}
                                    placeholder="{{name}}, {{package}} paketini satın aldı."
                                    className={inputBaseStyle}
                                />
                                <button type="button" onClick={addTemplate} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                    Ekle
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Kullanılabilir değişkenler: 
                                <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded-sm mx-1">{`{{name}}`}</code>
                                <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded-sm mx-1">{`{{package}}`}</code>
                                <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded-sm mx-1">{`{{time}}`}</code>
                            </p>
                        </div>
                    </div>

                     {/* Save Button & Messages */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                        {successMessage && <p className="text-sm text-green-600 animate-fadeIn">{successMessage}</p>}
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                 </div>
             )}
        </div>
    );
};

export default ConversionBooster;