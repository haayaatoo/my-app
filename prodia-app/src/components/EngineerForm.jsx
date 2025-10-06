

import React, { useState } from "react";

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

export default function EngineerForm({ onSubmit, onCancel, initialData }) {
  const [form, setForm] = useState(
    initialData || {
      name: "",
      position: "",
      project_name: "",
      planner: "",
      skills: [],
      engineer_status: "",
      phase: [],
    }
  );
  const [error, setError] = useState("");


  const handleChange = (e) => {
    const { name, value, type, options } = e.target;
    if (type === "select-multiple") {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm({ ...form, [name]: values });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.position) {
      setError("名前と役職は必須です");
      return;
    }
    setError("");
    // skills/phaseは配列で送る
    onSubmit({
      ...form,
      skills: form.skills,
      phase: form.phase,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <form className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto" onSubmit={handleSubmit}>
        <h2 className={`text-2xl font-extrabold mb-6 tracking-wide flex items-center gap-2 ${initialData ? 'text-green-700' : 'text-blue-700'}`}>
          <i className={`fas ${initialData ? 'fa-edit' : 'fa-user-plus'}`}></i>
          {initialData ? 'エンジニア編集' : 'エンジニア新規登録'}
        </h2>
        {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}
        {/* 名前 */}
        <div className="relative mb-5">
          <input name="name" value={form.name} onChange={handleChange} required className="peer w-full border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent py-2 px-1 text-lg" />
          <label className="absolute left-1 top-2 text-gray-400 text-base transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-5 peer-valid:text-xs pointer-events-none">名前*</label>
        </div>
        {/* 役職 */}
        <div className="relative mb-5">
          <input name="position" value={form.position} onChange={handleChange} required className="peer w-full border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent py-2 px-1 text-lg" />
          <label className="absolute left-1 top-2 text-gray-400 text-base transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-5 peer-valid:text-xs pointer-events-none">役職*</label>
        </div>
        {/* プロジェクト名 */}
        <div className="relative mb-5">
          <input name="project_name" value={form.project_name} onChange={handleChange} className="peer w-full border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent py-2 px-1 text-lg" />
          <label className="absolute left-1 top-2 text-gray-400 text-base transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-5 peer-valid:text-xs pointer-events-none">プロジェクト名</label>
        </div>
        {/* 担当プランナー */}
        <div className="relative mb-5">
          <input name="planner" value={form.planner} onChange={handleChange} className="peer w-full border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent py-2 px-1 text-lg" />
          <label className="absolute left-1 top-2 text-gray-400 text-base transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-5 peer-valid:text-xs pointer-events-none">担当プランナー</label>
        </div>
        {/* スキル選択 タグ風UI（ジャンルごと） */}
        <div className="mb-5">
          <label className="block mb-1 text-gray-600 font-semibold">スキル（複数選択可）</label>
          <div className="flex flex-col gap-2 mb-2">
            {SKILL_OPTIONS.map((group) => (
              <div key={group.genre}>
                <div className="text-xs text-gray-400 mb-1 ml-1">{group.genre}</div>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`px-3 py-1 rounded-full border text-sm font-semibold transition-all ${form.skills.includes(s) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}
                      onClick={() => {
                        setForm(f => f.skills.includes(s) ? { ...f, skills: f.skills.filter(x => x !== s) } : { ...f, skills: [...f.skills, s] });
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* アサイン状況（2択・アニメーション） */}
        <div className="mb-5">
          <label className="block mb-1 text-gray-600 font-semibold">アサイン状況</label>
          <div className="flex gap-3">
            {[
              { value: "アサイン済", label: "アサイン済", anim: "animate-pulse bg-green-500/80" },
              { value: "未アサイン", label: "未アサイン", anim: "animate-shake bg-red-400/80" },
            ].map(opt => (
              <button
                type="button"
                key={opt.value}
                className={`px-4 py-2 rounded-full text-white font-bold shadow transition-all ${form.engineer_status === opt.value ? opt.anim : 'bg-gray-200 text-gray-500'} border-2 border-transparent focus:outline-none`}
                onClick={() => setForm(f => ({ ...f, engineer_status: opt.value }))}
              >{opt.label}</button>
            ))}
          </div>
        </div>
        {/* 経験フェーズ タグ風UI */}
        <div className="mb-5">
          <label className="block mb-1 text-gray-600 font-semibold">経験フェーズ（複数選択可）</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PHASE_OPTIONS.map((p) => (
              <button
                type="button"
                key={p}
                className={`px-3 py-1 rounded-full border text-sm font-semibold transition-all ${form.phase.includes(p) ? 'bg-blue-500 text-white border-blue-500 shadow' : 'bg-white text-blue-500 border-blue-300 hover:bg-blue-50'}`}
                onClick={() => {
                  setForm(f => f.phase.includes(p) ? { ...f, phase: f.phase.filter(x => x !== p) } : { ...f, phase: [...f.phase, p] });
                }}
              >{p}</button>
            ))}
          </div>
        </div>
        {/* ボタン */}
        <div className="flex gap-4 mt-8 justify-end">
          <button type="button" className="bg-gray-200 text-gray-600 px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-300" onClick={onCancel}>キャンセル</button>
          <button 
            type="submit" 
            className={`px-8 py-2 rounded-lg font-bold shadow-lg transition-all text-lg flex items-center gap-2 ${
              initialData 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <i className={`fas ${initialData ? 'fa-save' : 'fa-plus'}`}></i>
            {initialData ? "更新" : "登録"}
          </button>
        </div>
      </form>
    </div>
  );
}
