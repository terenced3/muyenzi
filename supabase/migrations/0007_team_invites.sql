-- ============================================================
-- Team Invites
-- ============================================================

CREATE TABLE team_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'host',
  token        TEXT NOT NULL UNIQUE,
  invited_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX team_invites_token_idx      ON team_invites(token);
CREATE INDEX team_invites_company_id_idx ON team_invites(company_id);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Admins can see, create, and delete invites for their company
CREATE POLICY "admins can manage team invites"
  ON team_invites FOR ALL
  USING (company_id = get_my_company_id() AND get_my_role() = 'admin');

-- ── Updated handle_new_user trigger ─────────────────────────
-- If invite_token is present in signup metadata, join that company
-- instead of creating a new one.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id    UUID;
  v_company_name  TEXT;
  v_slug          TEXT;
  v_suffix        TEXT;
  v_invite_token  TEXT;
  v_invite_role   user_role;
BEGIN
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  IF v_invite_token IS NOT NULL THEN
    SELECT ti.company_id, ti.role
      INTO v_company_id, v_invite_role
      FROM team_invites ti
     WHERE ti.token = v_invite_token
       AND ti.accepted_at IS NULL
       AND ti.expires_at > NOW();

    IF v_company_id IS NOT NULL THEN
      INSERT INTO users (id, company_id, full_name, email, role)
      VALUES (
        NEW.id,
        v_company_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        v_invite_role
      );

      UPDATE team_invites SET accepted_at = NOW() WHERE token = v_invite_token;

      RETURN NEW;
    END IF;
  END IF;

  -- No valid invite — create a new company (original behaviour)
  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    split_part(NEW.email, '@', 2)
  );

  v_slug := lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = v_slug) LOOP
    v_suffix := substr(gen_random_uuid()::text, 1, 6);
    v_slug := v_slug || '-' || v_suffix;
  END LOOP;

  INSERT INTO companies (name, slug)
  VALUES (v_company_name, v_slug)
  RETURNING id INTO v_company_id;

  INSERT INTO users (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$;
