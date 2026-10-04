/*
# Create interview_schedules and gmail_integrations tables (single-tenant, no auth)

1. New Tables
- `interview_schedules`: Stores scheduled interview events linked to job postings.
  - `id` (uuid, primary key)
  - `job_id` (text, references a job posting by its local ID string)
  - `company` (text, company name)
  - `position` (text, job title)
  - `scheduled_at` (timestamptz, when the interview is scheduled)
  - `duration_minutes` (int, default 60)
  - `location` (text, interview location or online meeting URL)
  - `interviewer` (text, interviewer name if known)
  - `notes` (text, any additional notes)
  - `status` (text, one of: scheduled, completed, cancelled)
  - `created_at` (timestamptz, default now())

- `gmail_integrations`: Tracks Gmail watch/publish setup and last processed history ID.
  - `id` (uuid, primary key, single row)
  - `email` (text, the Gmail address being monitored)
  - `watch_expiration` (timestamptz, when the Pub/Sub watch expires)
  - `history_id` (text, last processed Gmail history ID)
  - `last_synced_at` (timestamptz, when we last checked for new emails)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now())

- `selection_emails`: Stores parsed selection-related emails from Gmail monitoring.
  - `id` (uuid, primary key)
  - `gmail_message_id` (text, unique, the Gmail message ID)
  - `job_id` (text, nullable, matched job posting ID)
  - `company` (text, extracted company name from email)
  - `subject` (text, email subject)
  - `snippet` (text, short email preview)
  - `email_type` (text, one of: document_screening, interview_invite, offer, rejection, other)
  - `received_at` (timestamptz, when the email was received)
  - `processed` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on all tables because the app is single-tenant (no sign-in).
  The data is intentionally shared/public for this MVP.

3. Important Notes
- This is a single-tenant MVP: no user_id columns, no auth required.
- The app uses the anon key for all operations.
- Gmail integration is mock/simulated for the MVP: the edge function simulates
  the Gmail watch flow and email parsing without actual Gmail API credentials.
*/