import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BlogGeneratorPanel: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
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
            setMessage('Konu metni kaydedildi. Gemini anahtarınızı da girerek doğrudan buradan içerik üretebilirsiniz.');
        }
        setSaving(false);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setMessage('Önce bir konu yazmalısınız.');
            return;
        }
        if (!geminiKey.trim()) {
            setMessage('Gemini API anahtarınızı girin.');
            return;
        }

        setGenerating(true);
        setMessage('İçerik üretiliyor...');

        const prompt = `
            Sen Etsy mağazası için hizmet tanıtım yazıları hazırlayan bir editörsün.
            Konu: ${topic}
            Çıktı formatı:
            {
              "title": "...",
              "excerpt": "...",
              "content": "<p>HTML içerik...</p>",
              "tags": ["tag1","tag2"]
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!response.ok) {
                throw new Error(`Gemini API hatası: ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Gemini boş yanıt döndürdü.');
            const parsed = JSON.parse(text);

            const slugBase = parsed.title
                .toLowerCase()
                .replace(/[^a-z0-9ığüşöç\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');
            const slug = `${slugBase}-${Date.now()}`;

            const { error } = await supabase.from('blog_posts').insert({
                title: parsed.title,
                slug,
                excerpt: parsed.excerpt,
                content: parsed.content,
                tags: parsed.tags || null,
                published_at: new Date().toISOString(),
            });

            if (error) {
                throw error;
            }

            setMessage('İçerik oluşturuldu ve bloga eklendi!');
        } catch (err: any) {
            console.error(err);
            setMessage(err.message || 'İçerik üretimi başarısız oldu.');
        } finally {
            setGenerating(false);
        }
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
                <div>
                    <label htmlFor="gemini_key" className="text-sm font-medium text-slate-700">Gemini API Anahtarı</label>
                    <input
                        id="gemini_key"
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        placeholder="AI içerik üretimi için Google Gemini anahtarınızı girin"
                    />
                    <p className="text-xs text-slate-500 mt-1">Anahtar tarayıcıda tutulur, sadece bu oturumda kullanılır.</p>
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
            <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Anında İçerik Üret</h3>
                <p className="text-xs text-slate-500 mb-3">
                    Konu metni ve API anahtarı ile Gemini’ye istek atılır, dönen içerik doğrudan `blog_posts` tablosuna kaydedilir. Bu işlem
                    istemciden yapıldığı için anahtarınız sadece bu oturumda kullanılır; daha güvenli bir yöntem için script veya backend önerilir.
                </p>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    {generating ? 'İçerik oluşturuluyor...' : 'AI İçerik Üret'}
                </button>
            </div>
            <div className="mt-4 text-xs text-slate-500">
                * Alternatif: server üzerinde `npm run blog:generate` komutunu cron’a bağlayarak tam otomasyon sağlayabilirsiniz.
            </div>
        </div>
    );
};

export default BlogGeneratorPanel;
