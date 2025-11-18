import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BlogGeneratorPanel: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopic = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('blog_topic')
                .eq('id', 1)
                .maybeSingle();

            if (!error && data?.blog_topic) {
                setTopic(data.blog_topic);
            }
            setLoading(false);
        };
        fetchTopic();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        const { error } = await supabase
            .from('site_settings')
            .update({ blog_topic: topic })
            .eq('id', 1);
        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Konu metni güncellendi. `npm run blog:generate` komutu yeni konuyu kullanacak.');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
                <p className="text-sm text-slate-500">AI içerik ayarları yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">AI Blog İçerik Motoru</h2>
            <p className="text-sm text-slate-500 mt-1">
                Buradaki konu, otomatik içerik üretim komutu (`npm run blog:generate`) tarafından kullanılır.
            </p>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
                <div>
                    <label htmlFor="blog_topic_panel" className="text-sm font-medium text-slate-700">Ana konu</label>
                    <textarea
                        id="blog_topic_panel"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 min-h-[100px]"
                        placeholder="Etsy mağaza sahiplerine hizmet tanıtımı, başarı hikayeleri vb."
                    />
                </div>
                {message && <p className="text-sm text-primary-600">{message}</p>}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Konuyu Güncelle'}
                    </button>
                </div>
            </form>
            <div className="mt-4 text-xs text-slate-500">
                Otomasyon ipucu: Sunucunuzda `npm run blog:generate` komutunu gün içinde cron ile çalıştırırsanız, girilen konuya göre
                yeni blog yazıları otomatik üretilecektir.
            </div>
        </div>
    );
};

export default BlogGeneratorPanel;
