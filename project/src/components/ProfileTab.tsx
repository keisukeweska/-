import { useState, useMemo } from 'react';
import { User, Save, CheckCircle2, GraduationCap, Briefcase, Banknote, MapPin, Ban, Cake, Calendar, FileDown, Eye } from 'lucide-react';
import type { Profile, ApplicantCategory, Gender } from '@/types';
import { saveProfile } from '@/lib/storage';
import { generateResume } from '@/lib/aiAnalysis';

interface Props {
  profile: Profile | null;
  onSaved: (profile: Profile) => void;
}

const emptyProfile: Profile = {
  name: '',
  email: '',
  phone: '',
  education: '',
  career: '',
  skills: '',
  desiredSalary: 0,
  desiredLocation: '',
  ngConditions: '',
  category: 'new_grad',
  schoolType: '',
  schoolName: '',
  birthday: '',
  gender: '',
  straight: true,
  enrollmentYear: 0,
  graduationYear: 0,
};

const SCHOOL_TYPES = ['大学', '短期大学', '専門学校', '高等学校', '大学院'];

const UNIVERSITIES = [
  '東京大学', '京都大学', '大阪大学', '東北大学', '名古屋大学', '九州大学', '北海道大学', '筑波大学',
  '東京工業大学', '一橋大学', '神戸大学', '広島大学', '岡山大学', '千葉大学', '横浜国立大学',
  '首都大学東京', '埼玉大学', '金沢大学', '新潟大学', '静岡大学', '熊本大学', '鹿児島大学',
  '琉球大学', '沖縄国際大学', '名桜大学', '沖縄県立芸術大学',
  '早稲田大学', '慶應義塾大学', '上智大学', '明治大学', '青山学院大学', '立教大学', '中央大学', '法政大学',
  '同志社大学', '立命館大学', '関西学院大学', '関西大学',
  '東京理科大学', '芝浦工業大学', '日本大学', '東洋大学', '駒澤大学', '専修大学',
  '近畿大学', '甲南大学', '龍谷大学', '京都産業大学',
];

const VOCATIONAL_SCHOOLS = [
  'HAL専門学校', '日本工学院専門学校', '東京デザイン専門学校', '東京IT会計専門学校',
  '大阪情報コンピュータ学院', 'HAL東京', 'HAL大阪', 'HAL名古屋',
  '沖縄コンピュータ専門学校', '大原簿記専門学校', '代々木アニメーション学院',
];

const HIGH_SCHOOLS = [
  '県立首里高等学校', '県立那覇高等学校', '県立沖縄工業高等学校', '県立宮古高等学校',
  '県立八重山高等学校', '私立開邦高等学校', '私立沖縄カトリック高等学校',
];

function getSchoolSuggestions(schoolType: string): string[] {
  if (schoolType === '大学' || schoolType === '大学院') return UNIVERSITIES;
  if (schoolType === '専門学校') return VOCATIONAL_SCHOOLS;
  if (schoolType === '高等学校') return HIGH_SCHOOLS;
  if (schoolType === '短期大学') return UNIVERSITIES.filter((u) => u.includes('短期') || true).slice(0, 15);
  return [...UNIVERSITIES, ...VOCATIONAL_SCHOOLS];
}

function calcEnrollmentYear(birthday: string, schoolType: string): number {
  if (!birthday) return 0;
  const birthYear = new Date(birthday).getFullYear();
  if (schoolType === '大学' || schoolType === '短期大学') return birthYear + 18;
  if (schoolType === '専門学校') return birthYear + 18;
  if (schoolType === '高等学校') return birthYear + 15;
  if (schoolType === '大学院') return birthYear + 22;
  return birthYear + 18;
}

function calcGraduationYear(enrollmentYear: number, schoolType: string): number {
  if (schoolType === '大学') return enrollmentYear + 4;
  if (schoolType === '短期大学') return enrollmentYear + 2;
  if (schoolType === '専門学校') return enrollmentYear + 2;
  if (schoolType === '高等学校') return enrollmentYear + 3;
  if (schoolType === '大学院') return enrollmentYear + 2;
  return enrollmentYear + 4;
}

export default function ProfileTab({ profile, onSaved }: Props) {
  const [form, setForm] = useState<Profile>(profile ?? emptyProfile);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const schoolSuggestions = useMemo(
    () => getSchoolSuggestions(form.schoolType),
    [form.schoolType]
  );

  const handleChange = (field: keyof Profile, value: string | number | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate enrollment/graduation if straight + birthday + schoolType
      if ((field === 'birthday' || field === 'schoolType' || field === 'straight') && next.straight && next.birthday && next.schoolType) {
        const enroll = calcEnrollmentYear(next.birthday, next.schoolType);
        next.enrollmentYear = enroll;
        next.graduationYear = calcGraduationYear(enroll, next.schoolType);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    saveProfile(form);
    onSaved(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDownloadResume = () => {
    const text = generateResume(form);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '履歴書.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewResume = generateResume(form);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">プロフィール登録</h2>
            <p className="text-sm text-gray-500">あなたの経歴と希望条件を入力してください</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" /> 基本情報
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="氏名">
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="山田 太郎" className={inputClass} />
            </Field>
            <Field label="メールアドレス">
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="yamada@example.com" className={inputClass} />
            </Field>
            <Field label="電話番号">
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="090-1234-5678" className={inputClass} />
            </Field>
            <Field label="生年月日">
              <div className="relative">
                <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" value={form.birthday} onChange={(e) => handleChange('birthday', e.target.value)} className={`${inputClass} pl-9`} />
              </div>
            </Field>
            <Field label="性別">
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value as Gender)} className={inputClass}>
                <option value="">選択しない</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </Field>
            <Field label="区分">
              <select value={form.category} onChange={(e) => handleChange('category', e.target.value as ApplicantCategory)} className={inputClass}>
                <option value="new_grad">新卒</option>
                <option value="graduate">既卒</option>
                <option value="professional">社会人</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Education */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-500" /> 学歴
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="学校種別">
              <select value={form.schoolType} onChange={(e) => handleChange('schoolType', e.target.value)} className={inputClass}>
                <option value="">選択してください</option>
                {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="学校名（サジェスト）">
              <input
                type="text"
                list="school-suggestions"
                value={form.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="学校名を入力・選択"
                className={inputClass}
              />
              <datalist id="school-suggestions">
                {schoolSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </Field>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.straight}
                onChange={(e) => handleChange('straight', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="text-sm text-gray-700">ストレート（浪人・留年なし）</span>
            </label>
          </div>

          {form.straight && form.birthday && form.schoolType && (
            <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-xs font-medium text-brand-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 自動計算された入学・卒業年月
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">入学</p>
                  <p className="text-lg font-bold text-brand-700">{form.enrollmentYear}年4月</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">卒業</p>
                  <p className="text-lg font-bold text-brand-700">{form.graduationYear}年3月</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Field label="学歴（手動入力・任意）">
              <textarea
                value={form.education}
                onChange={(e) => handleChange('education', e.target.value)}
                placeholder="自動計算されない場合や追加学歴がある場合は入力してください"
                rows={2}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* Career & Skills */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-500" /> 職歴・スキル
          </h3>
          <div className="space-y-4">
            <Field label="職歴">
              <textarea
                value={form.career}
                onChange={(e) => handleChange('career', e.target.value)}
                placeholder="2016年4月〜現在 〇〇株式会社 喀業部&#10;主な担当：法人向けSaaSの新規開拓喀業"
                rows={4}
                className={inputClass}
              />
            </Field>
            <Field label="スキル・資格（カンマ区切り）">
              <input
                type="text"
                value={form.skills}
                onChange={(e) => handleChange('skills', e.target.value)}
                placeholder="Excel, SQL, プロジェクト管理, TOEIC 800"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* Desired Conditions */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-500" /> 希望条件
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="希望年収（万円）">
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={form.desiredSalary || ''} onChange={(e) => handleChange('desiredSalary', parseInt(e.target.value, 10) || 0)} placeholder="500" className={`${inputClass} pl-9`} />
              </div>
            </Field>
            <Field label="希望勤務地">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.desiredLocation} onChange={(e) => handleChange('desiredLocation', e.target.value)} placeholder="沖縄 / 宮古島 / リモート" className={`${inputClass} pl-9`} />
              </div>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="NG条件（カンマまたは改行区切り）">
              <div className="relative">
                <Ban className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea value={form.ngConditions} onChange={(e) => handleChange('ngConditions', e.target.value)} placeholder="転勤あり, 深夜勤務, 土日出勤" rows={3} className={`${inputClass} pl-9`} />
              </div>
            </Field>
          </div>
        </section>

        {/* Resume Preview & Download */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-brand-500" /> 履歴書プレビュー・ダウンロード
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowPreview((s) => !s)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-600 rounded-xl border border-brand-200 hover:bg-brand-50 transition"
            >
              <Eye className="w-4 h-4" /> {showPreview ? 'プレビューを閉じる' : 'プレビュー'}
            </button>
            <button
              onClick={handleDownloadResume}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition shadow-sm"
            >
              <FileDown className="w-4 h-4" /> ダウンロード
            </button>
          </div>
          {showPreview && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{previewResume}</pre>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> プロフィールを保存
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-600">
              <CheckCircle2 className="w-4 h-4" /> 保存しました
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
