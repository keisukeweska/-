import type { SearchConditions, SearchResultJob, Profile } from '@/types';

interface MockJob {
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
  tags: string[];
  jobTypeKeywords: string[];
  locationKeywords: string[];
  noExperience: boolean;
  remoteOk: boolean;
  lat: number;
  lng: number;
}

const MOCK_JOBS: MockJob[] = [
  {
    id: 'mock-1',
    title: '社内SE（ヘルプデスク担当）',
    company: '南西楽園リゾート株式会社',
    location: '沖縄県宮古島市',
    salary: '300万円〜420万円',
    salaryMin: 300,
    employmentType: '正社員',
    description: '社内PCのトラブルシューティング、ネットワーク保守、社内システムの運用保守を行う社内SE職です。ユーザーサポートが中心で、未経験からIT業界に入門したい方に最適なポジションです。リゾートホテル内のITインフラ全般を担当します。',
    requirements: 'ITの基礎知識（PC操作、ネットワークの基礎）、コミュニケーション能力。未経験歓迎。社内研修あり。新卒・第二新卒歓迎。',
    holidays: '完全週休2日制（土日）、祝日、年末年始、有給',
    url: 'https://example.com/job/nansei-resort-se',
    postedDays: 2,
    tags: ['未経験歓迎', '社内SE', 'ヘルプデスク', '週休2日', '宮古島'],
    jobTypeKeywords: ['社内SE', 'ヘルプデスク', 'IT', 'システム', 'DX'],
    locationKeywords: ['沖縄', '宮古島', '宮古'],
    noExperience: true,
    remoteOk: false,
    lat: 24.8055,
    lng: 125.2828,
  },
  {
    id: 'mock-2',
    title: 'ヘルプデスクエンジニア（リモート可）',
    company: '沖縄ITソリューションズ株式会社',
    location: '沖縄県那覇市（リモート可）',
    salary: '280万円〜380万円',
    salaryMin: 280,
    employmentType: '正社員',
    description: '社内情報システムの保守運用、ヘルプデスク対応、PCセットアップ等を担当。丁寧なOJT体制があり、ITサポート経験が浅い方も歓迎です。週2〜3日のリモートワーク可能。',
    requirements: 'PCの基本操作ができる方。接客・サポート経験者歓迎。IT資格不要。未経験歓迎。新卒OK。',
    holidays: '完全週休2日制（土日）、祝日',
    url: 'https://example.com/job/okinawa-it-helpdesk',
    postedDays: 5,
    tags: ['未経験歓迎', 'ヘルプデスク', 'リモート可', 'OJT充実', '新卒OK'],
    jobTypeKeywords: ['ヘルプデスク', 'IT', 'サポート', 'システム', '社内SE'],
    locationKeywords: ['沖縄', '那覇', 'リモート'],
    noExperience: true,
    remoteOk: true,
    lat: 26.2125,
    lng: 127.6810,
  },
  {
    id: 'mock-3',
    title: '社内SE・DX推進スタッフ（宮古島）',
    company: '宮古島DX株式会社',
    location: '沖縄県宮古島市',
    salary: '250万円〜350万円',
    salaryMin: 250,
    employmentType: '正社員',
    description: '地域企業のDX推進を支援する社内SEポジション。社内システムの運用保守、業務改善ツールの導入、データ分析基盤の構築サポート。宮古島のサテライトオフィス勤務で、移住支援制度あり。',
    requirements: 'PC基本操作スキル、Excel関数知識歓迎。未経験歓迎、入社後3ヶ月の研修あり。Uターン・Iターン歓迎。新卒募集。',
    holidays: '完全週休2日制（土日）、祝日、夏期休暇',
    url: 'https://example.com/job/miyako-dx-se',
    postedDays: 1,
    tags: ['未経験歓迎', '社内SE', 'DX推進', '宮古島', '移住支援', '研修充実', '新卒'],
    jobTypeKeywords: ['社内SE', 'DX', 'IT', 'システム', 'ヘルプデスク'],
    locationKeywords: ['沖縄', '宮古島', '宮古'],
    noExperience: true,
    remoteOk: true,
    lat: 24.7933,
    lng: 125.3006,
  },
  {
    id: 'mock-4',
    title: '社内インフラSE（沖縄・リモートハイブリッド）',
    company: '株式会社オキナワシステムズ',
    location: '沖縄県那覇市（リモート可）',
    salary: '350万円〜500万円',
    salaryMin: 350,
    employmentType: '正社員',
    description: '社内ネットワーク・サーバーインフラの設計・構築・運用。クラウド移行プロジェクトも進行中。経験者向けポジションですが、意欲ある未経験者も研修付きで採用。',
    requirements: 'ネットワーク・サーバーの基礎知識歓迎。未経験の場合は半年間の研修プログラムあり。Linux経験者優遇。',
    holidays: '完全週休2日制（土日）、祝日',
    url: 'https://example.com/job/okinawa-infra',
    postedDays: 7,
    tags: ['インフラSE', 'リモート可', '研修あり', '週休2日'],
    jobTypeKeywords: ['社内SE', 'インフラ', 'サーバー', 'ネットワーク', 'システム'],
    locationKeywords: ['沖縄', '那覇', 'リモート'],
    noExperience: true,
    remoteOk: true,
    lat: 26.2125,
    lng: 127.6810,
  },
  {
    id: 'mock-5',
    title: 'ITサポート担当（未経験歓迎・石垣島）',
    company: '株式会社石垣テックアイランド',
    location: '沖縄県石垣市',
    salary: '260万円〜360万円',
    salaryMin: 260,
    employmentType: '正社員',
    description: '社内PC・ネットワークの運用保守、社内スタッフのITサポート。八重山エリアでのIT人材育成を目的としたポジションで、地域密着型の働き方ができます。',
    requirements: 'PC基本操作ができる方。接客・サービス業からの転職者歓迎。未経験歓迎。新卒OK。',
    holidays: '完全週休2日制（土日）、祝日',
    url: 'https://example.com/job/ishigaki-it-support',
    postedDays: 3,
    tags: ['未経験歓迎', 'ITサポート', '石垣島', '地域密着', '新卒'],
    jobTypeKeywords: ['IT', 'サポート', 'ヘルプデスク', '社内SE'],
    locationKeywords: ['沖縄', '石垣', '八重山'],
    noExperience: true,
    remoteOk: false,
    lat: 24.3413,
    lng: 124.1555,
  },
  {
    id: 'mock-6',
    title: '社内SE・ネットワーク管理（那覇）',
    company: '株式会社サザンシーエンジニアリング',
    location: '沖縄県那覇市',
    salary: '320万円〜450万円',
    salaryMin: 320,
    employmentType: '正社員',
    description: '社内ネットワーク・システムの運用管理、ユーザーサポート、セキュリティ管理を担当。沖縄本島の企業で、安定した環境と働きやすさが自慢です。',
    requirements: 'IT系の基礎知識歓迎。未経験の場合は入社後研修あり。CCNA等の資格保有者優遇（不問）。',
    holidays: '完全週休2日制（土日）、祝日、年末年始',
    url: 'https://example.com/job/southern-se-se',
    postedDays: 4,
    tags: ['社内SE', 'ネットワーク管理', '那覇', '週休2日'],
    jobTypeKeywords: ['社内SE', 'ネットワーク', 'システム', '運用'],
    locationKeywords: ['沖縄', '那覇'],
    noExperience: true,
    remoteOk: false,
    lat: 26.2125,
    lng: 127.6810,
  },
  {
    id: 'mock-7',
    title: 'リモートヘルプデスクエンジニア',
    company: '株式会社リモートテックサポート',
    location: '完全リモート（全国）',
    salary: '300万円〜400万円',
    salaryMin: 300,
    employmentType: '正社員',
    description: '全国のクライアント企業向けリモートITヘルプデスク。電話・リモートツールでの技術サポート、PCトラブル対応。未経験者向け研修が充実。',
    requirements: 'PC基本操作、インターネット環境。未経験歓迎。3ヶ月のオンライン研修あり。',
    holidays: '完全週休2日制（シフト制）',
    url: 'https://example.com/job/remote-helpdesk',
    postedDays: 1,
    tags: ['完全リモート', '未経験歓迎', 'ヘルプデスク', '研修充実'],
    jobTypeKeywords: ['ヘルプデスク', 'IT', 'サポート', 'リモート'],
    locationKeywords: ['リモート', '全国'],
    noExperience: true,
    remoteOk: true,
    lat: 26.0,
    lng: 127.0,
  },
  {
    id: 'mock-8',
    title: '社内SE（製造業）未経験挑戦OK',
    company: '株式会社ウチナーン製作所',
    location: '沖縄県うるま市',
    salary: '290万円〜410万円',
    salaryMin: 290,
    employmentType: '正社員',
    description: '製造業の社内システム運用、生産管理システムの保守、社内ヘルプデスク。製造現場と連携したITサポートが主な業務です。沖縄での安定雇用を提供。',
    requirements: 'PC基本操作ができる方。製造業経験不問。未経験歓迎。現場とのコミュニケーションを大切にできる方。',
    holidays: '完全週休2日制（土日）、祝日',
    url: 'https://example.com/job/uchinan-se',
    postedDays: 6,
    tags: ['未経験歓迎', '社内SE', '製造業', '沖縄', '安定雇用'],
    jobTypeKeywords: ['社内SE', 'ヘルプデスク', 'システム', '運用'],
    locationKeywords: ['沖縄', 'うるま'],
    noExperience: true,
    remoteOk: false,
    lat: 26.2886,
    lng: 127.8669,
  },
  {
    id: 'mock-9',
    title: 'カスタマーサポートエンジニア（沖縄コールセンター）',
    company: '株式会社パイナップルコネクト',
    location: '沖縄県宜野湾市',
    salary: '240万円〜320万円',
    salaryMin: 240,
    employmentType: '正社員',
    description: 'インターネット回線・通信機器のテクニカルサポート。電話での問い合わせ対応、トラブル診断。マニュアルがあるため未経験でも始めやすい職種。',
    requirements: 'PC・スマートフォンの基本操作。接客経験歓迎。未経験歓迎。新卒OK。',
    holidays: 'シフト制（月8日以上休み）',
    url: 'https://example.com/job/pineapple-support',
    postedDays: 3,
    tags: ['未経験歓迎', 'テクニカルサポート', 'コールセンター', '沖縄', '新卒'],
    jobTypeKeywords: ['サポート', 'ヘルプデスク', 'テクニカル', 'カスタマー'],
    locationKeywords: ['沖縄', '宜野湾'],
    noExperience: true,
    remoteOk: false,
    lat: 26.2842,
    lng: 127.7656,
  },
  {
    id: 'mock-10',
    title: 'IT運用保守エンジニア（宮古島・ハイブリッド）',
    company: '株式会社ブルーコーラルIT',
    location: '沖縄県宮古島市（週2日リモート可）',
    salary: '310万円〜430万円',
    salaryMin: 310,
    employmentType: '正社員',
    description: '社内システムの運用保守、DB管理、バックアップ運用、セキュリティ監視。ハイブリッド勤務で宮古島のオフィスとリモートを組み合わせた柔軟な働き方が可能。',
    requirements: 'IT基礎知識歓迎。未経験の場合は3ヶ月研修あり。SQLの基礎知識あれば尚可（不問）。',
    holidays: '完全週休2日制（土日）、祝日、有給',
    url: 'https://example.com/job/blue-coral-ops',
    postedDays: 2,
    tags: ['未経験歓迎', '運用保守', '宮古島', 'ハイブリッド', 'リモート可'],
    jobTypeKeywords: ['社内SE', '運用', '保守', 'システム', 'IT'],
    locationKeywords: ['沖縄', '宮古島', '宮古'],
    noExperience: true,
    remoteOk: true,
    lat: 24.8055,
    lng: 125.2828,
  },
];

// 宮古島市中心の仮想現在地
const DEFAULT_ORIGIN = { lat: 24.8020, lng: 125.2820 };

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateMatchScore(
  job: MockJob,
  conditions: SearchConditions,
  profile: Profile | null
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  if (conditions.jobType.trim()) {
    const userKeywords = conditions.jobType.split(/[、,\s]/).map((s) => s.trim()).filter(Boolean);
    const matched = userKeywords.filter((k) =>
      job.jobTypeKeywords.some((jk) => jk.includes(k) || k.includes(jk))
    );
    if (matched.length > 0) {
      score += Math.min(matched.length * 10, 25);
      reasons.push(`職種「${matched.slice(0, 2).join('・')}」が希望に一致`);
    } else {
      score -= 8;
    }
  }

  if (conditions.location.trim()) {
    const locParts = conditions.location.split(/[、,\s\/・]/).map((s) => s.trim()).filter(Boolean);
    const locMatched = locParts.some(
      (p) => job.locationKeywords.some((lk) => lk.includes(p) || p.includes(lk)) || job.location.includes(p)
    );
    if (locMatched) {
      score += 18;
      reasons.push(`勤務地「${conditions.location}」が一致`);
    } else if (conditions.remoteOk && job.remoteOk) {
      score += 8;
      reasons.push('リモート勤務可能で希望に合致');
    } else {
      score -= 15;
    }
  }

  if (conditions.salaryMin > 0) {
    if (job.salaryMin >= conditions.salaryMin) {
      score += 12;
      reasons.push(`希望年収${conditions.salaryMin}万円以上を満たす`);
    } else if (job.salaryMin >= conditions.salaryMin * 0.85) {
      score += 4;
      reasons.push(`希望年収に近い水準`);
    } else {
      score -= 12;
    }
  }

  if (conditions.noExperience) {
    if (job.noExperience) {
      score += 15;
      reasons.push('未経験歓迎の求人です');
    } else {
      score -= 8;
    }
  }

  if (conditions.remoteOk && job.remoteOk) {
    score += 8;
    reasons.push('リモートワーク可');
  }

  if (conditions.keywords.trim()) {
    const kws = conditions.keywords.split(/[、,\s]/).map((s) => s.trim()).filter(Boolean);
    const fullText = `${job.title} ${job.description} ${job.requirements} ${job.tags.join(' ')}`;
    const matchedKws = kws.filter((k) => fullText.includes(k));
    if (matchedKws.length > 0) {
      score += Math.min(matchedKws.length * 6, 15);
      reasons.push(`キーワード「${matchedKws.slice(0, 2).join('・')}」が含まれる`);
    }
  }

  if (profile) {
    if (profile.skills) {
      const skills = profile.skills.split(/[、,\n,]/).map((s) => s.trim()).filter(Boolean);
      const fullText = `${job.title} ${job.description} ${job.requirements}`;
      const matchedSkills = skills.filter((s) => fullText.includes(s));
      if (matchedSkills.length > 0) {
        score += Math.min(matchedSkills.length * 4, 10);
        reasons.push(`あなたのスキルが活かせる`);
      }
    }
    if (profile.ngConditions) {
      const ngs = profile.ngConditions.split(/[、,\n]/).map((s) => s.trim()).filter(Boolean);
      const fullText = `${job.title} ${job.description} ${job.requirements} ${job.holidays}`;
      const triggered = ngs.filter((ng) => fullText.includes(ng));
      if (triggered.length > 0) score -= triggered.length * 8;
    }
  }

  if (job.holidays.match(/完全週休2日|土日休み/)) score += 3;
  if (job.postedDays <= 2) { score += 3; reasons.push('新着求人'); }

  score = Math.max(10, Math.min(98, score));
  if (reasons.length === 0) reasons.push('条件との概ねマッチする求人です');

  return { score, reasons };
}

export function searchJobs(
  conditions: SearchConditions,
  profile: Profile | null
): SearchResultJob[] {
  const results: SearchResultJob[] = MOCK_JOBS.map((job) => {
    const { score, reasons } = calculateMatchScore(job, conditions, profile);
    const distance = haversineKm(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng, job.lat, job.lng);
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      salaryMin: job.salaryMin,
      employmentType: job.employmentType,
      description: job.description,
      requirements: job.requirements,
      holidays: job.holidays,
      url: job.url,
      postedDays: job.postedDays,
      matchScore: score,
      matchReasons: reasons,
      tags: job.tags,
      lat: job.lat,
      lng: job.lng,
      distanceKm: distance,
    };
  });
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

export function searchResultToContent(job: SearchResultJob): string {
  return [
    `求人タイトル：${job.title}`,
    `企業名：${job.company}`,
    `勤務地：${job.location}`,
    `給与：${job.salary}`,
    `雇用形態：${job.employmentType}`,
    `休日：${job.holidays}`,
    '',
    '【仕事内容】',
    job.description,
    '',
    '【応募要件】',
    job.requirements,
    '',
    '【タグ】',
    job.tags.join('、'),
  ].join('\n');
}

export const MAP_BOUNDS = {
  minLat: 23.0,
  maxLat: 27.5,
  minLng: 123.0,
  maxLng: 129.0,
};

export function latLngToMapPercent(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}
