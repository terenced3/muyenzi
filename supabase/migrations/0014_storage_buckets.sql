-- Storage buckets for user avatars and company logos
-- Both buckets are public (files are served directly via CDN URLs stored in the DB)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('companies-logos', 'companies-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- ── user-avatars policies ─────────────────────────────────────────────────────

-- Anyone can view avatars (they are referenced via public URLs)
CREATE POLICY "Public read user-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Auth insert user-avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- Authenticated users can update/replace their avatar
CREATE POLICY "Auth update user-avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- Authenticated users can delete their avatar
CREATE POLICY "Auth delete user-avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- ── companies-logos policies ──────────────────────────────────────────────────

CREATE POLICY "Public read companies-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'companies-logos');

CREATE POLICY "Auth insert companies-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'companies-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update companies-logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'companies-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete companies-logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'companies-logos' AND auth.role() = 'authenticated');

-- ── audit_log action labels for new actions ───────────────────────────────────
-- (No schema changes needed — action column is TEXT)
-- New action values in use:
--   visit_cancelled, visit_no_show, visit_force_checkout
--   role_change
--   blacklist_add, blacklist_remove
