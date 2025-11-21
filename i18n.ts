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

    // Dashboard
    dashboard_welcome: 'Tekrar hoş geldin, Admin!',
    dashboard_menu_dashboard: 'Yönetim Paneli',
    dashboard_menu_booster: 'Dönüşüm Arttırıcı',
    dashboard_menu_stripe: 'Stripe Ayarları',
    dashboard_menu_blog: 'Blog / AI',
    dashboard_menu_messages: 'Mesajlar',
    dashboard_loading: 'Veriler yükleniyor...',
    dashboard_error_title: 'Veri Alınırken Hata Oluştu',
    dashboard_stripe_title: 'Stripe Entegrasyonu',
    dashboard_blog_title: 'Blog & AI İçerik',
    dashboard_messages_title: 'Mesajlar',
    site_name_default: 'Yönetim',

    // Common
    loading: 'Yükleniyor...',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    success: 'Başarılı',
    error: 'Hata',

    // User Table
    user_table_title: 'Kayıtlı Kullanıcılar',
    user_table_email: 'Email',
    user_table_store: 'Mağaza',
    user_table_joined: 'Katılım Tarihi',
    user_table_actions: 'İşlemler',
    user_delete_confirm: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',

    // Leads Table
    leads_table_title: 'Müşteri Adayları (Leads)',
    leads_table_name: 'İsim',
    leads_table_package: 'Paket',
    leads_table_date: 'Tarih',

    // Stats
    stats_total_revenue: 'Toplam Gelir',
    stats_active_users: 'Aktif Kullanıcılar',
    stats_conversion_rate: 'Dönüşüm Oranı',
    stats_active_now: 'Şu An Aktif',

    // Messages
    messages_title: 'Mesajlar',
    messages_tab_active: 'Aktif',
    messages_tab_archived: 'Arşiv',
    messages_no_active: 'Aktif mesaj bulunmuyor.',
    messages_no_archived: 'Arşivlenmiş mesaj bulunmuyor.',
    messages_select_conversation: 'Bir konuşma seçin.',
    user_status_registered: 'Kayıtlı Üye',
    archive: 'Arşivle',
    delete_confirm: 'Bu öğeyi silmek istediğinizden emin misiniz?',

    // Chat Widget
    status_checking: 'Durum alınıyor...',
    status_online: 'Çevrimiçi',
    status_offline: 'Çevrimdışı',
    chat_placeholder: 'Mesajınız...',
    send: 'Gönder',
  },
  en: {
    login_title: 'Boost your Etsy store with AI',
    login_subtitle: 'Our platform helps Etsy sellers make smarter decisions.',
    features_heading: 'Features',
    pricing_heading: 'Plans',
    blog_heading: 'Service updates',

    // Dashboard
    dashboard_welcome: 'Welcome back, Admin!',
    dashboard_menu_dashboard: 'Dashboard',
    dashboard_menu_booster: 'Conversion Booster',
    dashboard_menu_stripe: 'Stripe Settings',
    dashboard_menu_blog: 'Blog / AI',
    dashboard_menu_messages: 'Messages',
    dashboard_loading: 'Loading data...',
    dashboard_error_title: 'Error Fetching Data',
    dashboard_stripe_title: 'Stripe Integration',
    dashboard_blog_title: 'Blog & AI Content',
    dashboard_messages_title: 'Messages',
    site_name_default: 'Admin',

    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    success: 'Success',
    error: 'Error',

    // User Table
    user_table_title: 'Registered Users',
    user_table_email: 'Email',
    user_table_store: 'Store',
    user_table_joined: 'Join Date',
    user_table_actions: 'Actions',
    user_delete_confirm: 'Are you sure you want to delete this user?',

    // Leads Table
    leads_table_title: 'Leads',
    leads_table_name: 'Name',
    leads_table_package: 'Package',
    leads_table_date: 'Date',

    // Stats
    stats_total_revenue: 'Total Revenue',
    stats_active_users: 'Active Users',
    stats_conversion_rate: 'Conversion Rate',
    stats_active_now: 'Active Now',

    // Messages
    messages_title: 'Messages',
    messages_tab_active: 'Active',
    messages_tab_archived: 'Archived',
    messages_no_active: 'No active messages.',
    messages_no_archived: 'No archived messages.',
    messages_select_conversation: 'Select a conversation.',
    user_status_registered: 'Registered Member',
    archive: 'Archive',
    delete_confirm: 'Are you sure you want to delete this item?',

    // Chat Widget
    status_checking: 'Checking status...',
    status_online: 'Online',
    status_offline: 'Offline',
    chat_placeholder: 'Type a message...',
    send: 'Send',
  },
};
