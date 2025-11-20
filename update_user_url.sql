-- Function to update a user's Etsy store URL in their metadata
CREATE OR REPLACE FUNCTION update_user_store_url(user_id UUID, new_url TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('etsy_store_url', new_url)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (or specific roles if needed)
GRANT EXECUTE ON FUNCTION update_user_store_url(UUID, TEXT) TO authenticated;
