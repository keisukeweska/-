import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { InterviewSchedule, JobPosting } from '@/types';
import {
  fetchSchedules,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
  generateGoogleCalendarUrl,
  downloadICal,
} from '@/lib/calendarGmail';

interface Props {
  jobs: JobPosting[];
}

export default function CalendarTab({ jobs }: Props) {
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = async (schedule: Omit<InterviewSchedule, 'id'>) => {
    try {
      await createSchedule(schedule);
      await loadSchedules();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュールの作成に失敗しました');
    }
  };

  const handleStatusChange = async (id: string, status: InterviewSchedule['status']) => {
    try {
      await updateScheduleStatus(id, status);
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この面接日程を削除しますか？')) return;
    try {
      await deleteSchedule(id);
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const upcomingSchedules = schedules
    .filter((s) => s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const monthSchedules = schedules.filter((s) => {
    const d = new Date(s.scheduledAt);
    return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
  });

  const monthName = viewMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">面接カレンダー</h2>
            <p className="text-sm text-gray-500">面接日程を登録し、Googleカレンダーに追加できます</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> 追加
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {showForm && (
            <ScheduleForm jobs={jobs} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          )}

          {/* Upcoming */}
          {upcomingSchedules.length > 0 && (
            <section className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">今後の面接</h3>
              <div className="space-y-3">
                {upcomingSchedules.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Mini Calendar */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">{monthName}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <MiniCalendar viewMonth={viewMonth} schedules={monthSchedules} />
          </section>

          {/* All Schedules List */}
          {schedules.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">すべての面接履歴</h3>
              <div className="space-y-2">
                {schedules
                  .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                  .map((s) => (
                    <ScheduleRow
                      key={s.id}
                      schedule={s}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </section>
          )}

          {schedules.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">面接日程がありません</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
              >
                <Plus className="w-4 h-4" /> 面接日程を追加
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniCalendar({
  viewMonth,
  schedules,
}: {
  viewMonth: Date;
  schedules: InterviewSchedule[];
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = today.toDateString();

  const scheduleDays = new Map<string, InterviewSchedule[]>();
  schedules.forEach((s) => {
    const key = new Date(s.scheduledAt).toDateString();
    const existing = scheduleDays.get(key) || [];
    existing.push(s);
    scheduleDays.set(key, existing);
  });

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) currentWeek.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-error-400' : i === 6 ? 'text-brand-400' : 'text-gray-400'}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) return <div key={di} className="aspect-square" />;
              const date = new Date(year, month, day);
              const dateStr = date.toDateString();
              const isToday = dateStr === todayStr;
              const daySchedules = scheduleDays.get(dateStr) || [];
              const hasSchedule = daySchedules.length > 0;
              return (
                <div
                  key={di}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm transition ${
                    isToday
                      ? 'bg-brand-50 border border-brand-200'
                      : hasSchedule
                      ? 'bg-accent-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-medium ${di === 0 ? 'text-error-400' : di === 6 ? 'text-brand-400' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {hasSchedule && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-500" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {schedules.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
              <span className="text-gray-700 font-medium">
                {new Date(s.scheduledAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-500 truncate">{s.company} - {s.position}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({
  schedule,
  onStatusChange,
  onDelete,
}: {
  schedule: InterviewSchedule;
  onStatusChange: (id: string, status: InterviewSchedule['status']) => void;
  onDelete: (id: string) => void;
}) {
  const startDate = new Date(schedule.scheduledAt);
  const endDate = new Date(startDate.getTime() + schedule.durationMinutes * 60000);
  const dateStr = startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = `${startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}〜${endDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-gray-900">{schedule.company}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{schedule.position}</p>
        </div>
        <button
          onClick={() => onDelete(schedule.id)}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{dateStr} {timeStr}</span>
        </div>
        {schedule.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{schedule.location}</span>
          </div>
        )}
        {schedule.interviewer && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{schedule.interviewer}</span>
          </div>
        )}
        {schedule.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">{schedule.notes}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <select
          value={schedule.status}
          onChange={(e) => onStatusChange(schedule.id, e.target.value as InterviewSchedule['status'])}
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white text-gray-600 focus:border-brand-400 outline-none"
        >
          <option value="scheduled">予定</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
        <a
          href={generateGoogleCalendarUrl(schedule)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 px-2.5 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition"
        >
          <ExternalLink className="w-3 h-3" /> Googleカレンダー
        </a>
        <button
          onClick={() => downloadICal(schedule)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <Download className="w-3 h-3" /> iCal
        </button>
        {schedule.status === 'completed' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> 完了
          </span>
        )}
        {schedule.status === 'cancelled' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-error-600">
            <XCircle className="w-3.5 h-3.5" /> キャンセル
          </span>
        )}
      </div>
    </div>
  );
}

function ScheduleRow({
  schedule,
  onStatusChange,
  onDelete,
}: {
  schedule: InterviewSchedule;
  onStatusChange: (id: string, status: InterviewSchedule['status']) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(schedule.scheduledAt);
  const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const statusColor =
    schedule.status === 'completed' ? 'text-success-600 bg-success-50'
    : schedule.status === 'cancelled' ? 'text-error-600 bg-error-50'
    : 'text-brand-600 bg-brand-50';
  const statusLabel =
    schedule.status === 'completed' ? '完了'
    : schedule.status === 'cancelled' ? 'キャンセル'
    : '予定';

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 text-sm">
      <div className="shrink-0 text-center w-14">
        <p className="text-xs text-gray-400">{dateStr}</p>
        <p className="text-sm font-bold text-gray-700">{timeStr}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate">{schedule.company}</p>
        <p className="text-xs text-gray-400 truncate">{schedule.position}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{statusLabel}</span>
      <button
        onClick={() => onDelete(schedule.id)}
        className="shrink-0 p-1 rounded text-gray-300 hover:text-error-500 transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ScheduleForm({
  jobs,
  onSubmit,
  onCancel,
}: {
  jobs: JobPosting[];
  onSubmit: (schedule: Omit<InterviewSchedule, 'id'>) => void;
  onCancel: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? '');
  const [company, setCompany] = useState(jobs[0]?.company ?? '');
  const [position, setPosition] = useState(jobs[0]?.title ?? '');
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [notes, setNotes] = useState('');

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company);
      setPosition(job.title);
    }
  };

  const handleSubmit = () => {
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    onSubmit({
      jobId: selectedJobId,
      company: company || '企業名未設定',
      position: position || '職種未設定',
      scheduledAt,
      durationMinutes: duration,
      location,
      interviewer,
      notes,
      status: 'scheduled',
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">面接日程を追加</h3>
      <div className="space-y-4">
        {jobs.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">対象求人（任意）</label>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              className={inputClass}
            >
              <option value="">選択しない</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title} - {j.company}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">企業名</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="株式会社〇〇" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">職種</label>
            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="フロントエンドエンジニア" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">開始時刻</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">所要時間（分）</label>
            <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">場所 / URL</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="オフィス / Zoom URL" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">面接官（任意）</label>
            <input type="text" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} placeholder="〇〇部長" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">備考（任意）</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="持参物や服装など..." rows={2} className={inputClass} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> 追加する
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-100 transition"
          >
            キャンセル
          </button>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
