import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MailCheck,
  CalendarCheck,
  FileCheck,
  XCircle as XIcon,
  Inbox,
  Trash2,
  Link2,
  AlertCircle,
  Bell,
  BellRing,
  X,
  Smartphone,
} from 'lucide-react';
import type { GmailIntegration, SelectionEmail, EmailType, JobPosting } from '@/types';
import {
  fetchGmailIntegration,
  activateGmailWatch,
  deactivateGmailWatch,
  fetchSelectionEmails,
  syncSelectionEmails,
  markEmailProcessed,
  deleteEmail,
} from '@/lib/calendarGmail';

interface Props {
  jobs: JobPosting[];
  onLinkEmailToJob: (jobId: string) => void;
}

const EMAIL_TYPE_CONFIG: Record<EmailType, { label: string; icon: typeof MailCheck; color: string; bg: string }> = {
  interview_invite: { label: '面接案内', icon: CalendarCheck, color: 'text-brand-600', bg: 'bg-brand-50' },
  document_screening: { label: '書類通過', icon: FileCheck, color: 'text-accent-600', bg: 'bg-accent-50' },
  offer: { label: '内定', icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50' },
  rejection: { label: '不採用', icon: XIcon, color: 'text-error-600', bg: 'bg-error-50' },
  other: { label: 'その他', icon: Inbox, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function GmailTab({ jobs, onLinkEmailToJob }: Props) {
  const [integration, setIntegration] = useState<GmailIntegration | null>(null);
  const [emails, setEmails] = useState<SelectionEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [linkingEmailId, setLinkingEmailId] = useState<string | null>(null);
  const [linkJobId, setLinkJobId] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [integ, mails] = await Promise.all([
        fetchGmailIntegration(),
        fetchSelectionEmails(),
      ]);
      setIntegration(integ);
      setEmails(mails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async () => {
    if (!emailInput.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const integ = await activateGmailWatch(emailInput.trim());
      setIntegration(integ);
      setShowConnectForm(false);
      setEmailInput('');
      // Auto-sync after connecting
      await handleSync(integ);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gmail連携の開始に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    if (!confirm('Gmail連携を解除しますか？')) return;
    setActionLoading(true);
    try {
      await deactivateGmailWatch(integration.id);
      setIntegration(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '連携解除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async (integ?: GmailIntegration) => {
    const active = integ || integration;
    if (!active) return;
    setActionLoading(true);
    setError(null);
    try {
      await syncSelectionEmails(active);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メール同期に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkJob = async (emailId: string) => {
    if (!linkJobId) {
      setLinkingEmailId(linkingEmailId === emailId ? null : emailId);
      return;
    }
    try {
      await markEmailProcessed(emailId, linkJobId);
      onLinkEmailToJob(linkJobId);
      setLinkingEmailId(null);
      setLinkJobId('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '関連付けに失敗しました');
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('このメールを削除しますか？')) return;
    try {
      await deleteEmail(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gmail連携・選考メール監視</h2>
            <p className="text-sm text-gray-500">選考関連メールを自動で監視・分類します</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Connection Status */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-6">
        {integration ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${integration.isActive ? 'bg-success-50' : 'bg-gray-100'}`}>
                  {integration.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{integration.email}</p>
                  <p className="text-xs text-gray-500">
                    {integration.isActive ? '監視中' : '連携解除済み'}
                    {integration.lastSyncedAt && (
                      <> · 最終同期: {new Date(integration.lastSyncedAt).toLocaleString('ja-JP')}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSync()}
                  disabled={actionLoading || !integration.isActive}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-600 rounded-lg border border-brand-200 hover:bg-brand-50 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} /> 同期
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  解除
                </button>
              </div>
            </div>
            {integration.isActive && (
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-600 bg-brand-50 rounded-lg p-2.5">
                <Bell className="w-3.5 h-3.5" />
                <span>選考関連メールを受信すると自動で分類・表示されます</span>
              </div>
            )}
          </div>
        ) : showConnectForm ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Gmail連携を開始</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gmailアドレス</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your@gmail.com"
                className={inputClass}
              />
            </div>
            <div className="rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
              <p className="font-medium mb-1">連携について</p>
              <p>このMVPでは、Gmail APIの代わりにシミュレーション機能を使用しています。「同期」ボタンを押すと、サンプルの選考メールが生成・分類されます。本番環境では実際のGmail APIとPub/Subを利用します。</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConnect}
                disabled={!emailInput.trim() || actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                連携を開始
              </button>
              <button
                onClick={() => setShowConnectForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-100 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Gmail連携が未設定です</p>
            <button
              onClick={() => setShowConnectForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition shadow-sm"
            >
              <Mail className="w-4 h-4" /> Gmail連携を開始
            </button>
          </div>
        )}
      </section>

      {/* Emails */}
      {emails.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">選考メール（{emails.length}件）</h3>
          </div>
          <div className="space-y-3">
            {emails.map((email) => {
              const config = EMAIL_TYPE_CONFIG[email.emailType];
              const Icon = config.icon;
              return (
                <div key={email.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{email.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {email.company} · {new Date(email.receivedAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{email.snippet}</p>

                      {linkingEmailId === email.id ? (
                        <div className="mt-3 flex items-center gap-2">
                          <select
                            value={linkJobId}
                            onChange={(e) => setLinkJobId(e.target.value)}
                            className="flex-1 text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white text-gray-600 focus:border-brand-400 outline-none"
                          >
                            <option value="">求人を選択...</option>
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id}>{j.title} - {j.company}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleLinkJob(email.id)}
                            disabled={!linkJobId}
                            className="text-xs font-medium text-brand-600 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition disabled:opacity-50"
                          >
                            リンク
                          </button>
                          <button
                            onClick={() => { setLinkingEmailId(null); setLinkJobId(''); }}
                            className="text-xs font-medium text-gray-400 px-2 py-1.5"
                          >
                            戻る
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          {email.processed && email.jobId ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                              <Link2 className="w-3 h-3" /> 求人にリンク済み
                            </span>
                          ) : (
                            <button
                              onClick={() => setLinkingEmailId(email.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                            >
                              <Link2 className="w-3 h-3" /> 求人にリンク
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEmail(email.id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-error-500 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {integration && emails.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-3">選考メールがありません</p>
          <button
            onClick={() => handleSync()}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-600 rounded-xl border border-brand-200 hover:bg-brand-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /> メールを同期
          </button>
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
