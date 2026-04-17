

import React, { useState } from "react";

// 性別選択肢
const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
];

// 担当プランナー選択肢
const PLANNER_OPTIONS = [
  "温水",
  "瀬戸山",
  "上前",
  "岡田",
  "野田",
  "服部",
  "山口"
];

const SKILL_OPTIONS = [
  { genre: "フロントエンド", skills: [
    "React", "TypeScript", "JavaScript", "Vue.js", "Next.js", "Nuxt.js", "HTML", "CSS", "Sass", "Tailwind CSS", "jQuery"
  ] },
  { genre: "バックエンド", skills: [
    "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot", "C#", ".NET", "PHP", "Laravel", "Ruby", "Ruby on Rails", "Node.js", "Express"
  ] },
  { genre: "クラウド/インフラ", skills: [
    "AWS", "GCP", "Azure", "Heroku", "Firebase", "Vercel", "Netlify", "Docker", "Kubernetes", "Linux", "Nginx", "Apache"
  ] },
  { genre: "データベース", skills: [
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Oracle", "DynamoDB"
  ] },
  { genre: "その他", skills: [
    "Figma", "Photoshop", "Illustrator", "Notion", "Slack", "Git", "REST API", "GraphQL"
  ] },
];
const PHASE_OPTIONS = [
  "要件定義", "基本設計", "詳細設計", "製造", "テスト", "運用・保守"
];

const formatRate = (v) => {
  const raw = String(v ?? "").replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ').replace(/,/g, "").replace(/[^0-9]/g, "");
  return raw ? Number(raw).toLocaleString() : "";
};

export default function EngineerForm({ onSubmit, onCancel, initialData }) {
  const [form, setForm] = useState(
    initialData
      ? { ...initialData, monthly_rate: formatRate(initialData.monthly_rate) }
      : {
          name: "",
          gender: "",
          rate_type: "monthly",
          project_name: "",
          planner: "",
          skills: [],
          engineer_status: "",
          phase: [],
          client_company: "",
          monthly_rate: "",
          project_start_date: "",
          project_end_date: "",
          project_location: "",
        }
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSkillError, setCustomSkillError] = useState("");

  // 定義済みスキル一覧（重複チェック用）
  const allDefinedSkills = SKILL_OPTIONS.flatMap(g => g.skills);

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (form.skills.includes(trimmed)) {
      setCustomSkillError("そのスキルはすでに追加されています");
      return;
    }
    setCustomSkillError("");
    setForm(f => ({ ...f, skills: [...f.skills, trimmed] }));
    setCustomSkillInput("");
  };

  const handleCustomSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };


  const handleChange = (e) => {
    // エラーメッセージをクリア
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
    
    const { name, value, type, options } = e.target;
    if (type === "select-multiple") {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm({ ...form, [name]: values });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRateChange = (e) => {
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
    setForm({ ...form, monthly_rate: formatRate(e.target.value) });
  };

  const handleSubmit = async (e, continueAfter = false) => {
    e.preventDefault();
    if (!form.name) {
      setError("名前は必須です");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    
    try {
      // 一意のメールアドレスを生成
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      const uniqueEmail = `engineer.${timestamp}.${randomNum}@prodia.temp`;
      
      await onSubmit({
        ...form,
        email: uniqueEmail,
        skills: form.skills,
        phase: form.phase,
        rate_type: form.rate_type || 'monthly',
        monthly_rate: form.monthly_rate ? form.monthly_rate.replace(/,/g, "") : "",
        project_start_date: form.project_start_date || null,
        project_end_date: form.project_end_date || null,
      }, continueAfter);
      
      // 成功メッセージを表示
      setSuccessMessage(continueAfter ? "登録完了！続けて登録できます" : "登録完了！");
      
      // 連続登録の場合はフォームをリセット
      if (continueAfter) {
        setForm({
          name: "",
          gender: "",
          rate_type: "monthly",
          project_name: "",
          planner: "",
          skills: [],
          engineer_status: "",
          phase: [],
          client_company: "",
          monthly_rate: "",
          project_start_date: "",
          project_end_date: "",
          project_location: "",
        });
        
        // 成功メッセージを3秒後に消去
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form className="bg-gradient-to-br from-white via-slate-50 to-stone-50 rounded-3xl shadow-2xl p-8 w-full max-w-2xl animate-fade-in max-h-[95vh] overflow-y-auto border border-white/60" onClick={e => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 70px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
            onSubmit={handleSubmit}>
        {/* ヘッダー */}
        <div className="relative mb-8 pb-6 border-b border-gradient-to-r from-amber-200 via-stone-200 to-amber-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 rounded-full"></div>
          
          <h2 className={`text-3xl font-bold mb-2 tracking-wide flex items-center gap-3 ${initialData ? 'text-emerald-700' : 'text-blue-700'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${initialData ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} text-white shadow-lg`}>
              <i className={`fas ${initialData ? 'fa-edit' : 'fa-user-plus'} text-xl`}></i>
            </div>
            {initialData ? 'エンジニア編集' : 'エンジニア新規登録'}
          </h2>
          <p className="text-slate-600 ml-15">
            {initialData ? 'エンジニア情報を更新します' : '新しいエンジニアを登録します'}
          </p>
        </div>
        {error && (
          <div className="text-red-700 mb-6 font-semibold bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-2xl border border-red-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <span>{error}</span>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="text-emerald-700 mb-6 font-semibold bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-200 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-emerald-600"></i>
              </div>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        {/* 基本情報セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-user text-blue-500"></i>
            基本情報
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 名前 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                名前 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white/80 text-lg font-medium placeholder-slate-400"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                  }}
                  placeholder="田中太郎"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-user text-slate-300"></i>
                </div>
              </div>
            </div>
            {/* 性別 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                性別
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white/80 text-lg font-medium appearance-none cursor-pointer pr-12"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                >
                  <option value="">選択してください</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className="fas fa-venus-mars text-slate-400"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* アサイン状況セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-briefcase text-blue-500"></i>
            アサイン状況
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "アサイン済", label: "アサイン済", color: "emerald", icon: "fa-check-circle" },
              { value: "未アサイン", label: "未アサイン", color: "orange", icon: "fa-clock" },
            ].map(opt => (
              <button
                type="button"
                key={opt.value}
                className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  form.engineer_status === opt.value 
                    ? `bg-gradient-to-r from-${opt.color}-500 to-${opt.color}-600 text-white border-${opt.color}-500 shadow-lg` 
                    : `bg-white text-${opt.color}-600 border-${opt.color}-200 hover:border-${opt.color}-300 hover:bg-${opt.color}-50`
                }`}
                onClick={() => setForm(f => ({
                  ...f,
                  engineer_status: opt.value,
                  ...(opt.value === '未アサイン' ? {
                    project_name: '', planner: '', client_company: '',
                    monthly_rate: '', project_start_date: '', project_end_date: '', project_location: ''
                  } : {})
                }))}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className={`fas ${opt.icon}`}></i>
                  <span className="font-medium whitespace-nowrap">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* プロジェクト情報セクション（アサイン済のみ表示） */}
        {form.engineer_status === 'アサイン済' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-project-diagram text-emerald-500"></i>
            プロジェクト情報
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* プロジェクト名 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                プロジェクト内容
              </label>
              <div className="relative">
                <input 
                  name="project_name" 
                  value={form.project_name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium placeholder-slate-400"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                  placeholder="ECサイト開発"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-briefcase text-slate-300"></i>
                </div>
              </div>
            </div>
            
            {/* 担当プランナー */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                担当プランナー
              </label>
              <div className="relative">
                <select 
                  name="planner" 
                  value={form.planner} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium appearance-none cursor-pointer pr-12"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                >
                  <option value="">選択してください</option>
                  {PLANNER_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <i className="fas fa-chevron-down text-slate-400"></i>
                </div>
              </div>
            </div>

            {/* クライアント先企業名 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                クライアント先企業名
              </label>
              <div className="relative">
                <input
                  name="client_company"
                  value={form.client_company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium placeholder-slate-400"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                  placeholder="株式会社○○"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-building text-slate-300"></i>
                </div>
              </div>
            </div>

            {/* 単価 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {form.rate_type === 'monthly' ? '月単価' : '時給単価'}
              </label>
              <div className="flex items-center gap-2">
                {/* スライドトグル */}
                <div className="relative flex bg-slate-100 rounded-full p-1 w-36 shrink-0 cursor-pointer select-none"
                  onClick={() => setForm(f => ({ ...f, rate_type: f.rate_type === 'monthly' ? 'hourly' : 'monthly', monthly_rate: '' }))}
                >
                  {/* スライドピル */}
                  <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow transition-all duration-300 ${form.rate_type === 'monthly' ? 'left-1' : 'left-[calc(50%+3px)]'}`}></div>
                  <span className={`relative z-10 flex-1 text-center text-xs font-semibold py-1 transition-colors duration-300 ${form.rate_type === 'monthly' ? 'text-emerald-600' : 'text-slate-400'}`}>月単価</span>
                  <span className={`relative z-10 flex-1 text-center text-xs font-semibold py-1 transition-colors duration-300 ${form.rate_type === 'hourly' ? 'text-emerald-600' : 'text-slate-400'}`}>時給単価</span>
                </div>
                <span className="text-slate-500 font-medium text-lg shrink-0">¥</span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="monthly_rate"
                  value={form.monthly_rate}
                  onChange={handleRateChange}
                  className="flex-1 min-w-0 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium placeholder-slate-400"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                  placeholder={form.rate_type === 'monthly' ? '650,000' : '3,000'}
                />
                {form.rate_type === 'hourly' && (
                  <span className="text-slate-500 font-medium text-base whitespace-nowrap shrink-0">/h</span>
                )}
              </div>
            </div>

            {/* 参画開始日（プロジェクト内容入力時のみ表示） */}
            {form.project_name && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  参画開始日
                </label>
                <input
                  type="date"
                  name="project_start_date"
                  value={form.project_start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                />
              </div>
            )}

            {/* 契約終了予定日（プロジェクト内容入力時のみ表示） */}
            {form.project_name && (
              <div className="relative">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                  契約終了予定日
                  <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-normal">アラート対象</span>
                </label>
                <input
                  type="date"
                  name="project_end_date"
                  value={form.project_end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-white/80 text-lg font-medium"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">設定すると稼働率ダッシュボードのアラートに表示されます</p>
              </div>
            )}

            {/* プロジェクト所在地 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                プロジェクト所在地
              </label>
              <div className="relative">
                <input
                  name="project_location"
                  value={form.project_location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white/80 text-lg font-medium placeholder-slate-400"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                  placeholder="例: 名古屋市中区 / フルリモート"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-map-marker-alt text-slate-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        {/* スキル選択セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-code text-purple-500"></i>
            技術スキル
            <span className="text-sm font-normal text-slate-500">（複数選択可）</span>
          </h3>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100">
            <div className="space-y-6">
              {SKILL_OPTIONS.map((group) => (
                <div key={group.genre}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                      {group.genre}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((s) => (
                      <button
                        type="button"
                        key={s}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          form.skills.includes(s) 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg border-0' 
                            : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm'
                        }`}
                        onClick={() => {
                          setForm(f => f.skills.includes(s) ? { ...f, skills: f.skills.filter(x => x !== s) } : { ...f, skills: [...f.skills, s] });
                        }}
                      >
                        {form.skills.includes(s) && <i className="fas fa-check mr-1"></i>}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* カスタムスキル手入力 */}
            <div className="mt-4 p-4 bg-white/80 rounded-xl border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">
                <i className="fas fa-plus-circle mr-1"></i>
                リストにないスキルを追加
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={e => { setCustomSkillInput(e.target.value); setCustomSkillError(""); }}
                  onKeyDown={handleCustomSkillKeyDown}
                  className="flex-1 px-3 py-2 border-2 border-purple-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white placeholder-slate-400"
                  placeholder="例: Kotlin, Terraform, Figma..."
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkillInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm"
                >
                  追加
                </button>
              </div>
              {customSkillError && (
                <p className="text-xs text-red-500 mt-1">{customSkillError}</p>
              )}
              {/* 手入力で追加されたカスタムスキルの表示 */}
              {form.skills.filter(s => !allDefinedSkills.includes(s)).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1">追加済みのカスタムスキル:</p>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.filter(s => !allDefinedSkills.includes(s)).map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-sm"
                      >
                        <i className="fas fa-star text-yellow-300 text-xs"></i>
                        {s}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))}
                          className="ml-1 text-white/70 hover:text-white transition-colors"
                          aria-label={`${s}を削除`}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 選択されたスキル数の表示 */}
            <div className="mt-3 p-3 bg-white/70 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600 font-medium">
                  選択中のスキル: {form.skills.length}個
                </span>
                {form.skills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, skills: [] }))}
                    className="text-xs text-purple-500 hover:text-purple-700 underline"
                  >
                    すべてクリア
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ステータス情報セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-amber-500"></i>
            ステータス情報
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* 経験フェーズ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">経験フェーズ（複数選択可）</label>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                <div className="grid grid-cols-2 gap-2">
                  {PHASE_OPTIONS.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        form.phase.includes(p) 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' 
                          : 'bg-white text-amber-700 border border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                      onClick={() => {
                        setForm(f => f.phase.includes(p) ? { ...f, phase: f.phase.filter(x => x !== p) } : { ...f, phase: [...f.phase, p] });
                      }}
                    >
                      {form.phase.includes(p) && <i className="fas fa-check mr-1"></i>}
                      {p}
                    </button>
                  ))}
                </div>
                
                {/* 選択されたフェーズ数の表示 */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-amber-600 font-medium">
                    選択中: {form.phase.length}個
                  </span>
                  {form.phase.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, phase: [] }))}
                      className="text-xs text-amber-500 hover:text-amber-700 underline"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* アクションボタン */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            {/* キャンセルボタン */}
            <button 
              type="button" 
              className="px-6 py-3 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-600 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-slate-200 hover:to-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-no-wrap btn-fixed-size btn-responsive" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i>
              キャンセル
            </button>
            
            {/* 新規登録時のみ連続登録ボタンを表示 */}
            {!initialData && (
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 btn-no-wrap btn-fixed-size btn-responsive"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    登録中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle"></i>
                    登録して続ける
                  </>
                )}
              </button>
            )}
            
            {/* メイン送信ボタン */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 btn-no-wrap btn-fixed-size btn-responsive ${
                initialData 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {initialData ? "更新中..." : "登録中..."}
                </>
              ) : (
                <>
                  <i className={`fas ${initialData ? 'fa-save' : 'fa-check'}`}></i>
                  {initialData ? "更新して完了" : "登録して完了"}
                </>
              )}
            </button>
          </div>
          
          {/* フォームのヒント */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              <i className="fas fa-info-circle mr-1"></i>
              必須項目（<span className="text-red-500">*</span>）は入力必須です
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
