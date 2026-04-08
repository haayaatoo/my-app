import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../contexts/UserContext";

const API_BASE = "http://localhost:8000/api";

const RESULT_CONFIG = {
  apo_taken: { label: "アポ取れた", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  absent:    { label: "不在",        color: "bg-slate-100 text-slate-500 border-slate-200",    dot: "bg-slate-400"  },
  rejected:  { label: "お断り",      color: "bg-red-100 text-red-600 border-red-200",           dot: "bg-red-400"    },
  callback:  { label: "折り返し待ち", color: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400"  },
  other:     { label: "その他",      color: "bg-blue-100 text-blue-600 border-blue-200",        dot: "bg-blue-400"   },
};

const PLANNERS = ["温水", "瀬戸山", "上前", "岡田", "野田", "服部", "山口"];

const PLANNER_COLORS = [
  "ring-blue-500 bg-blue-50",
  "ring-rose-500 bg-rose-50",
  "ring-emerald-500 bg-emerald-50",
  "ring-purple-500 bg-purple-50",
  "ring-orange-500 bg-orange-50",
  "ring-cyan-500 bg-cyan-50",
  "ring-lime-500 bg-lime-50",
];

const getPlannerColor = (name) => PLANNER_COLORS[PLANNERS.indexOf(name) % PLANNER_COLORS.length] || PLANNER_COLORS[0];

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_ROW = { company_name: "", phone_number: "", call_date: today(), result: "absent", notes: "" };

// 会社名の正規化（法人格、空白、記号を除去して比較しやすく）
const normalizeCompany = (s) =>
  s
    .replace(/株式会社|有限会社|合同会社|合資会社|合名会社|（株）|（有）|ホールディングス|コーポレーション|グループ/g, '')
    .replace(/(\(|（)(\u682a|\u6709)(\)|）)/g, '')
    .replace(/[\s　・\-ー]/g, '')
    .toLowerCase();

// ─── インラインエラートースト ─────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl text-white font-medium flex items-center gap-3 shadow-xl ${
      type === "success" ? "bg-emerald-500" : "bg-red-500"
    }`}>
      <i className={`fas ${type === "success" ? "fa-check" : "fa-exclamation"}`}></i>
      {msg}
    </div>
  );
}

// ─── 結果バッジ ───────────────────────────────────────────────
function ResultBadge({ result }) {
  const cfg = RESULT_CONFIG[result] || RESULT_CONFIG.other;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── 架電実行モーダル ─────────────────────────────────────────
function CallModal({ company, currentPlanner, onSave, onClose }) {
  const [form, setForm] = useState({
    company_name: company.name,
    phone_number: '',
    planner: currentPlanner,
    call_date: new Date().toISOString().split('T')[0],
    result: 'absent',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/teleapo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onSave(saved);
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
        {/* ヘッダー */}
        <div className="relative px-7 pt-7 pb-5 bg-indigo-50 border-b border-indigo-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <i className="fas fa-phone" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">架電記録</p>
              <p className="font-bold text-slate-800 text-lg leading-tight">{company.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-slate-500 transition-colors">
            <i className="fas fa-times" />
          </button>
        </div>

        {/* 過去の架電履歴サマリー */}
        {company.call_count > 0 && (
          <div className="mx-7 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <i className="fas fa-exclamation-triangle text-amber-500 text-sm mt-0.5" />
            <div className="text-xs text-amber-700">
              <span className="font-bold">過去{company.call_count}件の架電記録あり</span>
              {company.last_planner && (
                <span className="ml-2">最終：{company.last_planner}（{company.last_call_date}）</span>
              )}
            </div>
          </div>
        )}

        {/* フォーム */}
        <div className="px-7 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">架電日 <span className="text-red-400">*</span></label>
              <input type="date" className={inp} value={form.call_date}
                onChange={e => set('call_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">電話番号</label>
              <input type="text" className={inp} placeholder="000-0000-0000" value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">結果 <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(RESULT_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => set('result', k)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                    form.result === k
                      ? `${v.color} border-current shadow-sm scale-105`
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${v.dot} inline-block mr-1`} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">備考</label>
            <textarea className={`${inp} resize-none`} rows={3} placeholder="気になったこと、次回への引き継ぎなど"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* ボタン */}
        <div className="px-7 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium transition-colors text-sm">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-2">
            {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-phone" />}
            架電記録を保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 打合せ済みリストタブ ─────────────────────────────────────────
function CallListTab({ currentPlanner, onRecordSaved }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all / uncalled / called
  const [callingCompany, setCallingCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/companies/teleapo-status/?${params}`);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchCompanies(); setCurrentPage(1); }, [fetchCompanies]);

  const handleSaved = (saved) => {
    setCallingCompany(null);
    fetchCompanies();
    onRecordSaved(saved);
  };

  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = companies.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const RESULT_LABEL_MAP = Object.fromEntries(
    Object.entries(RESULT_CONFIG).map(([k, v]) => [k, v])
  );

  return (
    <div className="space-y-4">
      {callingCompany && (
        <CallModal
          company={callingCompany}
          currentPlanner={currentPlanner}
          onSave={handleSaved}
          onClose={() => setCallingCompany(null)}
        />
      )}

      {/* フィルターバー */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input type="text" placeholder="企業名で検索" value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'all', label: '全て', icon: 'fa-list' },
            { key: 'uncalled', label: '未架電', icon: 'fa-phone-slash' },
            { key: 'called', label: '架電済み', icon: 'fa-phone-volume' },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <i className={`fas ${icon} text-xs`} /> {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{companies.length}社</span>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <i className="fas fa-spinner fa-spin text-2xl text-indigo-400" />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fas fa-building text-3xl mb-3 block" />
            <p className="text-sm">{search || statusFilter !== 'all' ? '条件に一致する企業がありません' : '企業が登録されていません'}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">企業名</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">架電状況</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">最終架電</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">架電者</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(company => {
                  const cfg = company.last_result ? RESULT_LABEL_MAP[company.last_result] : null;
                  const isCalled = company.call_count > 0;
                  return (
                    <tr key={company.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCalled ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          <span className="font-medium text-slate-700">{company.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {isCalled ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 font-medium">
                              {company.call_count}回架電
                            </span>
                            {cfg && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${cfg.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block mr-1`} />
                                {cfg.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">未架電</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-sm">
                        {company.last_call_date
                          ? new Date(company.last_call_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {company.callers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {company.callers.slice(0, 3).map(c => (
                              <span key={c} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5">{c}</span>
                            ))}
                            {company.callers.length > 3 && (
                              <span className="text-xs text-slate-400">+{company.callers.length - 3}</span>
                            )}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setCallingCompany(company)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm">
                          <i className="fas fa-phone text-xs" /> 架電する
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, companies.length)}社 / 全{companies.length}社
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                    <i className="fas fa-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                    .map((item, idx) => item === '...' ? (
                      <span key={`d${idx}`} className="w-7 text-center text-slate-400 text-xs">⋯</span>
                    ) : (
                      <button key={item} onClick={() => setCurrentPage(item)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${safePage === item ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                        {item}
                      </button>
                    ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 企業名検索 → 履歴パネル ─────────────────────────────────
function CompanyHistoryPanel({ currentPlanner }) {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setRecords([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teleapo/company_history/?company=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* 検索ヘッダー */}
      <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">企業履歴検索</p>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            placeholder="企業名を入力すると架電履歴が表示されます..."
            value={query}
            onChange={handleChange}
          />
          {loading && <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400"></i>}
        </div>
      </div>

      {/* 結果 */}
      {query && (
        <div className="divide-y divide-slate-50">
          {records.length === 0 && !loading ? (
            <p className="text-center text-slate-400 py-8 text-sm">「{query}」の架電履歴はありません</p>
          ) : (
            records.map((r) => {
              const isMe = r.planner === currentPlanner;
              return (
                <div key={r.id} className={`flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors ${isMe ? "bg-indigo-50/60" : ""}`}>
                  {isMe && <span className="w-1.5 h-6 rounded-full bg-indigo-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{r.company_name}</p>
                    {r.phone_number && <p className="text-xs text-slate-400">{r.phone_number}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isMe ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    {r.planner}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{r.call_date}</span>
                  <ResultBadge result={r.result} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── インライン入力行（Excel風）────────────────────────────────
function NewRow({ planner, allRecords, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_ROW, planner });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // リアルタイム重複通知
  const normalizedInput = normalizeCompany(form.company_name);
  const duplicates = normalizedInput.length >= 2
    ? allRecords.filter((r) => {
        const n = normalizeCompany(r.company_name);
        return n.length > 0 && (n.includes(normalizedInput) || normalizedInput.includes(n));
      })
    : [];
  const hasDuplicate = duplicates.length > 0;

  const handleSave = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/teleapo/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onSave(saved);
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full text-sm border border-indigo-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";

  return (
    <tr className="bg-indigo-50/70 align-top">
      <td className="px-3 py-2">
        <input className={`${inp}${ hasDuplicate ? ' border-rose-400 focus:ring-rose-300' : ''}`} placeholder="会社名 *" value={form.company_name}
          onChange={(e) => set("company_name", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()} autoFocus />
        {hasDuplicate && (
          <div className="mt-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-2 space-y-1.5">
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <i className="fas fa-ban" /> 架電済みの会社が見つかりました
            </p>
            {duplicates.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-1.5 text-xs text-rose-500">
                <span className="font-semibold truncate max-w-[8rem]">{r.company_name}</span>
                <span className="text-rose-400 whitespace-nowrap">{r.planner} / {r.call_date}</span>
                <ResultBadge result={r.result} />
              </div>
            ))}
            {duplicates.length > 3 && (
              <p className="text-xs text-rose-400">他{duplicates.length - 3}件…</p>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        <input className={inp} placeholder="電話番号" value={form.phone_number}
          onChange={(e) => set("phone_number", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()} />
      </td>
      <td className="px-3 py-2">
        <input type="date" className={inp} value={form.call_date}
          onChange={(e) => set("call_date", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <select className={inp} value={form.result} onChange={(e) => set("result", e.target.value)}>
          {Object.entries(RESULT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input className={inp} placeholder="備考" value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving || !form.company_name.trim() || hasDuplicate}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
            title={hasDuplicate ? '架電済みの会社があるため追加できません' : ''}>
            {saving ? <i className="fas fa-spinner fa-spin text-xs"/> : <i className="fas fa-check text-xs"/>}
          </button>
          <button onClick={onCancel}
            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors">
            <i className="fas fa-times text-xs"/>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── 編集行 ───────────────────────────────────────────────────
function EditRow({ record, onSave, onCancel }) {
  const [form, setForm] = useState({ ...record });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/teleapo/${record.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onSave(saved);
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white";

  return (
    <tr className="bg-amber-50/70">
      <td className="px-3 py-2">
        <input className={inp} value={form.company_name}
          onChange={(e) => set("company_name", e.target.value)} autoFocus />
      </td>
      <td className="px-3 py-2">
        <input className={inp} value={form.phone_number || ""}
          onChange={(e) => set("phone_number", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input type="date" className={inp} value={form.call_date}
          onChange={(e) => set("call_date", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <select className={inp} value={form.result} onChange={(e) => set("result", e.target.value)}>
          {Object.entries(RESULT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input className={inp} value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving}
            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors">
            {saving ? <i className="fas fa-spinner fa-spin text-xs"/> : <i className="fas fa-check text-xs"/>}
          </button>
          <button onClick={onCancel}
            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors">
            <i className="fas fa-times text-xs"/>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── レコード行 ───────────────────────────────────────────────
function RecordRow({ record, isOwn, onEdit, onDelete, showPlanner }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <tr className={`border-b border-slate-50 hover:bg-slate-50 transition-colors group ${isOwn ? "bg-indigo-50/40" : ""}`}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          {isOwn && <span className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-slate-700">{record.company_name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-slate-500">{record.phone_number || "—"}</td>
      {showPlanner && (
        <td className="px-3 py-2.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ring-1 ${getPlannerColor(record.planner)}`}>
            {record.planner}
          </span>
        </td>
      )}
      <td className="px-3 py-2.5 text-sm text-slate-500">{record.call_date}</td>
      <td className="px-3 py-2.5"><ResultBadge result={record.result} /></td>
      <td className="px-3 py-2.5 text-sm text-slate-400 max-w-xs truncate">{record.notes || ""}</td>
      <td className="px-3 py-2.5">
        {isOwn && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(record)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 flex items-center justify-center transition-colors">
              <i className="fas fa-pen text-xs" />
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors">
                <i className="fas fa-trash-alt text-xs" />
              </button>
            ) : (
              <>
                <button onClick={() => onDelete(record.id)}
                  className="px-2 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors">
                  削除
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center">
                  <i className="fas fa-times text-xs" />
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────
export default function TeleapoManager({ currentPlanner: propPlanner }) {
  const { user } = useUser();
  const currentPlanner = propPlanner || user?.name || "";

  const [tab, setTab] = useState("list"); // "mine" | "all" | "list"
  const [records, setRecords] = useState([]);
  const [allRecordsForDup, setAllRecordsForDup] = useState([]); // 重複チェック用（常に全員分）
  const [loading, setLoading] = useState(false);
  const [showNewRow, setShowNewRow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  // 自分のリスト用フィルター
  const [mineSearch, setMineSearch] = useState("");
  const [mineFilterResult, setMineFilterResult] = useState("all");
  const [mineFilterDateFrom, setMineFilterDateFrom] = useState("");
  const [mineFilterDateTo, setMineFilterDateTo] = useState("");
  // 全員リスト用フィルター
  const [filterPlanner, setFilterPlanner] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [allSearch, setAllSearch] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "mine" && currentPlanner) params.append("planner", currentPlanner);
      const [tabRes, allRes] = await Promise.all([
        fetch(`${API_BASE}/teleapo/?${params}`),
        fetch(`${API_BASE}/teleapo/`), // 重複チェック用に常に全員分取得
      ]);
      const [tabData, allData] = await Promise.all([tabRes.json(), allRes.json()]);
      setRecords(Array.isArray(tabData) ? tabData : (tabData.results || []));
      setAllRecordsForDup(Array.isArray(allData) ? allData : (allData.results || []));
    } catch {
      setRecords([]);
      setAllRecordsForDup([]);
    } finally {
      setLoading(false);
    }
  }, [tab, currentPlanner]);

  useEffect(() => {
    fetchRecords();
    setShowNewRow(false);
    setEditingId(null);
    setCurrentPage(1);
  }, [fetchRecords]);

  // フィルター変更時にページリセット
  useEffect(() => { setCurrentPage(1); }, [
    mineSearch, mineFilterResult, mineFilterDateFrom, mineFilterDateTo,
    allSearch, filterPlanner, filterResult, filterDateFrom, filterDateTo,
  ]);

  const handleSaveNew = (saved) => {
    setRecords((prev) => [saved, ...prev]);
    setAllRecordsForDup((prev) => [saved, ...prev]); // 重複チェック用にも追加
    setShowNewRow(false);
    showToast("架電記録を追加しました");
  };

  const handleSaveEdit = (saved) => {
    setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
    setEditingId(null);
    showToast("架電記録を更新しました");
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/teleapo/${id}/`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setAllRecordsForDup((prev) => prev.filter((r) => r.id !== id)); // 重複チェック用にも反映
      showToast("削除しました");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  // ページネーション
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // フロントフィルタリング
  const filteredRecords = records.filter((r) => {
    if (tab === "mine") {
      const searchMatch = !mineSearch || r.company_name?.toLowerCase().includes(mineSearch.toLowerCase());
      const resultMatch = mineFilterResult === "all" || r.result === mineFilterResult;
      const dateFromMatch = !mineFilterDateFrom || r.call_date >= mineFilterDateFrom;
      const dateToMatch = !mineFilterDateTo || r.call_date <= mineFilterDateTo;
      return searchMatch && resultMatch && dateFromMatch && dateToMatch;
    } else {
      const plannerMatch = filterPlanner === "all" || r.planner === filterPlanner;
      const resultMatch = filterResult === "all" || r.result === filterResult;
      const dateFromMatch = !filterDateFrom || r.call_date >= filterDateFrom;
      const dateToMatch = !filterDateTo || r.call_date <= filterDateTo;
      const searchMatch = !allSearch || r.company_name?.toLowerCase().includes(allSearch.toLowerCase());
      return plannerMatch && resultMatch && dateFromMatch && dateToMatch && searchMatch;
    }
  });

  // 統計バー
  const counts = Object.keys(RESULT_CONFIG).reduce((acc, k) => {
    acc[k] = filteredRecords.filter((r) => r.result === k).length;
    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const thCls = "px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider";

  return (
    <div className="space-y-5">
      <Toast msg={toast?.msg} type={toast?.type} />

      {/* タブ切替 */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setTab("list")}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            tab === "list" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fas fa-phone-volume" />
          打合せ済みリスト
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "mine" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fas fa-user mr-2" />
          自分のリスト
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "all" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fas fa-users mr-2" />
          全員リスト
        </button>
      </div>

      {/* 打合せ済みリストタブ */}
      {tab === "list" && (
        <CallListTab
          currentPlanner={currentPlanner}
          onRecordSaved={(saved) => {
            setRecords(prev => [saved, ...prev]);
            setAllRecordsForDup(prev => [saved, ...prev]);
          }}
        />
      )}

      {/* 以下は mine / all タブのみ表示 */}

      {/* ─── 自分のリストフィルター ─── */}
      {tab === "mine" && (
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="会社名で検索"
              value={mineSearch}
              onChange={(e) => setMineSearch(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">結果</span>
            <select
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={mineFilterResult}
              onChange={(e) => setMineFilterResult(e.target.value)}
            >
              <option value="all">すべて</option>
              {Object.entries(RESULT_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">期間</span>
            <input type="date" className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={mineFilterDateFrom} onChange={(e) => setMineFilterDateFrom(e.target.value)} />
            <span className="text-slate-400 text-xs">〜</span>
            <input type="date" className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={mineFilterDateTo} onChange={(e) => setMineFilterDateTo(e.target.value)} />
          </div>
          {(mineSearch || mineFilterResult !== "all" || mineFilterDateFrom || mineFilterDateTo) && (
            <button onClick={() => { setMineSearch(""); setMineFilterResult("all"); setMineFilterDateFrom(""); setMineFilterDateTo(""); }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <i className="fas fa-times" /> リセット
            </button>
          )}
        </div>
      )}

      {/* ─── 全員リストフィルター ─── */}
      {tab === "all" && (
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="会社名で検索"
              value={allSearch}
              onChange={(e) => setAllSearch(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">プランナー</span>
            <select
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={filterPlanner}
              onChange={(e) => setFilterPlanner(e.target.value)}
            >
              <option value="all">全員</option>
              {PLANNERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">結果</span>
            <select
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
            >
              <option value="all">すべて</option>
              {Object.entries(RESULT_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">期間</span>
            <input type="date" className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            <span className="text-slate-400 text-xs">〜</span>
            <input type="date" className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>
          {(allSearch || filterPlanner !== "all" || filterResult !== "all" || filterDateFrom || filterDateTo) && (
            <button onClick={() => { setAllSearch(""); setFilterPlanner("all"); setFilterResult("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <i className="fas fa-times" /> リセット
            </button>
          )}
        </div>
      )}

      {tab !== "list" && <>
      {/* ─── 統計バー ─── */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-3 py-1.5 font-medium">
          合計{filteredRecords.length}件{records.length !== filteredRecords.length && <span className="text-slate-400">（全{records.length}件中）</span>}
        </span>
        {Object.entries(RESULT_CONFIG).map(([k, v]) =>
          counts[k] > 0 ? (
            <span key={k} className={`text-xs px-3 py-1.5 rounded-full font-medium border ${v.color}`}>
              {v.label} {counts[k]}件
            </span>
          ) : null
        )}
      </div>

      {/* ─── テーブル ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* テーブルヘッダー部 + 追加ボタン */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            {tab === "mine" ? `${currentPlanner}さんの打合せ済みリスト` : "全プランナー打合せ済みリスト"}
          </p>
          {tab === "mine" && !showNewRow && (
            <button
              onClick={() => setShowNewRow(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              <i className="fas fa-plus text-xs" /> 架電を追加
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <i className="fas fa-spinner fa-spin text-2xl text-indigo-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>企業名</th>
                  <th className={thCls}>電話番号</th>
                  {tab === "all" && <th className={thCls}>プランナー</th>}
                  <th className={thCls}>架電日</th>
                  <th className={thCls}>結果</th>
                  <th className={thCls}>備考</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody>
                {tab === "mine" && showNewRow && (
                  <NewRow
                    planner={currentPlanner}
                    allRecords={allRecordsForDup}
                    onSave={handleSaveNew}
                    onCancel={() => setShowNewRow(false)}
                  />
                )}
                {filteredRecords.length === 0 && !showNewRow ? (
                  <tr>
                    <td colSpan={tab === "all" ? 7 : 6} className="text-center py-16 text-slate-400">
                      <i className="fas fa-phone-slash text-3xl mb-3 block" />
                      <p className="text-sm">{records.length > 0 ? 'フィルター条件に一致する記録がありません' : '架電記録がありません'}</p>
                      {tab === "mine" && (
                        <button onClick={() => setShowNewRow(true)}
                          className="mt-3 text-indigo-600 text-sm hover:underline">
                          最初の架電を追加する
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) =>
                    editingId === r.id ? (
                      <EditRow key={r.id} record={r}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <RecordRow
                        key={r.id}
                        record={r}
                        isOwn={r.planner === currentPlanner}
                        showPlanner={tab === "all"}
                        onEdit={(rec) => setEditingId(rec.id)}
                        onDelete={handleDelete}
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ページネーション */}
        {!loading && filteredRecords.length > 0 && (
          <div className="flex items-center justify-between px-1 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {`${(safePage - 1) * PAGE_SIZE + 1}〜${Math.min(safePage * PAGE_SIZE, filteredRecords.length)}件 / 全${filteredRecords.length}件`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-angles-left"></i>
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`dots-${idx}`} className="w-7 text-center text-slate-400 text-xs">⋯</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          safePage === item
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )
                }
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-angles-right"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </>}

      {/* 凡例（全員リストのみ） */}
      {tab === "all" && (
        <div className="flex items-center gap-3 px-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            自分が入力した架電
          </span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs text-slate-400">他のプランナーの架電はそのまま表示</span>
        </div>
      )}
    </div>
  );
}
