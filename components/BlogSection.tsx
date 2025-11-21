import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';

const BlogSection: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePost, setActivePost] = useState<BlogPost | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_posts')
                .select('id, title, slug, excerpt, hero_image, published_at')
                .order('published_at', { ascending: false })
                .limit(3);

            if (!error && data) {
                setPosts(data as BlogPost[]);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    if (loading || posts.length === 0) return null;

    return (
        <section className="py-20 bg-transparent" id="blog">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-sm font-semibold text-primary-400 tracking-wider uppercase">Blog</p>
                    <h2 className="mt-2 text-3xl font-bold text-white">Hizmet Güncellemeleri</h2>
                    <p className="mt-3 text-metallic-400 max-w-2xl mx-auto">
                        Yapay zeka destekli içerik motorumuzdan en son öneriler ve başarı hikayeleri.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    {posts.map(post => (
                        <article key={post.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/20 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_8px_32px_0_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300 group">
                            {post.hero_image && (
                                <img src={post.hero_image} alt={post.title} className="h-40 w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="p-5 flex flex-col h-full">
                                <p className="text-xs text-metallic-500 uppercase tracking-wide">
                                    {post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR') : ''}
                                </p>
                                <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">{post.title}</h3>
                                <p className="mt-2 text-sm text-metallic-400 h-[60px] overflow-hidden">
                                    {post.excerpt || ''}
                                </p>
                                <button
                                    onClick={() => setActivePost(post)}
                                    className="mt-4 inline-flex items-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                                >
                                    Yazıyı Oku &rarr;
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
            {activePost && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <article className="bg-white/[0.03] backdrop-blur-3xl border border-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                        <button
                            onClick={() => setActivePost(null)}
                            className="absolute top-4 right-4 text-metallic-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <p className="text-xs text-metallic-500 uppercase tracking-wide">
                            {activePost.published_at ? new Date(activePost.published_at).toLocaleString('tr-TR') : ''}
                        </p>
                        <h3 className="text-2xl font-bold text-white mt-1">{activePost.title}</h3>
                        <div className="mt-4 text-sm text-metallic-300 leading-relaxed space-y-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activePost.content }} />
                    </article>
                </div>
            )}
        </section>
    );
};

export default BlogSection;
