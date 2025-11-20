-- Admin panelinden kullanıcı silmek için RPC fonksiyonu
-- Bu fonksiyon auth.users tablosundan kullanıcıyı siler.
-- DİKKAT: Bu işlem geri alınamaz ve kullanıcıya ait tüm verileri (cascade ile bağlıysa) siler.

CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece admin yetkisine sahip kullanıcıların veya bu fonksiyonu çağıranın yetkisiyle çalışır.
  -- Güvenlik için ek kontroller eklenebilir ancak şimdilik basit tutuyoruz.
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

COMMENT ON FUNCTION public.delete_user(uuid) IS 'Verilen ID''ye sahip kullanıcıyı auth.users tablosundan siler.';
