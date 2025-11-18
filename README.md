<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lxsjACLDvN3e42RAytB9lFhE_dZZhX8e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (sadece CLI scriptleri için kullanılır)
   - `GEMINI_API_KEY`
   - `SITE_URL` (sitemap üretimi için)
3. Run the app:
   `npm run dev`

> Site footer metnini yönetebilmek için `site_settings` tablosuna `footer_text text` sütununu eklemeyi unutmayın.

## Blog & AI içerik otomasyonu

1. Supabase’de aşağıdaki tabloyu oluşturun:
   ```sql
   create table blog_posts (
     id bigint generated always as identity primary key,
     title text not null,
     slug text not null unique,
     excerpt text,
     content text not null,
     hero_image text,
     published_at timestamptz default now(),
     tags text[]
   );
   ```
   RLS’i açtıysanız, admin kullanıcıların listeleme yapabilmesi için uygun `select` politikası ekleyin.
2. Otomatik içerik üretimi için:
   ```bash
   npm run blog:generate "Etsy mağazaları için SEO auditi"
   ```
   Bu komut Gemini API’sini kullanarak blog içeriğini üretir ve `blog_posts` tablosuna kaydeder. Komutu sunucu tarafında cron’a ekleyerek otomatik yayın akışı oluşturabilirsiniz.
3. Sitemap güncellemek için:
   ```bash
   npm run sitemap
   ```
   `public/sitemap.xml` güncellenir ve oluşturulan blog yazıları haritaya eklenir.
