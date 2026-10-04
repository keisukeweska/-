import type { Profile, JobPosting, SearchConditions } from '@/types';

const PROFILE_KEY = 'ai-job-agent:profile';
const JOBS_KEY = 'ai-job-agent:jobs';
const SEARCH_KEY = 'ai-job-agent:search-conditions';

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadJobs(): JobPosting[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JobPosting[];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: JobPosting[]): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadSearchConditions(): SearchConditions | null {
  try {
    const raw = localStorage.getItem(SEARCH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SearchConditions;
  } catch {
    return null;
  }
}

export function saveSearchConditions(conditions: SearchConditions): void {
  localStorage.setItem(SEARCH_KEY, JSON.stringify(conditions));
}
