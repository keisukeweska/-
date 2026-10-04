export type ApplicantCategory = 'new_grad' | 'graduate' | 'professional';
export type Gender = 'male' | 'female' | 'other' | '';

export interface Profile {
  name: string;
  email: string;
  phone: string;
  education: string;
  career: string;
  skills: string;
  desiredSalary: number;
  desiredLocation: string;
  ngConditions: string;
  category: ApplicantCategory;
  schoolType: string;
  schoolName: string;
  birthday: string;
  gender: Gender;
  straight: boolean;
  enrollmentYear: number;
  graduationYear: number;
}

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'document_screening'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface ConditionComparisonItem {
  label: string;
  profileValue: string;
  jobValue: string;
  match: boolean;
}

export interface JobAnalysis {
  matchScore: number;
  matchReasons: string[];
  concerns: string[];
  conditionComparison: ConditionComparisonItem[];
}

export interface CompanyInfo {
  overview: string;
  industry: string;
  size: string;
  founded: string;
  rating: number;
  reviews: CompanyReview[];
  reviewSummary: string;
  foundInfo: boolean;
}

export interface CompanyReview {
  author: string;
  rating: number;
  text: string;
  pros: string;
  cons: string;
}

export interface GeneratedDocument {
  motivation: string;
  selfPr: string;
  resume: string;
}

export interface InterviewQuestion {
  question: string;
  answerDraft: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  url: string;
  content: string;
  salary: string;
  location: string;
  holidays: string;
  createdAt: number;
  analysis?: JobAnalysis;
  companyInfo?: CompanyInfo;
  status: ApplicationStatus;
  documents?: GeneratedDocument;
  interviewQuestions?: InterviewQuestion[];
}

export interface InterviewSchedule {
  id: string;
  jobId: string;
  company: string;
  position: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  interviewer: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export type EmailType =
  | 'document_screening'
  | 'interview_invite'
  | 'offer'
  | 'rejection'
  | 'other';

export interface SelectionEmail {
  id: string;
  gmailMessageId: string;
  jobId: string | null;
  company: string;
  subject: string;
  snippet: string;
  emailType: EmailType;
  receivedAt: string;
  processed: boolean;
}

export interface GmailIntegration {
  id: string;
  email: string;
  watchExpiration: string | null;
  historyId: string;
  lastSyncedAt: string | null;
  isActive: boolean;
}

export interface SearchConditions {
  keywords: string;
  jobType: string;
  location: string;
  salaryMin: number;
  employmentType: string;
  noExperience: boolean;
  remoteOk: boolean;
}

export interface SearchResultJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  employmentType: string;
  description: string;
  requirements: string;
  holidays: string;
  url: string;
  postedDays: number;
  matchScore: number;
  matchReasons: string[];
  tags: string[];
  lat: number;
  lng: number;
  distanceKm: number;
}

export type TabKey =
  | 'profile'
  | 'search'
  | 'board'
  | 'calendar'
  | 'gmail';
