
-- Create function to handle new user profile creation (called from client-side)
-- We can't attach triggers to auth schema, so we ensure profiles table has proper defaults
-- Profile creation will be handled client-side after signup

-- Add an upsert-friendly unique constraint on profiles.id (already primary key, so this is fine)
-- No schema changes needed, just ensuring the approach works
SELECT 1;
