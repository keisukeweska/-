import { useState } from 'react';
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
} from 'lucide-react';
import type { Profile, SearchConditions, SearchResultJob } from '@/types';
import { searchJobs, searchResultToContent } from '@/lib/jobSearch';
import { loadSearchConditions, saveSearchConditions } from '@/lib/storage';

interface Props {
  profile: Profile | null;
  onSelectJob: (content: string, url: string) => void;
}

const defaultConditions: SearchConditions = {
  keywords: '',
  jobType: '社内SE ヘルプデスク',
  location: '沖縄 宮古島',
  salaryMin: 0,
  employmentType: '指定しない',
  noExperience: true,
  remoteOk: false,
};

export default function SearchTab({ profile, onSelectJob }: Props) {
  const [conditions, setConditions] = useState<SearchConditions>(
    loadSearchConditions() ?? defaultConditions
  );
  const [results, setResults] = useState<SearchResultJob[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [savedConditions, setSavedConditions] = useState(false);

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
    // Simulate search with delay for UX
    setTimeout(() => {
      const found = searchJobs(conditions, profile);
      setResults(found);
      setSearching(false);
    }, 1500);
  };

  const handleSelectJob = (job: SearchResultJob) => {
    const content = searchResultToContent(job);
    onSelectJob(content, job.url);
  };

  const highMatchCount = results ? results.filter((r) => r.matchScore >= 70).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">求人自動検索（AIスカウト）</h2>
            <p className="text-sm text-gray-500">希望条件を入力して、マッチする求人を自動検索</p>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          プロフィールを登録すると、より精度の高いマッチングが可能です。「プロフィール登録」タブで登録してください。
        </div>
      )}

      {/* Search Conditions Form */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">検索条件</h3>
        <div className="space-y-4">
          {/* Job Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> 希望職種
            </label>
            <input
              type="text"
              value={conditions.jobType}
              onChange={(e) => handleChange('jobType', e.target.value)}
              placeholder="社内SE, ヘルプデスク, ITサポート..."
              className={inputClass}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 希望勤務地
            </label>
            <input
              type="text"
              value={conditions.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="沖縄 宮古島 / リモート..."
              className={inputClass}
            />
          </div>

          {/* Salary + Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> 最低年収（万円）
              </label>
              <input
                type="number"
                value={conditions.salaryMin || ''}
                onChange={(e) => handleChange('salaryMin', parseInt(e.target.value, 10) || 0)}
                placeholder="指定しない"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">雇用形態</label>
              <select
                value={conditions.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className={inputClass}
              >
                <option value="指定しない">指定しない</option>
                <option value="正社員">正社員</option>
                <option value="契約社員">契約社員</option>
                <option value="派遣">派遣</option>
              </select>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> フリーキーワード（任意）
            </label>
            <input
              type="text"
              value={conditions.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              placeholder="未経験歓迎, 研修あり, 移住支援..."
              className={inputClass}
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conditions.noExperience}
                onChange={(e) => handleChange('noExperience', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="text-sm text-gray-700">未経験歓迎</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conditions.remoteOk}
                onChange={(e) => handleChange('remoteOk', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="text-sm text-gray-700">リモート可</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {searching ? '検索中...' : '求人を一括検索'}
            </button>
            <button
              onClick={handleSaveConditions}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            >
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
            <p className="text-xs text-gray-400 mt-1">あなたの希望条件とプロフィールにマッチする求人を探しています</p>
          </div>
        </section>
      )}

      {results && !searching && (
        <div className="mt-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                検索結果：{results.length}件
              </h3>
              {highMatchCount > 0 && (
                <p className="text-xs text-success-600 mt-0.5">
                  そのうち{highMatchCount}件が高マッチ度（70%以上）
                </p>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" /> 再検索
            </button>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {results.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                rank={index + 1}
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
          <p className="text-xs text-gray-400">マッチ度順に求人を表示し、選択すれば一括生成フローへ移行できます</p>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  rank,
  onSelect,
}: {
  job: SearchResultJob;
  rank: number;
  onSelect: () => void;
}) {
  const scoreColor =
    job.matchScore >= 80
      ? { bar: 'bg-success-500', badge: 'bg-success-50 text-success-700' }
      : job.matchScore >= 60
      ? { bar: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700' }
      : job.matchScore >= 40
      ? { bar: 'bg-warning-400', badge: 'bg-warning-50 text-warning-700' }
      : { bar: 'bg-error-400', badge: 'bg-error-50 text-error-700' };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Top Row: Rank + Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
              #{rank}
            </span>
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{job.title}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate">{job.company}</span>
              </div>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${scoreColor.badge}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {job.matchScore}%
          </span>
        </div>

        {/* Score Bar */}
        <div className="mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scoreColor.bar}`}
              style={{ width: `${job.matchScore}%` }}
            />
          </div>
        </div>

        {/* Match Reasons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.matchReasons.slice(0, 3).map((reason, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-2.5 py-1"
            >
              <TrendingUp className="w-3 h-3" />
              {reason}
            </span>
          ))}
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{job.postedDays}日前</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold text-sm hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm"
        >
          <Zap className="w-4 h-4" />
          この求人で一括生成フローへ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
