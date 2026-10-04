import { useState } from 'react';
import { KanbanSquare, Trash2, ArrowRight, Building2 } from 'lucide-react';
import type { JobPosting, ApplicationStatus } from '@/types';

interface Props {
  jobs: JobPosting[];
  onJobUpdated: (job: JobPosting) => void;
  onJobDeleted: (id: string) => void;
}

const STATUS_COLUMNS: {
  key: ApplicationStatus;
  label: string;
  color: string;
  badgeColor: string;
}[] = [
  { key: 'saved', label: '保存', color: 'border-t-gray-400', badgeColor: 'bg-gray-100 text-gray-700' },
  { key: 'applied', label: '応募済み', color: 'border-t-brand-400', badgeColor: 'bg-brand-100 text-brand-700' },
  { key: 'document_screening', label: '書類選考', color: 'border-t-accent-400', badgeColor: 'bg-accent-100 text-accent-700' },
  { key: 'interview', label: '面接', color: 'border-t-warning-400', badgeColor: 'bg-warning-100 text-warning-700' },
  { key: 'offer', label: '内定', color: 'border-t-success-400', badgeColor: 'bg-success-100 text-success-700' },
  { key: 'rejected', label: '不採用', color: 'border-t-error-400', badgeColor: 'bg-error-100 text-error-700' },
];

export default function BoardTab({ jobs, onJobUpdated, onJobDeleted }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (status: ApplicationStatus) => {
    if (!draggedId) return;
    const job = jobs.find((j) => j.id === draggedId);
    if (job && job.status !== status) {
      onJobUpdated({ ...job, status });
    }
    setDraggedId(null);
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    const job = jobs.find((j) => j.id === id);
    if (job) onJobUpdated({ ...job, status });
  };

  const handleDelete = (id: string) => {
    if (confirm('この求人を削除しますか？')) onJobDeleted(id);
  };

  if (jobs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <KanbanSquare className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">応募管理ボード</h2>
            <p className="text-sm text-gray-500">ステータスごとに求人を管理（ドラッグ＆ドロップで移動）</p>
          </div>
        </div>
      </div>

      {/* Desktop: Kanban */}
      <div className="hidden lg:grid grid-cols-6 gap-3">
        {STATUS_COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              className={`rounded-xl border-t-4 ${col.color} bg-gray-50/80 border border-gray-200 p-3 min-h-[200px]`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700">{col.label}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colJobs.length}
                </span>
              </div>
              <div className="space-y-2">
                {colJobs.map((job) => (
                  <KanbanCard
                    key={job.id}
                    job={job}
                    onDragStart={() => handleDragStart(job.id)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {colJobs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">空</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: List grouped by status */}
      <div className="lg:hidden space-y-5">
        {STATUS_COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.key);
          if (colJobs.length === 0) return null;
          return (
            <div key={col.key} className={`rounded-xl border-t-4 ${col.color} border border-gray-200 bg-white overflow-hidden`}>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colJobs.length}件
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {colJobs.map((job) => (
                  <ListCard
                    key={job.id}
                    job={job}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  job,
  onDragStart,
  onDelete,
  onStatusChange,
}: {
  job: JobPosting;
  onDragStart: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{job.title}</p>
        <button
          onClick={() => onDelete(job.id)}
          className="shrink-0 p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 hover:text-error-500 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
        <Building2 className="w-3 h-3" />
        <span className="truncate">{job.company}</span>
      </div>
      {job.analysis && (
        <div className="mt-2">
          <ScoreMini score={job.analysis.matchScore} />
        </div>
      )}
      <div className="mt-2">
        <select
          value={job.status}
          onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
          className="w-full text-xs rounded-md border border-gray-200 px-2 py-1 bg-white text-gray-600 focus:border-brand-400 focus:ring-1 focus:ring-brand-100 outline-none"
        >
          {STATUS_COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ListCard({
  job,
  onDelete,
  onStatusChange,
}: {
  job: JobPosting;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{job.title}</p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(job.id)}
          className="shrink-0 p-1 rounded text-gray-300 hover:text-error-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {job.analysis && (
        <div className="mt-2">
          <ScoreMini score={job.analysis.matchScore} />
        </div>
      )}
      <div className="flex items-center gap-2 mt-3">
        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
        <select
          value={job.status}
          onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
          className="flex-1 text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white text-gray-600 focus:border-brand-400 focus:ring-1 focus:ring-brand-100 outline-none"
        >
          {STATUS_COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ScoreMini({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-success-600 bg-success-50'
    : score >= 45 ? 'text-warning-600 bg-warning-50'
    : 'text-error-600 bg-error-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      適合度 {score}%
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <KanbanSquare className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 max-w-xs">求人が登録されていません。「求人登録＆AI分析」タブで求人を追加してください。</p>
    </div>
  );
}
