import { useState, useEffect, useCallback } from 'react';
import { User, Search, Zap, KanbanSquare, Calendar, Mail, Bot } from 'lucide-react';
import type { Profile, JobPosting, TabKey } from '@/types';
import { loadProfile, saveProfile, loadJobs, saveJobs } from '@/lib/storage';
import ProfileTab from '@/components/ProfileTab';
import SearchTab from '@/components/SearchTab';
import OneClickFlowTab from '@/components/OneClickFlowTab';
import BoardTab from '@/components/BoardTab';
import CalendarTab from '@/components/CalendarTab';
import GmailTab from '@/components/GmailTab';

const TABS: { key: TabKey; label: string; icon: typeof User; shortLabel: string }[] = [
  { key: 'profile', label: 'プロフィール', icon: User, shortLabel: '登録' },
  { key: 'search', label: '求人検索（AIスカウト）', icon: Search, shortLabel: '検索' },
  { key: 'one-click', label: '一括生成', icon: Zap, shortLabel: '一括' },
  { key: 'board', label: '応募管理', icon: KanbanSquare, shortLabel: '管理' },
  { key: 'calendar', label: '面接カレンダー', icon: Calendar, shortLabel: 'カレンダー' },
  { key: 'gmail', label: 'Gmail連携', icon: Mail, shortLabel: 'Gmail' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [prefillContent, setPrefillContent] = useState<string | undefined>(undefined);
  const [prefillUrl, setPrefillUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setProfile(loadProfile());
    setJobs(loadJobs());
  }, []);

  const handleProfileSaved = (p: Profile) => {
    setProfile(p);
    saveProfile(p);
  };

  const handleJobAdded = (job: JobPosting) => {
    setJobs((prev) => {
      const updated = [job, ...prev];
      saveJobs(updated);
      return updated;
    });
  };

  const handleJobUpdated = useCallback((updated: JobPosting) => {
    setJobs((prev) => {
      const next = prev.map((j) => (j.id === updated.id ? updated : j));
      saveJobs(next);
      return next;
    });
  }, []);

  const handleJobDeleted = (id: string) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== id);
      saveJobs(next);
      return next;
    });
  };

  const handleLinkEmailToJob = (jobId: string) => {
    // If the job is still in "saved" status, bump it to "applied" or "document_screening"
    const job = jobs.find((j) => j.id === jobId);
    if (job && job.status === 'saved') {
      handleJobUpdated({ ...job, status: 'applied' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">AI転職エージェント</h1>
                <p className="text-[10px] text-gray-400 leading-tight hidden sm:block">全自動一気通貫フロー</p>
              </div>
            </div>
            {profile?.name && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center">
                  {profile.name.slice(0, 1)}
                </div>
                <span className="hidden sm:inline">{profile.name}さん</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation - Desktop */}
      <nav className="hidden sm:block sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 pb-20 sm:pb-6">
        {activeTab === 'profile' && <ProfileTab profile={profile} onSaved={handleProfileSaved} />}
        {activeTab === 'search' && (
          <SearchTab
            profile={profile}
            onSelectJob={(content, url) => {
              setPrefillContent(content);
              setPrefillUrl(url);
              setActiveTab('one-click');
            }}
          />
        )}
        {activeTab === 'one-click' && (
          <OneClickFlowTab
            profile={profile}
            onJobAdded={handleJobAdded}
            onNavigateCalendar={() => setActiveTab('calendar')}
            prefillContent={prefillContent}
            prefillUrl={prefillUrl}
          />
        )}
        {activeTab === 'board' && (
          <BoardTab
            jobs={jobs}
            onJobUpdated={handleJobUpdated}
            onJobDeleted={handleJobDeleted}
          />
        )}
        {activeTab === 'calendar' && <CalendarTab jobs={jobs} />}
        {activeTab === 'gmail' && (
          <GmailTab jobs={jobs} onLinkEmailToJob={handleLinkEmailToJob} />
        )}
      </main>

      {/* Bottom Tab Bar - Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
