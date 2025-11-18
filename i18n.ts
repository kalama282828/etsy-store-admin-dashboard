export type Lang = 'tr' | 'en';

export const t = (
  lang: Lang,
  key: keyof typeof translations['tr'],
  vars: Record<string, string | number> = {}
) => {
  const raw = translations[lang][key] || translations.tr[key] || key;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v)),
    raw
  );
};

export const translations = {
  tr: {
    login_title: 'Etsy mağazanızı AI ile hızlandırın',
    login_subtitle: 'Platformumuz, Etsy satıcılarının daha akıllı kararlar almasına yardımcı olur.',
    features_heading: 'Özellikler',
    pricing_heading: 'Planlarımız',
    blog_heading: 'Hizmet Güncellemeleri',
  },
  en: {
    login_title: 'Boost your Etsy store with AI',
    login_subtitle: 'Our platform helps Etsy sellers make smarter decisions.',
    features_heading: 'Features',
    pricing_heading: 'Plans',
    blog_heading: 'Service updates',
  },
};
