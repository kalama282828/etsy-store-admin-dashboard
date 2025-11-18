import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';

const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(10);

        if (error) {
            setError(error.message);
        } else {
            setPosts(data as BlogPost[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Blog İçeriği</h2>
                    <p className="text-sm text-slate-500">AI içerik motorunun yayınladığı son yazılar.</p>
                </div>
                <button
                    onClick={fetchPosts}
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Yenile
                </button>
            </div>
            {loading ? (
                <p className="text-sm text-slate-500">İçerikler yükleniyor...</p>
            ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : posts.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz blog içeriği oluşturulmamış.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 rounded-l-lg">Başlık</th>
                                <th className="px-4 py-2">Slug</th>
                                <th className="px-4 py-2">Yayın Tarihi</th>
                                <th className="px-4 py-2 rounded-r-lg">Özet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(post => (
                                <tr key={post.id} className="bg-white border-b border-slate-100">
                                    <td className="px-4 py-3 font-medium text-slate-900">{post.title}</td>
                                    <td className="px-4 py-3">{post.slug}</td>
                                    <td className="px-4 py-3">{post.published_at ? new Date(post.published_at).toLocaleString('tr-TR') : '-'}</td>
                                    <td className="px-4 py-3">{post.excerpt?.slice(0, 80) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BlogManager;
