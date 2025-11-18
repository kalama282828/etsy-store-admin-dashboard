import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY,
  BLOG_TOPIC,
  SITE_NAME = 'Etsy Admin',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase servis bilgileri eksik. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlayın.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('Gemini API anahtarı (GEMINI_API_KEY) tanımlı olmalı.');
  process.exit(1);
}

const topic = process.argv[2] || BLOG_TOPIC;
if (!topic) {
  console.error('Konu belirtilmedi. Komutu `node scripts/blogGenerator.mjs "konu"` şeklinde çalıştırın veya BLOG_TOPIC değişkenini ayarlayın.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const prompt = `
Sen ${SITE_NAME} için hizmetlerini tanıtan bir içerik editörüsün.
Konu: ${topic}
Şu formatta cevap ver:
{
  "title": "...",
  "excerpt": "...",
  "content": "<p>HTML içerik...</p>",
  "tags": ["tag1","tag2"]
}
İçeriğin her paragrafı <p> etiketi ile sarmalanmış HTML olmalı. Excerpt 2 cümleyi geçmesin.
`;

const generatePost = async () => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API hatası: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini yanıtı boş döndü.');

  const parsed = JSON.parse(text);
  return parsed;
};

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçıİâêîôû\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

try {
  const aiPost = await generatePost();
  const slug = `${slugify(aiPost.title)}-${Date.now()}`;
  const { error } = await supabase
    .from('blog_posts')
    .insert({
      title: aiPost.title,
      slug,
      excerpt: aiPost.excerpt,
      content: aiPost.content,
      tags: aiPost.tags || null,
      published_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }

  console.log(`Blog yazısı oluşturuldu: ${aiPost.title} (${slug})`);
  process.exit(0);
} catch (err) {
  console.error('Blog üretimi başarısız oldu:', err.message);
  process.exit(1);
}
