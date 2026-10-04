import type {
  Profile,
  JobAnalysis,
  ConditionComparisonItem,
  CompanyInfo,
  CompanyReview,
  GeneratedDocument,
  InterviewQuestion,
} from '@/types';

function parseSalary(text: string): number | null {
  const patterns = [
    /(\d{3,4})\s*万円/g,
    /(\d{3,4})\s*万/g,
    /年収\s*(\d{3,4})\s*万/g,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function checkLocationMatch(desired: string, jobLocation: string): boolean {
  if (!desired || !jobLocation) return true;
  const d = desired.replace(/[\s、,]/g, '');
  const j = jobLocation.replace(/[\s、,]/g, '');
  const desiredParts = d.split(/[\/・]/).filter(Boolean);
  if (desiredParts.length === 0) return true;
  return desiredParts.some((part) => j.includes(part) || part.includes(j.slice(0, 2)));
}

function checkNgConditions(ng: string, jobText: string): string[] {
  if (!ng) return [];
  const conditions = ng.split(/[、,\n]/).map((s) => s.trim()).filter(Boolean);
  return conditions.filter((c) => jobText.includes(c));
}

function extractSkills(profile: Profile): string[] {
  if (!profile.skills) return [];
  return profile.skills.split(/[、,\n]/).map((s) => s.trim()).filter(Boolean);
}

export function analyzeJob(
  profile: Profile,
  jobContent: string,
  jobTitle: string,
  jobSalary: string,
  jobLocation: string,
  jobHolidays: string
): JobAnalysis {
  const fullText = `${jobTitle} ${jobContent} ${jobSalary} ${jobLocation} ${jobHolidays}`;
  let score = 50;
  const reasons: string[] = [];
  const concerns: string[] = [];

  // Skill matching
  const skills = extractSkills(profile);
  if (skills.length > 0) {
    const matched = skills.filter((s) => fullText.includes(s));
    if (matched.length > 0) {
      score += Math.min(matched.length * 8, 25);
      reasons.push(`あなたのスキル（${matched.slice(0, 3).join('、')}）が求人の要件と一致しています`);
    } else {
      score -= 5;
      concerns.push('明示的なスキルの一致が見られません');
    }
  }

  // Salary matching
  const profileSalary = profile.desiredSalary || 0;
  const jobSalaryNum = parseSalary(jobSalary) || parseSalary(fullText);
  if (profileSalary > 0 && jobSalaryNum && jobSalaryNum > 0) {
    if (jobSalaryNum >= profileSalary) {
      score += 15;
      reasons.push(`希望年収${profileSalary}万円に対し、求人年収${jobSalaryNum}万円で条件を満たしています`);
    } else if (jobSalaryNum >= profileSalary * 0.9) {
      score += 5;
      concerns.push(`希望年収よりやや低めですが、近い水準です（希望${profileSalary}万円 / 求人${jobSalaryNum}万円）`);
    } else {
      score -= 15;
      concerns.push(`希望年収と大きく乖離があります（希望${profileSalary}万円 / 求人${jobSalaryNum}万円）`);
    }
  }

  // Location matching
  const locationMatch = checkLocationMatch(profile.desiredLocation, jobLocation || fullText);
  if (locationMatch && profile.desiredLocation) {
    score += 12;
    reasons.push(`希望勤務地（${profile.desiredLocation}）と一致しています`);
  } else if (!locationMatch && profile.desiredLocation) {
    score -= 10;
    concerns.push('希望勤務地と異なる可能性があります');
  }

  // NG conditions
  const ngTriggered = checkNgConditions(profile.ngConditions, fullText);
  if (ngTriggered.length > 0) {
    score -= ngTriggered.length * 10;
    concerns.push(`NG条件に該当するキーワードが含まれています：${ngTriggered.join('、')}`);
  } else if (profile.ngConditions) {
    score += 5;
    reasons.push('NG条件に該当する要素は見当たりません');
  }

  // Career match
  if (profile.career) {
    const careerKeywords = profile.career.split(/[、,\n\s]/).filter((s) => s.length >= 3).slice(0, 10);
    const careerMatched = careerKeywords.filter((k) => fullText.includes(k));
    if (careerMatched.length > 0) {
      score += Math.min(careerMatched.length * 5, 15);
      reasons.push('これまでの職務経験が活かせる求人内容です');
    }
  }

  // Holiday check
  if (fullText.match(/完全週休2日|土日休み|週休2日/)) {
    score += 5;
    reasons.push('土日休みの条件が確認できます');
  }

  score = Math.max(10, Math.min(98, score));

  if (reasons.length === 0) reasons.push('プロフィールの一部情報と照合しました');
  if (concerns.length === 0) concerns.push('現時点で大きな懸念点は見つかりませんでした');

  const conditionComparison: ConditionComparisonItem[] = [
    {
      label: '年収',
      profileValue: profileSalary > 0 ? `${profileSalary}万円` : '未設定',
      jobValue: jobSalaryNum ? `${jobSalaryNum}万円` : jobSalary || '不明',
      match: profileSalary === 0 || !jobSalaryNum ? true : jobSalaryNum >= profileSalary * 0.9,
    },
    {
      label: '勤務地',
      profileValue: profile.desiredLocation || '未設定',
      jobValue: jobLocation || '不明',
      match: locationMatch,
    },
    {
      label: '休日',
      profileValue: '土日休み希望',
      jobValue: jobHolidays || '不明',
      match: !!fullText.match(/完全週休2日|土日休み|週休2日/),
    },
  ];

  return { matchScore: score, matchReasons: reasons, concerns, conditionComparison };
}

// ─── Company Info & Reviews ──────────────────────────────────────────────────

const REVIEW_TEMPLATES = [
  {
    pros: '社員同士の雰囲気が良く、風通しの良い職場環境です。部署間の連携もスムーズで、意見が言いやすい文化があります。',
    cons: '繁忙期は残業が多くなる傾向があります。また、意思決定のスピードがやや遅い場面もあります。',
  },
  {
    pros: '若手でも裁量を持たせてもらえる環境で、成長意欲のある人には最適です。研修制度も充実しています。',
    cons: '評価基準が必ずしも明確ではなく、上司との相性で評価が左右されることがあるようです。',
  },
  {
    pros: 'Work-life balanceを尊重する風潮があり、フレックスタイム制やリモートワークの活用も可能です。',
    cons: '給与水準は業界平均並みで、他社と比べて際立って高いわけではありません。',
  },
];

const AUTHOR_NAMES = ['転職希望者A', '現職社員B', '元社員C', '応募者D'];

export function generateCompanyInfo(
  companyName: string,
  jobContent: string,
  url: string
): CompanyInfo {
  // Detect if we have enough info to generate mock company data
  const hasCompanyName = companyName && companyName.length > 0 && companyName !== '企業名不明';

  if (!hasCompanyName) {
    return {
      overview: '',
      industry: '',
      size: '',
      founded: '',
      rating: 0,
      reviews: [],
      reviewSummary: '',
      foundInfo: false,
    };
  }

  // Try to extract industry clues from content
  let industry = '不明';
  if (jobContent.match(/IT|ソフトウェア|エンジニア|プログラマー|システム/)) industry = 'IT・ソフトウェア';
  else if (jobContent.match(/金融|銀行|保険|証券/)) industry = '金融';
  else if (jobContent.match(/不動産/)) industry = '不動産';
  else if (jobContent.match(/製造|メーカー|工場/)) industry = '製造';
  else if (jobContent.match(/営業|販売|小売|商社/)) industry = '商社・流通';
  else if (jobContent.match(/医療|病院|介護/)) industry = '医療・福祉';
  else if (jobContent.match(/建設|土木|建築/)) industry = '建設';

  // Generate mock company size
  const sizes = ['50名未満', '50〜100名', '100〜300名', '300〜1000名', '1000名以上'];
  const sizeIndex = Math.min(
    Math.floor((jobContent.length % 100) / 20),
    sizes.length - 1
  );
  const size = sizes[sizeIndex];

  // Generate mock founding year
  const foundedYear = 1980 + (jobContent.length % 35);
  const founded = `${foundedYear}年`;

  // Generate rating (3.0 ~ 4.5 range)
  const rating = Math.round((3.0 + (jobContent.length % 16) / 10) * 10) / 10;

  // Generate 2-3 mock reviews
  const reviewCount = 2 + (jobContent.length % 2);
  const reviews: CompanyReview[] = [];
  for (let i = 0; i < reviewCount; i++) {
    const template = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];
    reviews.push({
      author: AUTHOR_NAMES[i % AUTHOR_NAMES.length],
      rating: Math.round((3.5 + (i % 2) * 0.5) * 10) / 10,
      text: `${companyName}で働いていた経験に基づく感想です。${template.pros}一方で、${template.cons}`,
      pros: template.pros,
      cons: template.cons,
    });
  }

  const reviewSummary = `${companyName}は${industry}業界に属する企業で、規模は${size}程度です。口コミ評価は${rating}（5点満点）で、社員からは「${reviews[0].pros.slice(0, 30)}...」といったポジティブな意見が寄せられています。一方で「${reviews[0].cons.slice(0, 30)}...」という改善要望も見受けられます。総じて、成長意欲のある方には良い環境と言えます。`;

  const overview = `${companyName}は、${industry}分野で事業を展開する企業です。${founded}に創業し、現在は${size}の規模で運営されています。求人情報の解析に基づく推定情報であり、実際の企業データとは異なる場合がありますので、公式サイト等で最新情報をご確認ください。`;

  return {
    overview,
    industry,
    size,
    founded,
    rating,
    reviews,
    reviewSummary,
    foundInfo: true,
  };
}

// ─── Document Generation ─────────────────────────────────────────────────────

export function generateMotivation(
  profile: Profile,
  job: { title: string; company: string; content: string }
): string {
  const skills = extractSkills(profile).slice(0, 3).join('、') || 'これまで培った専門知識';
  const career = profile.career ? profile.career.split('\n')[0].slice(0, 40) : '前職での経験';

  return `私は${career}を通じて、${skills}に関する実務経験を積んでまいりました。

貴社の「${job.title}」の募集を拝見し、${job.company}様が目指す事業方向性に強く共感いたしました。私のこれまでの経験が、貴社の課題解決に直接貢献できると確信しております。

特に、求人内容に記載されている業務内容は、私が最も専門性を発揮できる領域であり、入社後即戦力として貢献できると考えております。また、貴社の成長意欲あふれる環境であればこそ、自身のスキルをさらに磨き、長期的に貢献していきたいと強く願っております。

この機会に、私の経験と熱意を貴社にお伝えできれば幸いです。何卒よろしくお願い申し上げます。`;
}

export function generateSelfPr(
  profile: Profile,
  job: { title: string; content: string }
): string {
  const skills = extractSkills(profile).slice(0, 3).join('、') || '専門スキル';
  const career = profile.career ? profile.career.split('\n').slice(0, 2).join('。') : '実務経験';

  return `【自己PR】

私の強みは、${skills}を活かした課題解決力です。

${career}

この経験から、変化する環境においても柔軟に対応し、成果を出し続ける力を身につけました。${job.title}の業務においても、この強みを活かし、チームの目標達成に貢献したいと考えております。

入社後は、早期に業務に習熟し、周囲との協働を大切にしながら、貴社の成長を支える存在となれるよう全力で取り組む所存です。`;
}

export function generateResume(profile: Profile): string {
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const genderText = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : profile.gender === 'other' ? 'その他' : '';
  const birthdayText = profile.birthday || '';

  const categoryText =
    profile.category === 'new_grad' ? '新卒' :
    profile.category === 'graduate' ? '既卒' :
    profile.category === 'professional' ? '社会人' : '';

  let resume = `【履歴書】\n\n`;
  resume += `氏名：${profile.name || '（氏名未入力）'}\n`;
  resume += `生年月日：${birthdayText}\n`;
  resume += `性別：${genderText}\n`;
  resume += `区分：${categoryText}\n`;
  resume += `住所：\n`;
  resume += `電話番号：${profile.phone || '（未入力）'}\n`;
  resume += `メールアドレス：${profile.email || '（未入力）'}\n\n`;

  if (profile.schoolName && profile.enrollmentYear) {
    resume += `━━━ 学歴 ━━━\n`;
    resume += `${profile.enrollmentYear}年4月 ${profile.schoolName} ${profile.schoolType} 入学\n`;
    resume += `${profile.graduationYear}年3月 ${profile.schoolName} ${profile.schoolType} 卒業\n\n`;
  } else if (profile.education) {
    resume += `━━━ 学歴 ━━━\n`;
    profile.education.split('\n').forEach((line) => {
      if (line.trim()) resume += `${line.trim()}\n`;
    });
    resume += '\n';
  } else {
    resume += `━━━ 学歴 ━━━\n（学歴を入力してください）\n\n`;
  }

  resume += `━━━ 職歴 ━━━\n`;
  if (profile.career) {
    profile.career.split('\n').forEach((line) => {
      if (line.trim()) resume += `${line.trim()}\n`;
    });
  } else {
    resume += '（職歴を入力してください）\n';
  }
  resume += `\n━━━ 資格・スキル ━━━\n`;
  resume += profile.skills || '（スキル・資格を入力してください）';
  resume += `\n\n記載日：${today}\n`;

  return resume;
}

export function generateAllDocuments(
  profile: Profile,
  job: { title: string; company: string; content: string }
): GeneratedDocument {
  return {
    motivation: generateMotivation(profile, job),
    selfPr: generateSelfPr(profile, job),
    resume: generateResume(profile),
  };
}

// ─── Interview Questions ─────────────────────────────────────────────────────

const INTERVIEW_TEMPLATES = [
  'この職位に応募した理由を教えてください。',
  '前職での最も大きな成果は何ですか？',
  'あなたの強みと弱みを教えてください。',
  'チームで意見が対立した際、どのように解決しますか？',
  '5年後のキャリアビジョンを教えてください。',
  '残業やハードな業務に対してどう考えていますか？',
  '自己PRをお願いします。',
  '当社に入社したら、まず何に取り組みますか？',
];

export function generateInterviewQuestions(
  profile: Profile,
  job: { title: string; company: string; content: string }
): InterviewQuestion[] {
  const skills = extractSkills(profile).slice(0, 3).join('、') || 'これまでの経験';
  const career = profile.career?.split('\n')[0]?.slice(0, 50) || '前職での実務経験';

  const answers: Record<string, string> = {
    'この職位に応募した理由を教えてください。': `${job.company}様の${job.title}の募集内容を拝見し、私の${skills}の経験が活かせると感じたためです。また、貴社の事業に強く共感しており、長期的に貢献したいと考えております。`,
    '前職での最も大きな成果は何ですか？': `${career}において、目標達成に向けて主体的に取り組み、数値目標を超える成果を出した経験がございます。具体的には、チームと連携して業務効率を改善し、生産性を大幅に向上させました。`,
    'あなたの強みと弱みを教えてください。': '強みは、課題に対して論理的にアプローチし、粘り強く解決する点です。弱みは、集中しすぎるあまり周囲の状況を見落とすことがある点で、意識的にコミュニケーションを取るよう心がけています。',
    'チームで意見が対立した際、どのように解決しますか？': 'まず双方の意見を丁寧に聞いた上で、共通の目標に立ち返り、データや事実をもとに建設的に議論を進めるよう努めます。感情ではなく論理で合意形成を図ります。',
    '5年後のキャリアビジョンを教えてください。': '入社後はまず実務を通じて専門性を高め、5年後にはチームを牽引する存在として、後輩育成や新規プロジェクトの推進に貢献したいと考えております。',
    '残業やハードな業務に対してどう考えていますか？': '業務の達成が最優先ですので、必要な時は当然対応いたします。ただし、日々の業務効率を改善し、計画的に業務を進めることで、無駄な残業を減らす努力も大切だと考えています。',
    '自己PRをお願いします。': `私の強みは${skills}を活かした課題解決力です。${career}を通じて培った実践力で、貴社の${job.title}として早期に成果を出せると確信しております。`,
    '当社に入社したら、まず何に取り組みますか？': 'まずは業務内容を早期に習熟し、周囲のメンバーとの関係構築に努めます。同時に、改善できそうな点があれば、状況を見ながら積極的に提案していきたいです。',
  };

  return INTERVIEW_TEMPLATES.map((q) => ({
    question: q,
    answerDraft: answers[q] || '',
  }));
}

// ─── Content Extraction from Fetched HTML ────────────────────────────────────

export function extractJobInfo(content: string, url: string): {
  title: string;
  company: string;
  salary: string;
  location: string;
  holidays: string;
} {
  // Try to extract title
  let title = '';
  const titlePatterns = [
    /【求人】\s*(.+?)(?:\s|【|　)/,
    /募集職種[：:]\s*(.+?)(?:\n|　|\s)/,
    /職種[：:]\s*(.+?)(?:\n|　|\s)/,
    /<h1[^>]*>(.+?)<\/h1>/i,
  ];
  for (const p of titlePatterns) {
    const m = content.match(p);
    if (m && m[1] && m[1].length > 2 && m[1].length < 60) {
      title = m[1].trim();
      break;
    }
  }
  if (!title) {
    const firstLine = content.trim().split('\n')[0];
    if (firstLine && firstLine.length < 80) title = firstLine.trim();
  }

  // Extract company
  let company = '';
  const companyPatterns = [
    /株式会社[^\s、,。（）()【】\n]+/,
    /㈱[^\s、,。（）()【】\n]+/,
    /企業名[：:]\s*(.+?)(?:\n|　|\s)/,
    /会社名[：:]\s*(.+?)(?:\n|　|\s)/,
  ];
  for (const p of companyPatterns) {
    const m = content.match(p);
    if (m) {
      company = m[0].replace(/企業名[：:]\s*|会社名[：:]\s*/, '').trim();
      break;
    }
  }

  // Extract salary
  let salary = '';
  const salaryPatterns = [
    /年収[：:]\s*(.+?)(?:\n|　)/,
    /給与[：:]\s*(.+?)(?:\n|　)/,
    /給与詳細[：:]\s*(.+?)(?:\n|　)/,
    /(\d{3,4}\s*万円.*?)(?:\n|　|\s)/,
  ];
  for (const p of salaryPatterns) {
    const m = content.match(p);
    if (m) {
      salary = (m[1] || m[0]).trim();
      break;
    }
  }

  // Extract location
  let location = '';
  const locationPatterns = [
    /勤務地[：:]\s*(.+?)(?:\n|　)/,
    /所在地[：:]\s*(.+?)(?:\n|　)/,
    /(東京都|大阪府|神奈川県|愛知県|京都府|福岡県)[^\s、,。（）()\n]*/,
  ];
  for (const p of locationPatterns) {
    const m = content.match(p);
    if (m) {
      location = (m[1] || m[0]).trim();
      break;
    }
  }

  // Extract holidays
  let holidays = '';
  const holidayPatterns = [
    /休日[：:]\s*(.+?)(?:\n|　)/,
    /休暇[：:]\s*(.+?)(?:\n|　)/,
    /(完全週休2日[^\s、,。（）()\n]*)/,
    /(土日休み[^\s、,。（）()\n]*)/,
  ];
  for (const p of holidayPatterns) {
    const m = content.match(p);
    if (m) {
      holidays = (m[1] || m[0]).trim();
      break;
    }
  }

  return { title, company, salary, location, holidays };
}

// ─── Full One-Click Analysis Pipeline ────────────────────────────────────────

export interface OneClickResult {
  title: string;
  company: string;
  salary: string;
  location: string;
  holidays: string;
  content: string;
  analysis: JobAnalysis;
  companyInfo: CompanyInfo;
  documents: GeneratedDocument;
  interviewQuestions: InterviewQuestion[];
}

export function runFullAnalysis(
  profile: Profile,
  fetchedContent: string,
  url: string
): OneClickResult {
  const info = extractJobInfo(fetchedContent, url);
  const title = info.title || '求人タイトル不明';
  const company = info.company || '企業名不明';
  const content = fetchedContent;

  const analysis = analyzeJob(
    profile,
    content,
    title,
    info.salary,
    info.location,
    info.holidays
  );

  const companyInfo = generateCompanyInfo(company, content, url);

  const documents = generateAllDocuments(profile, {
    title,
    company,
    content,
  });

  const interviewQuestions = generateInterviewQuestions(profile, {
    title,
    company,
    content,
  });

  return {
    title,
    company,
    salary: info.salary,
    location: info.location,
    holidays: info.holidays,
    content,
    analysis,
    companyInfo,
    documents,
    interviewQuestions,
  };
}
