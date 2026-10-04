import { supabase } from '@/lib/supabaseClient';
import type { InterviewSchedule, SelectionEmail, GmailIntegration, EmailType } from '@/types';

export async function fetchSchedules(): Promise<InterviewSchedule[]> {
  const { data, error } = await supabase
    .from('interview_schedules')
    .select('*')
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapSchedule);
}

export async function createSchedule(
  schedule: Omit<InterviewSchedule, 'id'>
): Promise<InterviewSchedule> {
  const { data, error } = await supabase
    .from('interview_schedules')
    .insert({
      job_id: schedule.jobId,
      company: schedule.company,
      position: schedule.position,
      scheduled_at: schedule.scheduledAt,
      duration_minutes: schedule.durationMinutes,
      location: schedule.location,
      interviewer: schedule.interviewer,
      notes: schedule.notes,
      status: schedule.status,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSchedule(data);
}

export async function updateScheduleStatus(
  id: string,
  status: InterviewSchedule['status']
): Promise<void> {
  const { error } = await supabase
    .from('interview_schedules')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('interview_schedules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapSchedule(row: Record<string, unknown>): InterviewSchedule {
  return {
    id: row.id as string,
    jobId: row.job_id as string,
    company: row.company as string,
    position: row.position as string,
    scheduledAt: row.scheduled_at as string,
    durationMinutes: row.duration_minutes as number,
    location: (row.location as string) || '',
    interviewer: (row.interviewer as string) || '',
    notes: (row.notes as string) || '',
    status: row.status as InterviewSchedule['status'],
  };
}

// ─── Google Calendar export ──────────────────────────────────────────────────

export function generateGoogleCalendarUrl(schedule: InterviewSchedule): string {
  const start = new Date(schedule.scheduledAt);
  const end = new Date(start.getTime() + schedule.durationMinutes * 60000);

  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `面接 - ${schedule.company} ${schedule.position}`,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: `面接予定\n企業: ${schedule.company}\n職種: ${schedule.position}${
      schedule.interviewer ? `\n面接官: ${schedule.interviewer}` : ''
    }${schedule.notes ? `\n備考: ${schedule.notes}` : ''}`,
    location: schedule.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICalContent(schedule: InterviewSchedule): string {
  const start = new Date(schedule.scheduledAt);
  const end = new Date(start.getTime() + schedule.durationMinutes * 60000);
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Job Agent//Interview Calendar//JA',
    'BEGIN:VEVENT',
    `UID:${schedule.id}@ai-job-agent`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:面接 - ${schedule.company} ${schedule.position}`,
    `LOCATION:${schedule.location}`,
    `DESCRIPTION:企業: ${schedule.company}\\n職種: ${schedule.position}${
      schedule.interviewer ? `\\n面接官: ${schedule.interviewer}` : ''
    }${schedule.notes ? `\\n備考: ${schedule.notes}` : ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICal(schedule: InterviewSchedule): void {
  const content = generateICalContent(schedule);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-${schedule.company}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Gmail Integration (mock/simulated for MVP) ──────────────────────────────

export async function fetchGmailIntegration(): Promise<GmailIntegration | null> {
  const { data, error } = await supabase
    .from('gmail_integrations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    watchExpiration: data.watch_expiration,
    historyId: data.history_id || '',
    lastSyncedAt: data.last_synced_at,
    isActive: data.is_active,
  };
}

export async function activateGmailWatch(email: string): Promise<GmailIntegration> {
  // For MVP: we simulate the Gmail watch activation by storing the record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Pub/Sub watch expires in ~7 days

  const { data, error } = await supabase
    .from('gmail_integrations')
    .insert({
      email,
      watch_expiration: expiresAt.toISOString(),
      history_id: '0',
      last_synced_at: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    watchExpiration: data.watch_expiration,
    historyId: data.history_id || '',
    lastSyncedAt: data.last_synced_at,
    isActive: data.is_active,
  };
}

export async function deactivateGmailWatch(id: string): Promise<void> {
  const { error } = await supabase
    .from('gmail_integrations')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// ─── Selection Email parsing ─────────────────────────────────────────────────

const EMAIL_TYPE_PATTERNS: { type: EmailType; patterns: RegExp[] }[] = [
  {
    type: 'interview_invite',
    patterns: [/面接|インタビュー|interview|選考日程|二次選考|三次選考/i],
  },
  {
    type: 'document_screening',
    patterns: [/書類選考|書類通過|書類審査|通過/i],
  },
  {
    type: 'offer',
    patterns: [/内定|採用通知|offer|合格/i],
  },
  {
    type: 'rejection',
    patterns: [/不採用|お見送り|誠に残念|今回は.*見送らせて|ご縁がなかった/i],
  },
];

function classifyEmail(subject: string, snippet: string): EmailType {
  const text = `${subject} ${snippet}`;
  for (const { type, patterns } of EMAIL_TYPE_PATTERNS) {
    for (const p of patterns) {
      if (p.test(text)) return type;
    }
  }
  return 'other';
}

export async function fetchSelectionEmails(): Promise<SelectionEmail[]> {
  const { data, error } = await supabase
    .from('selection_emails')
    .select('*')
    .order('received_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEmail);
}

export async function syncSelectionEmails(
  integration: GmailIntegration
): Promise<SelectionEmail[]> {
  // For MVP: we simulate fetching new emails by generating mock selection emails
  // based on known patterns. In production, this would use the Gmail API.
  const mockEmails = generateMockEmails(integration.email);

  // Insert new emails (skip duplicates)
  const newEmails: SelectionEmail[] = [];
  for (const mock of mockEmails) {
    const { data: existing } = await supabase
      .from('selection_emails')
      .select('id')
      .eq('gmail_message_id', mock.gmailMessageId)
      .maybeSingle();

    if (existing) continue;

    const { data, error } = await supabase
      .from('selection_emails')
      .insert({
        gmail_message_id: mock.gmailMessageId,
        job_id: mock.jobId,
        company: mock.company,
        subject: mock.subject,
        snippet: mock.snippet,
        email_type: mock.emailType,
        received_at: mock.receivedAt,
        processed: false,
      })
      .select()
      .single();

    if (!error && data) {
      newEmails.push(mapEmail(data));
    }
  }

  // Update last synced
  await supabase
    .from('gmail_integrations')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', integration.id);

  return newEmails;
}

function generateMockEmails(emailAddress: string): {
  gmailMessageId: string;
  jobId: string | null;
  company: string;
  subject: string;
  snippet: string;
  emailType: EmailType;
  receivedAt: string;
}[] {
  // Generate realistic-looking mock emails based on common selection flow
  const now = Date.now();
  return [
    {
      gmailMessageId: `mock-${now}-1`,
      jobId: null,
      company: '株式会社テックイノベーション',
      subject: '【書類選考通過】株式会社テックイノベーションより面接のご案内',
      snippet: 'この度はご応募いただきありがとうございます。書類選考の結果、面接に進んでいただくこととなりました...',
      emailType: 'interview_invite',
      receivedAt: new Date(now - 3600_000).toISOString(),
    },
    {
      gmailMessageId: `mock-${now}-2`,
      jobId: null,
      company: '株式会社グローバルソリューションズ',
      subject: '【選考結果】書類通過のお知らせ',
      snippet: '応募いただいた職位につきまして、書類審査を通過されました。次回の面接日程についてご連絡いたします...',
      emailType: 'document_screening',
      receivedAt: new Date(now - 7200_000).toISOString(),
    },
    {
      gmailMessageId: `mock-${now}-3`,
      jobId: null,
      company: '株式会社スタートアップベンチャーズ',
      subject: '面接日程のご相談',
      snippet: '面接の日程について、以下の候補日からご都合の良い日をお知らせください。1. 10/5（月）14:00〜...',
      emailType: 'interview_invite',
      receivedAt: new Date(now - 86400_000).toISOString(),
    },
  ];
}

export async function markEmailProcessed(id: string, jobId: string | null): Promise<void> {
  const { error } = await supabase
    .from('selection_emails')
    .update({ processed: true, job_id: jobId })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEmail(id: string): Promise<void> {
  const { error } = await supabase
    .from('selection_emails')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapEmail(row: Record<string, unknown>): SelectionEmail {
  return {
    id: row.id as string,
    gmailMessageId: row.gmail_message_id as string,
    jobId: row.job_id as string | null,
    company: (row.company as string) || '',
    subject: (row.subject as string) || '',
    snippet: (row.snippet as string) || '',
    emailType: (row.email_type as EmailType) || 'other',
    receivedAt: row.received_at as string,
    processed: row.processed as boolean,
  };
}
