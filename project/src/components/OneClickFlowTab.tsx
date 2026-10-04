import { useState, useEffect } from 'react';
import {
  Zap,
  Link2,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Building2,
  Star,
  FileText,
  MessageSquare,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
} from 'lucide-react';
import type { Profile, JobPosting } from '@/types';
import { runFullAnalysis, type OneClickResult } from '@/lib/aiAnalysis';
import { generateId } from '@/lib/storage';
import { EDGE_FUNCTION_URL } from '@/lib/supabaseClient';

interface Props {
  profile: Profile | null;
  onJobAdded: (job: JobPosting) => void;
  onNavigateCalendar: () => void;
  prefillContent?: string;
  prefillUrl?: string;
}

type PipelineStep = 'idle' | 'fetching' | 'analyzing' | 'company' | 'documents' | 'interview' | 'done' | 'error';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'fetching', label: '求人ページを取得中' },
  { key: 'analyzing', label: '適合度を分析中' },
  { key: 'company', label: '企業情報・口コミを要約中' },
  { key: 'documents', label: '履歴書・職務経歴書を生成中' },
  { key: 'interview', label: '面接の想定質問と回答案を生成中' },
];

export default function OneClickFlowTab({ profile, onJobAdded, onNavigateCalendar, prefillContent, prefillUrl }: Props) {
  const [url, setUrl] = useState(prefillUrl ?? '');
  const [pastedText, setPastedText] = useState(prefillContent ?? '');
  const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OneClickResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (prefillContent !== undefined) {
      setPastedText(prefillContent);
      setCurrentStep('idle');
      setResult(null);
      setError(null);
    }
    if (prefillUrl !== undefined) {
      setUrl(prefillUrl);
    }
  }, [prefillContent, prefillUrl]);

  const canRun = (url.trim().length > 0 || pastedText.trim().length > 0) && currentStep !== 'fetching';

  const handleRun = async () => {
    if (!profile) {
      setError('先にプロフィールを登録してください');
      return;
    }
    setError(null);
    setResult(null);
    setCurrentStep('fetching');

    let content = '';
    let sourceUrl = url.trim();

    try {
      if (sourceUrl) {
        // Fetch via edge function
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        // Add API key if available
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers['Authorization'] = `Bearer ${anonKey}`;
        }

        const res = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: sourceUrl }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: 'Fetch failed' }));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.error) {
          // If fetch failed, fall back to pasted text or show error
          if (pastedText.trim()) {
            content = pastedText;
          } else {
            throw new Error(data.error);
          }
        } else {
          content = data.content || '';
          if (data.title && !pastedText) {
            content = `${data.title}\n\n${content}`;
          }
        }
      } else if (pastedText.trim()) {
        content = pastedText;
      } else {
        throw new Error('URLまたはテキストを入力してください');
      }

      if (!content || content.trim().length < 10) {
        throw new Error('求人内容を取得できませんでした。テキストを直接貼り付けてお試しください。');
      }

      // Run through pipeline steps with visual feedback
      setCurrentStep('analyzing');
      await delay(800);

      const fullResult = runFullAnalysis(profile, content, sourceUrl);

      setCurrentStep('company');
      await delay(800);

      setCurrentStep('documents');
      await delay(800);

      setCurrentStep('interview');
      await delay(800);

      setCurrentStep('done');
      setResult(fullResult);

      // Save as job posting
      const job: JobPosting = {
        id: generateId(),
        title: fullResult.title,
        company: fullResult.company,
        url: sourceUrl,
        content: fullResult.content,
        salary: fullResult.salary,
        location: fullResult.location,
        holidays: fullResult.holidays,
        createdAt: Date.now(),
        analysis: fullResult.analysis,
        companyInfo: fullResult.companyInfo,
        documents: fullResult.documents,
        interviewQuestions: fullResult.interviewQuestions,
        status: 'saved',
      };
      onJobAdded(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setCurrentStep('error');
    }
  };

  const handleReset = () => {
    setUrl('');
    setPastedText('');
    setCurrentStep('idle');
    setResult(null);
    setError(null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const isRunning = ['fetching', 'analyzing', 'company', 'documents', 'interview'].includes(currentStep);
  const stepOrder: PipelineStep[] = ['fetching', 'analyzing', 'company', 'documents', 'interview'];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">全自動一気通貫フロー</h2>
            <p className="text-sm text-gray-500">URLを入れるだけで、分析〜書類作成〜面接対策まで一括生成</p>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          プロフィールが未登録です。「プロフィール登録」タブで先に登録してください。
        </div>
      )}

      {/* Input Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> 求人URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/job/123"
              disabled={isRunning}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">URLを入れると自動でページ内容を取得します</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">または</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">求人テキストを直接貼り付け</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="求人ページのテキストをそのまま貼り付けてください..."
              rows={5}
              disabled={isRunning}
              className={inputClass}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={!canRun || !profile}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isRunning ? 'AI分析中...' : '一括生成を開始'}
          </button>
        </div>
      </section>

      {/* Pipeline Progress */}
      {isRunning && (
        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="space-y-3">
            {STEPS.map((step, index) => {
              const currentIdx = stepOrder.indexOf(currentStep);
              const stepIdx = stepOrder.indexOf(step.key);
              const isDone = stepIdx < currentIdx;
              const isCurrent = stepIdx === currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone ? 'bg-success-100' : isCurrent ? 'bg-brand-100' : 'bg-gray-100'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-success-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                    ) : (
                      <span className="text-xs text-gray-400">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isDone ? 'text-gray-500' : isCurrent ? 'text-brand-700 font-medium' : 'text-gray-300'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Error */}
      {error && currentStep === 'error' && (
        <section className="mt-6 rounded-xl border border-error-200 bg-error-50 p-5 text-sm text-error-800">
          <p className="font-medium mb-1">エラーが発生しました</p>
          <p className="text-error-700">{error}</p>
          <button
            onClick={handleReset}
            className="mt-3 text-xs font-medium text-error-600 hover:text-error-700 underline"
          >
            入力をやり直す
          </button>
        </section>
      )}

      {/* Results */}
      {result && currentStep === 'done' && (
        <div className="mt-6 space-y-5">
          {/* Success Banner */}
          <div className="rounded-xl bg-success-50 border border-success-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-success-800">一括生成が完了しました</p>
              <p className="text-xs text-success-700 mt-0.5">求人管理ボードにも自動保存されました</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-success-700 hover:text-success-800 underline shrink-0"
            >
              新規分析
            </button>
          </div>

          {/* Job Header */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">{result.title}</h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {result.company}
            </p>
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">適合度</span>
                <span className="text-3xl font-bold text-gray-900">{result.analysis.matchScore}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.analysis.matchScore >= 70 ? 'bg-success-500' : result.analysis.matchScore >= 45 ? 'bg-warning-400' : 'bg-error-400'
                  }`}
                  style={{ width: `${result.analysis.matchScore}%` }}
                />
              </div>
            </div>
          </section>

          {/* Analysis Detail */}
          <CollapsibleCard title="適合度分析の詳細" icon={TrendingUp} defaultOpen={true}>
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">合う理由</h5>
                <ul className="space-y-1.5">
                  {result.analysis.matchReasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">懸念点</h5>
                <ul className="space-y-1.5">
                  {result.analysis.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 shrink-0" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">項目</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">あなた</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">求人</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">結果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.analysis.conditionComparison.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700 font-medium">{item.label}</td>
                        <td className="px-3 py-2 text-gray-600">{item.profileValue}</td>
                        <td className="px-3 py-2 text-gray-600">{item.jobValue}</td>
                        <td className="px-3 py-2 text-center">
                          {item.match ? (
                            <Check className="w-4 h-4 text-success-600 inline" />
                          ) : (
                            <span className="text-error-500">x</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleCard>

          {/* Company Info */}
          <CollapsibleCard title="企業情報・口コミ要約" icon={Building2} defaultOpen={true}>
            {result.companyInfo.foundInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoTile label="業界" value={result.companyInfo.industry} />
                  <InfoTile label="規模" value={result.companyInfo.size} />
                  <InfoTile label="設立" value={result.companyInfo.founded} />
                  <InfoTile label="評価" value={`${result.companyInfo.rating} / 5.0`} icon={<Star className="w-3 h-3 text-warning-500" />} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.companyInfo.overview}</p>
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">口コミ要約</h5>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
                    {result.companyInfo.reviewSummary}
                  </p>
                </div>
                <div className="space-y-3">
                  {result.companyInfo.reviews.map((review, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">{review.author}</span>
                        <span className="text-xs font-bold text-warning-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-warning-400 text-warning-400" /> {review.rating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-success-50 rounded-lg p-2">
                          <span className="font-medium text-success-700">良い点：</span>
                          <span className="text-success-600">{review.pros}</span>
                        </div>
                        <div className="bg-warning-50 rounded-lg p-2">
                          <span className="font-medium text-warning-700">改善点：</span>
                          <span className="text-warning-600">{review.cons}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  ※ この情報は求人内容から推定したサンプルデータです。実際の企業情報とは異なる場合があります。
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-5 text-center">
                <p className="text-sm text-gray-500">
                  企業名が特定できなかったため、企業情報・口コミは取得できませんでした。
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  求人テキストに企業名が含まれているかご確認ください。
                </p>
              </div>
            )}
          </CollapsibleCard>

          {/* Documents */}
          <CollapsibleCard title="履歴書・職務経歴書・志望動機・自己PR" icon={FileText} defaultOpen={false}>
            <div className="space-y-4">
              <DocSection
                title="志望動機"
                content={result.documents.motivation}
                onCopy={() => handleCopy(result.documents.motivation, 'motivation')}
                onDownload={() => handleDownload(result.documents.motivation, '志望動機.txt')}
                copied={copiedField === 'motivation'}
              />
              <DocSection
                title="自己PR"
                content={result.documents.selfPr}
                onCopy={() => handleCopy(result.documents.selfPr, 'selfPr')}
                onDownload={() => handleDownload(result.documents.selfPr, '自己PR.txt')}
                copied={copiedField === 'selfPr'}
              />
              <DocSection
                title="履歴書（ベース）"
                content={result.documents.resume}
                onCopy={() => handleCopy(result.documents.resume, 'resume')}
                onDownload={() => handleDownload(result.documents.resume, '履歴書.txt')}
                copied={copiedField === 'resume'}
              />
            </div>
          </CollapsibleCard>

          {/* Interview Questions */}
          <CollapsibleCard title="面接の想定質問と回答案" icon={MessageSquare} defaultOpen={false}>
            <div className="space-y-3">
              {result.interviewQuestions.map((q, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      Q{i + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  </div>
                  <div className="pl-8">
                    <p className="text-xs text-gray-500 mb-1">回答案</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{q.answerDraft}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Calendar CTA */}
          <section className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-2xl border border-brand-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Calendar className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">面接日程をカレンダーに追加</p>
              <p className="text-xs text-gray-500 mt-0.5">面接が決まったら、カレンダータブから日程を登録できます</p>
            </div>
            <button
              onClick={onNavigateCalendar}
              className="shrink-0 text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-2 rounded-lg bg-white shadow-sm"
            >
              カレンダーへ
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function CollapsibleCard({
  title,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon: typeof TrendingUp;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Icon className="w-4 h-4 text-brand-500" /> {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
        {icon}
        {value}
      </p>
    </div>
  );
}

function DocSection({
  title,
  content,
  onCopy,
  onDownload,
  copied,
}: {
  title: string;
  content: string;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <div className="flex items-center gap-1.5">
          <button onClick={onCopy} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 rounded-lg hover:bg-white transition">
            {copied ? <Check className="w-3 h-3 text-success-600" /> : <Copy className="w-3 h-3" />}
            {copied ? '済' : 'コピー'}
          </button>
          <button onClick={onDownload} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 rounded-lg hover:bg-white transition">
            <Download className="w-3 h-3" /> DL
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed p-4 max-h-64 overflow-y-auto font-sans">
        {content}
      </pre>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
