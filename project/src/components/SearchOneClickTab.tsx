import { useState, useRef } from 'react';
import {
  Search,
  Loader2,
  MapPin,
  Banknote,
  Briefcase,
  Zap,
  ChevronRight,
  Sparkles,
  Save,
  CheckCircle2,
  Building2,
  Clock,
  Tag,
  TrendingUp,
  Link2,
  Check,
  AlertTriangle,
  Star,
  FileText,
  MessageSquare,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Calendar,
  Navigation,
  X,
} from 'lucide-react';
import type { Profile, JobPosting, SearchConditions, SearchResultJob } from '@/types';
import { searchJobs, searchResultToContent, latLngToMapPercent, MAP_BOUNDS } from '@/lib/jobSearch';
import { loadSearchConditions, saveSearchConditions, generateId } from '@/lib/storage';
import { runFullAnalysis, type OneClickResult } from '@/lib/aiAnalysis';
import { EDGE_FUNCTION_URL } from '@/lib/supabaseClient';

interface Props {
  profile: Profile | null;
  onJobAdded: (job: JobPosting) => void;
  onNavigateCalendar: () => void;
}

type PipelineStep = 'idle' | 'fetching' | 'analyzing' | 'company' | 'documents' | 'interview' | 'done' | 'error';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'fetching', label: '求人データを取得中' },
  { key: 'analyzing', label: '適合度を分析中' },
  { key: 'company', label: '企業情報・口コミを要約中' },
  { key: 'documents', label: '履歴書・職務経歴書を生成中' },
  { key: 'interview', label: '面接の想定質問と回答案を生成中' },
];

const defaultConditions: SearchConditions = {
  keywords: '',
  jobType: '社内SE ヘルプデスク',
  location: '沖縄 宮古島',
  salaryMin: 0,
  employmentType: '指定しない',
  noExperience: true,
  remoteOk: false,
};

export default function SearchOneClickTab({ profile, onJobAdded, onNavigateCalendar }: Props) {
  const [conditions, setConditions] = useState<SearchConditions>(loadSearchConditions() ?? defaultConditions);
  const [results, setResults] = useState<SearchResultJob[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [savedConditions, setSavedConditions] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // One-click pipeline state
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OneClickResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof SearchConditions, value: string | number | boolean) => {
    setConditions((prev) => ({ ...prev, [field]: value }));
    setSavedConditions(false);
  };

  const handleSaveConditions = () => {
    saveSearchConditions(conditions);
    setSavedConditions(true);
    setTimeout(() => setSavedConditions(false), 3000);
  };

  const handleSearch = () => {
    setSearching(true);
    setResults(null);
    setTimeout(() => {
      const found = searchJobs(conditions, profile);
      setResults(found);
      setSearching(false);
    }, 1200);
  };

  const handleSelectJob = (job: SearchResultJob) => {
    const content = searchResultToContent(job);
    setUrl(job.url);
    setPastedText(content);
    setSelectedJobId(job.id);
    setCurrentStep('idle');
    setResult(null);
    setError(null);
    // Scroll to pipeline section
    setTimeout(() => pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleRunPipeline = async () => {
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
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) headers['Authorization'] = `Bearer ${anonKey}`;

        const res = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: sourceUrl }),
        });
        if (!res.ok) {
          if (pastedText.trim()) content = pastedText;
          else throw new Error('ページの取得に失敗しました');
        } else {
          const data = await res.json();
          if (data.error) {
            if (pastedText.trim()) content = pastedText;
            else throw new Error(data.error);
          } else {
            content = data.content || pastedText || '';
          }
        }
      } else if (pastedText.trim()) {
        content = pastedText;
      } else {
        throw new Error('URLまたはテキストを入力してください');
      }

      if (!content || content.trim().length < 10) {
        throw new Error('求人内容を取得できませんでした。');
      }

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
      setError(err instanceof Error ? err.message : '不明なエラー');
      setCurrentStep('error');
    }
  };

  const handleResetPipeline = () => {
    setUrl('');
    setPastedText('');
    setCurrentStep('idle');
    setResult(null);
    setError(null);
    setSelectedJobId(null);
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
  const canRunPipeline = (url.trim().length > 0 || pastedText.trim().length > 0) && !isRunning;
  const highMatchCount = results ? results.filter((r) => r.matchScore >= 70).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">求人検索＆一括生成</h2>
            <p className="text-sm text-gray-500">条件で検索し、選んだ求人をAIが一括分析・書類作成</p>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          プロフィールを登録すると、より精度の高いマッチングが可能です。
        </div>
      )}

      {/* Search Conditions */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">検索条件</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> 希望職種
              </label>
              <input type="text" value={conditions.jobType} onChange={(e) => handleChange('jobType', e.target.value)} placeholder="社内SE, ヘルプデスク..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 希望勤務地
              </label>
              <input type="text" value={conditions.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="沖縄 宮古島..." className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> 最低年収（万円）
              </label>
              <input type="number" value={conditions.salaryMin || ''} onChange={(e) => handleChange('salaryMin', parseInt(e.target.value, 10) || 0)} placeholder="指定しない" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">雇用形態</label>
              <select value={conditions.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} className={inputClass}>
                <option value="指定しない">指定しない</option>
                <option value="正社員">正社員</option>
                <option value="契約社員">契約社員</option>
                <option value="派遣">派遣</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> フリーキーワード（任意）
            </label>
            <input type="text" value={conditions.keywords} onChange={(e) => handleChange('keywords', e.target.value)} placeholder="未経験歓迎, 研修あり..." className={inputClass} />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={conditions.noExperience} onChange={(e) => handleChange('noExperience', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-200" />
              <span className="text-sm text-gray-700">未経験歓迎</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={conditions.remoteOk} onChange={(e) => handleChange('remoteOk', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-200" />
              <span className="text-sm text-gray-700">リモート可</span>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button onClick={handleSearch} disabled={searching} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {searching ? '検索中...' : '求人を一括検索'}
            </button>
            <button onClick={handleSaveConditions} className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
              {savedConditions ? <CheckCircle2 className="w-4 h-4 text-success-600" /> : <Save className="w-4 h-4" />}
              {savedConditions ? '保存済み' : '条件を保存'}
            </button>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searching && (
        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-700">AIが最適な求人を検索中...</p>
          </div>
        </section>
      )}

      {results && !searching && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">検索結果：{results.length}件</h3>
              {highMatchCount > 0 && <p className="text-xs text-success-600 mt-0.5">高マッチ度（70%以上）{highMatchCount}件</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMap((s) => !s)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                <MapPin className="w-3.5 h-3.5" /> {showMap ? 'マップを閉じる' : 'マップ表示'}
              </button>
              <button onClick={handleSearch} className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> 再検索
              </button>
            </div>
          </div>

          {/* Mock Map */}
          {showMap && (
            <section className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand-500" /> マップ（沖縄エリア・現在地: 宮古島中心）
                </h4>
                <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="relative w-full h-72 bg-gradient-to-br from-brand-50 to-accent-50">
                {/* Mock ocean background */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50" />
                {/* Grid lines for map feel */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(59,91,240,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,91,240,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {/* Origin marker */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '50%', top: '48%' }}>
                  <div className="w-4 h-4 rounded-full bg-brand-600 ring-4 ring-brand-200" />
                  <p className="text-[10px] font-medium text-brand-700 bg-white/80 rounded px-1 mt-0.5 whitespace-nowrap">現在地</p>
                </div>
                {/* Job markers */}
                {results.map((job) => {
                  const pos = latLngToMapPercent(job.lat, job.lng, MAP_BOUNDS);
                  const isSelected = selectedJobId === job.id;
                  return (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all hover:z-30"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all ${isSelected ? 'bg-success-500 text-white ring-4 ring-success-200 scale-125' : 'bg-white text-brand-600 ring-2 ring-brand-300 hover:scale-110'}`}>
                        {job.matchScore}
                      </div>
                      <p className="text-[9px] font-medium text-gray-700 bg-white/90 rounded px-1 mt-0.5 whitespace-nowrap max-w-20 truncate">{job.company.slice(0, 8)}</p>
                    </button>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">ピンをタップすると求人を選択できます。数値はマッチ度（%）です。</p>
              </div>
            </section>
          )}

          {/* Job Cards */}
          <div className="space-y-3">
            {results.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                rank={index + 1}
                isSelected={selectedJobId === job.id}
                onSelect={() => handleSelectJob(job)}
              />
            ))}
          </div>
        </div>
      )}

      {!results && !searching && (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-1">条件を入力して「求人を一括検索」を押してください</p>
          <p className="text-xs text-gray-400">検索結果から求人を選ぶと、AI一括生成フローへ移行します</p>
        </div>
      )}

      {/* ─── One-Click Pipeline Section ─── */}
      {(selectedJobId || url || pastedText || result) && (
        <div ref={pipelineRef} className="mt-8 pt-8 border-t-2 border-brand-100">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">一括生成フロー</h3>
                <p className="text-sm text-gray-500">選んだ求人をAIが分析〜書類作成〜面接対策まで一括生成</p>
              </div>
            </div>
          </div>

          {/* Pipeline Input */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> 求人URL
                </label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/job/123" disabled={isRunning} className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">URLを入れると自動でページ内容を取得します</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">または</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">求人テキスト</label>
                <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="求人テキストを貼り付け..." rows={5} disabled={isRunning} className={inputClass} />
              </div>
              <button onClick={handleRunPipeline} disabled={!canRunPipeline || !profile} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
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
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-success-100' : isCurrent ? 'bg-brand-100' : 'bg-gray-100'}`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-success-600" /> : isCurrent ? <Loader2 className="w-4 h-4 text-brand-600 animate-spin" /> : <span className="text-xs text-gray-400">{index + 1}</span>}
                      </div>
                      <span className={`text-sm ${isDone ? 'text-gray-500' : isCurrent ? 'text-brand-700 font-medium' : 'text-gray-300'}`}>{step.label}</span>
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
              <button onClick={handleResetPipeline} className="mt-3 text-xs font-medium text-error-600 hover:text-error-700 underline">入力をやり直す</button>
            </section>
          )}

          {/* Results */}
          {result && currentStep === 'done' && (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl bg-success-50 border border-success-200 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-success-800">一括生成が完了しました</p>
                  <p className="text-xs text-success-700 mt-0.5">求人管理ボードにも自動保存されました</p>
                </div>
                <button onClick={handleResetPipeline} className="text-xs font-medium text-success-700 hover:text-success-800 underline shrink-0">新規分析</button>
              </div>

              {/* Job Header + Score */}
              <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">{result.title}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {result.company}</p>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">適合度</span>
                    <span className="text-3xl font-bold text-gray-900">{result.analysis.matchScore}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${result.analysis.matchScore >= 70 ? 'bg-success-500' : result.analysis.matchScore >= 45 ? 'bg-warning-400' : 'bg-error-400'}`} style={{ width: `${result.analysis.matchScore}%` }} />
                  </div>
                </div>
              </section>

              {/* Collapsible Sections */}
              <CollapsibleCard title="適合度分析の詳細" icon={TrendingUp} defaultOpen={true}>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">合う理由</h5>
                    <ul className="space-y-1.5">
                      {result.analysis.matchReasons.map((r, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" /> {r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">懸念点</h5>
                    <ul className="space-y-1.5">
                      {result.analysis.concerns.map((c, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 shrink-0" /> {c}</li>)}
                    </ul>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-medium text-gray-600">項目</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">あなた</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">求人</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-600">結果</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.analysis.conditionComparison.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-700 font-medium">{item.label}</td>
                            <td className="px-3 py-2 text-gray-600">{item.profileValue}</td>
                            <td className="px-3 py-2 text-gray-600">{item.jobValue}</td>
                            <td className="px-3 py-2 text-center">{item.match ? <Check className="w-4 h-4 text-success-600 inline" /> : <span className="text-error-500">x</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleCard>

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
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{result.companyInfo.reviewSummary}</p>
                    </div>
                    <div className="space-y-3">
                      {result.companyInfo.reviews.map((review, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">{review.author}</span>
                            <span className="text-xs font-bold text-warning-600 flex items-center gap-0.5"><Star className="w-3 h-3 fill-warning-400 text-warning-400" /> {review.rating}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-success-50 rounded-lg p-2"><span className="font-medium text-success-700">良い点：</span><span className="text-success-600">{review.pros}</span></div>
                            <div className="bg-warning-50 rounded-lg p-2"><span className="font-medium text-warning-700">改善点：</span><span className="text-warning-600">{review.cons}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">※ この情報は求人内容から推定したサンプルデータです。</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-5 text-center">
                    <p className="text-sm text-gray-500">企業名が特定できなかったため、企業情報・口コミは取得できませんでした。</p>
                  </div>
                )}
              </CollapsibleCard>

              <CollapsibleCard title="履歴書・職務経歴書・志望動機・自己PR" icon={FileText} defaultOpen={false}>
                <div className="space-y-4">
                  <DocSection title="志望動機" content={result.documents.motivation} onCopy={() => handleCopy(result.documents.motivation, 'motivation')} onDownload={() => handleDownload(result.documents.motivation, '志望動機.txt')} copied={copiedField === 'motivation'} />
                  <DocSection title="自己PR" content={result.documents.selfPr} onCopy={() => handleCopy(result.documents.selfPr, 'selfPr')} onDownload={() => handleDownload(result.documents.selfPr, '自己PR.txt')} copied={copiedField === 'selfPr'} />
                  <DocSection title="履歴書（ベース）" content={result.documents.resume} onCopy={() => handleCopy(result.documents.resume, 'resume')} onDownload={() => handleDownload(result.documents.resume, '履歴書.txt')} copied={copiedField === 'resume'} />
                </div>
              </CollapsibleCard>

              <CollapsibleCard title="面接の想定質問と回答案" icon={MessageSquare} defaultOpen={false}>
                <div className="space-y-3">
                  {result.interviewQuestions.map((q, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center mt-0.5">Q{i + 1}</span>
                        <p className="text-sm font-medium text-gray-900">{q.question}</p>
                      </div>
                      <div className="pl-8"><p className="text-xs text-gray-500 mb-1">回答案</p><p className="text-sm text-gray-700 leading-relaxed">{q.answerDraft}</p></div>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>

              {/* Calendar CTA */}
              <section className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-2xl border border-brand-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0"><Calendar className="w-5 h-5 text-brand-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">面接日程をカレンダーに追加</p>
                  <p className="text-xs text-gray-500 mt-0.5">面接が決まったら、カレンダータブから日程を登録できます</p>
                </div>
                <button onClick={onNavigateCalendar} className="shrink-0 text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-2 rounded-lg bg-white shadow-sm">カレンダーへ</button>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, rank, isSelected, onSelect }: { job: SearchResultJob; rank: number; isSelected: boolean; onSelect: () => void }) {
  const scoreColor = job.matchScore >= 80 ? { bar: 'bg-success-500', badge: 'bg-success-50 text-success-700' } : job.matchScore >= 60 ? { bar: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700' } : job.matchScore >= 40 ? { bar: 'bg-warning-400', badge: 'bg-warning-50 text-warning-700' } : { bar: 'bg-error-400', badge: 'bg-error-50 text-error-700' };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isSelected ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200 hover:shadow-md'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">#{rank}</span>
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{job.title}</h4>
              <div className="flex items-center gap-1.5 mt-0.5"><Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="text-sm text-gray-500 truncate">{job.company}</span></div>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${scoreColor.badge}`}><Sparkles className="w-3.5 h-3.5" />{job.matchScore}%</span>
        </div>
        <div className="mb-3"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${scoreColor.bar}`} style={{ width: `${job.matchScore}%` }} /></div></div>
        {/* Distance */}
        <div className="flex items-center gap-1.5 mb-2 text-xs text-brand-600 font-medium">
          <Navigation className="w-3.5 h-3.5" /> 現在地から約 {job.distanceKm.toFixed(1)}km
        </div>
        {/* Match Reasons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.matchReasons.slice(0, 3).map((reason, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-2.5 py-1"><TrendingUp className="w-3 h-3" />{reason}</span>
          ))}
        </div>
        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{job.location}</span></div>
          <div className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{job.salary}</span></div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /><span>{job.postedDays}日前</span></div>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.tags.map((tag, i) => <span key={i} className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5">{tag}</span>)}
        </div>
        <button onClick={onSelect} className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isSelected ? 'bg-success-600 text-white' : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800'}`}>
          {isSelected ? <><CheckCircle2 className="w-4 h-4" /> 選択中 — 下のフローへ</> : <><Zap className="w-4 h-4" /> この求人で一括生成へ <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

function CollapsibleCard({ title, icon: Icon, defaultOpen, children }: { title: string; icon: typeof TrendingUp; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><Icon className="w-4 h-4 text-brand-500" /> {title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="rounded-xl bg-gray-50 p-3 text-center"><p className="text-xs text-gray-400 mb-1">{label}</p><p className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">{icon}{value}</p></div>;
}

function DocSection({ title, content, onCopy, onDownload, copied }: { title: string; content: string; onCopy: () => void; onDownload: () => void; copied: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <div className="flex items-center gap-1.5">
          <button onClick={onCopy} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 rounded-lg hover:bg-white transition">{copied ? <Check className="w-3 h-3 text-success-600" /> : <Copy className="w-3 h-3" />}{copied ? '済' : 'コピー'}</button>
          <button onClick={onDownload} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 rounded-lg hover:bg-white transition"><Download className="w-3 h-3" /> DL</button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed p-4 max-h-64 overflow-y-auto font-sans">{content}</pre>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
