CREATE TABLE IF NOT EXISTS interview_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text,
  company text NOT NULL,
  position text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  location text DEFAULT '',
  interviewer text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_interview_schedules" ON interview_schedules;
CREATE POLICY "anon_select_interview_schedules" ON interview_schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_interview_schedules" ON interview_schedules;
CREATE POLICY "anon_insert_interview_schedules" ON interview_schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_interview_schedules" ON interview_schedules;
CREATE POLICY "anon_update_interview_schedules" ON interview_schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_interview_schedules" ON interview_schedules;
CREATE POLICY "anon_delete_interview_schedules" ON interview_schedules FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS gmail_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  watch_expiration timestamptz,
  history_id text DEFAULT '',
  last_synced_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gmail_integrations" ON gmail_integrations;
CREATE POLICY "anon_select_gmail_integrations" ON gmail_integrations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gmail_integrations" ON gmail_integrations;
CREATE POLICY "anon_insert_gmail_integrations" ON gmail_integrations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gmail_integrations" ON gmail_integrations;
CREATE POLICY "anon_update_gmail_integrations" ON gmail_integrations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gmail_integrations" ON gmail_integrations;
CREATE POLICY "anon_delete_gmail_integrations" ON gmail_integrations FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS selection_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id text UNIQUE NOT NULL,
  job_id text,
  company text DEFAULT '',
  subject text DEFAULT '',
  snippet text DEFAULT '',
  email_type text NOT NULL DEFAULT 'other',
  received_at timestamptz DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE selection_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_selection_emails" ON selection_emails;
CREATE POLICY "anon_select_selection_emails" ON selection_emails FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_selection_emails" ON selection_emails;
CREATE POLICY "anon_insert_selection_emails" ON selection_emails FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_selection_emails" ON selection_emails;
CREATE POLICY "anon_update_selection_emails" ON selection_emails FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_selection_emails" ON selection_emails;
CREATE POLICY "anon_delete_selection_emails" ON selection_emails FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_at ON interview_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_selection_emails_received_at ON selection_emails(received_at DESC);