

import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { SiteContent, FeatureCardContent } from '../types';

const inputBaseStyle = "block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-100 border border-transparent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white focus:border-primary-500";
const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1.5";
const textareaBaseStyle = `${inputBaseStyle} min-h-[100px]`;


const ContentEditor: React.FC = () => {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_content')
                .select('content')
                .eq('id', 1)
                .single();
            
            if (error) {
                console.error("Error fetching site content:", error);
                setError("İçerik yüklenirken bir hata oluştu. Lütfen veritabanı kurulumunu kontrol edin.");
            } else {
                setContent(data.content);
            }
            setLoading(false);
        };
        fetchContent();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: keyof SiteContent, field?: string, index?: number, subField?: keyof FeatureCardContent) => {
        if (!content) return;

        const { value } = e.target;
        const newContent = JSON.parse(JSON.stringify(content)); // Deep copy

        if (section === 'features' && field === 'cards' && index !== undefined && subField) {
            newContent.features.cards[index][subField] = value;
        } else if (field) {
            if (!newContent[section]) {
                (newContent[section] as any) = {};
            }
            (newContent[section] as any)[field] = value;
        }

        setContent(newContent);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const { error: updateError } = await supabase
            .from('site_content')
            .update({ content })
            .eq('id', 1);

        if (updateError) {
            console.error("Error updating content:", updateError);
            setError("İçerik kaydedilirken bir hata oluştu.");
        } else {
            setSuccessMessage("İçerik başarıyla güncellendi! Değişiklikler ana sayfaya anında yansıtıldı.");
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        setSaving(false);
    };
    
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                 <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse mb-6"></div>
                 <div className="space-y-4">
                    <div className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
                 </div>
            </div>
        );
    }

    if (error) {
         return (
             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">İçerik Yöneticisi Hatası</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (!content) return null;


    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
             <h2 className="text-xl font-bold text-slate-800 mb-1">Ana Sayfa İçerik Yönetimi</h2>
             <p className="text-sm text-slate-500 mb-6">Buradaki metinleri değiştirerek ana sayfanızı güncelleyebilirsiniz.</p>
             
             <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Section */}
                <div className="p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">Karşılama Bölümü (Hero)</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="hero_title" className={labelBaseStyle}>Ana Başlık</label>
                            <input id="hero_title" value={content.hero.title} onChange={(e) => handleInputChange(e, 'hero', 'title')} className={inputBaseStyle} />
                        </div>
                        <div>
                            <label htmlFor="hero_subtitle" className={labelBaseStyle}>Alt Başlık</label>
                            <textarea id="hero_subtitle" value={content.hero.subtitle} onChange={(e) => handleInputChange(e, 'hero', 'subtitle')} className={textareaBaseStyle} />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="hero_formPlaceholder" className={labelBaseStyle}>Form Platzhalter</label>
                                <input id="hero_formPlaceholder" value={content.hero.formPlaceholder} onChange={(e) => handleInputChange(e, 'hero', 'formPlaceholder')} className={inputBaseStyle} />
                            </div>
                            <div>
                                <label htmlFor="hero_formButton" className={labelBaseStyle}>Form Buton Metni</label>
                                <input id="hero_formButton" value={content.hero.formButton} onChange={(e) => handleInputChange(e, 'hero', 'formButton')} className={inputBaseStyle} />
                            </div>
                         </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">Özellikler Bölümü</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="features_title" className={labelBaseStyle}>Bölüm Başlığı</label>
                            <input id="features_title" value={content.features.title} onChange={(e) => handleInputChange(e, 'features', 'title')} className={inputBaseStyle} />
                        </div>
                        <div>
                            <label htmlFor="features_subtitle" className={labelBaseStyle}>Bölüm Alt Başlığı</label>
                            <input id="features_subtitle" value={content.features.subtitle} onChange={(e) => handleInputChange(e, 'features', 'subtitle')} className={inputBaseStyle} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                           {content.features.cards.map((card, index) => (
                               <div key={index} className="p-3 bg-slate-50 rounded-md border">
                                    <h4 className="text-sm font-semibold mb-2">Özellik Kartı #{index + 1}</h4>
                                     <div>
                                        <label htmlFor={`feature_card_title_${index}`} className={labelBaseStyle}>Başlık</label>
                                        <input id={`feature_card_title_${index}`} value={card.title} onChange={(e) => handleInputChange(e, 'features', 'cards', index, 'title')} className={inputBaseStyle} />
                                    </div>
                                     <div className="mt-2">
                                        <label htmlFor={`feature_card_desc_${index}`} className={labelBaseStyle}>Açıklama</label>
                                        <textarea id={`feature_card_desc_${index}`} value={card.description} onChange={(e) => handleInputChange(e, 'features', 'cards', index, 'description')} className={`${textareaBaseStyle} min-h-[80px]`}/>
                                    </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Proof Section */}
                <div className="p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">Kanıtlar Bölümü</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="proof_title" className={labelBaseStyle}>Bölüm Başlığı</label>
                            <input id="proof_title" value={content.proof?.title || ''} onChange={(e) => handleInputChange(e, 'proof', 'title')} className={inputBaseStyle} />
                        </div>
                        <div>
                            <label htmlFor="proof_subtitle" className={labelBaseStyle}>Bölüm Alt Başlığı</label>
                            <input id="proof_subtitle" value={content.proof?.subtitle || ''} onChange={(e) => handleInputChange(e, 'proof', 'subtitle')} className={inputBaseStyle} />
                        </div>
                    </div>
                </div>
                
                 {/* Pricing Section */}
                <div className="p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">Fiyatlandırma Bölümü</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="pricing_title" className={labelBaseStyle}>Bölüm Başlığı</label>
                            <input id="pricing_title" value={content.pricing.title} onChange={(e) => handleInputChange(e, 'pricing', 'title')} className={inputBaseStyle} />
                        </div>
                        <div>
                            <label htmlFor="pricing_subtitle" className={labelBaseStyle}>Bölüm Alt Başlığı</label>
                            <input id="pricing_subtitle" value={content.pricing.subtitle} onChange={(e) => handleInputChange(e, 'pricing', 'subtitle')} className={inputBaseStyle} />
                        </div>
                    </div>
                </div>

                {/* Save Button & Messages */}
                 <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                    {successMessage && <p className="text-sm text-green-600 animate-fadeIn">{successMessage}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                 </div>
             </form>
        </div>
    );
};

export default ContentEditor;