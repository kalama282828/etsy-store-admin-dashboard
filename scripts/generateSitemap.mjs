import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SITE_URL = 'https://example.com',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase servis bilgileri eksik.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const buildSitemap = (posts) => {
  const urls = [
    { loc: SITE_URL, priority: '1.0' },
    { loc: `${SITE_URL}/blog`, priority: '0.8' },
  ];

  posts.forEach((post) => {
    urls.push({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: post.published_at ? new Date(post.published_at).toISOString() : undefined,
      priority: '0.6',
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `<url>
  <loc>${url.loc}</loc>
  ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  <priority>${url.priority}</priority>
</url>`
  )
  .join('\n')}
</urlset>`;
};

try {
  const posts = await fetchPosts();
  const xml = buildSitemap(posts);
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  await writeFile(outputPath, xml, 'utf8');
  console.log(`Sitemap oluşturuldu: ${outputPath}`);
  process.exit(0);
} catch (err) {
  console.error('Sitemap oluşturma hatası:', err.message);
  process.exit(1);
}
