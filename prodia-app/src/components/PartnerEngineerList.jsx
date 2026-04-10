import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "./Toast";
import DeleteDropZone from "./DeleteDropZone";
import EngineerMemo from "./EngineerMemo";

const API_BASE = "/api";

const STATUS_CONFIG = {
  active:   { label: "稼働中",   color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  upcoming: { label: "稼働予定", color: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50 border-blue-200"    },
  inactive: { label: "契約終了",   color: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100 border-slate-300" },
};

const REMOTE_LABELS = { yes: "有", no: "無", hybrid: "ハイブリッド" };
const EXTENSION_LABELS = { yes: "有", no: "無", unknown: "未定" };

// ── フォーム共通スタイル（モジュールレベルで定義することでフォーカスバグを防止）
const inp = "w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300";
const sel = "w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300";

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const RATE_FIELDS = [
  "client_unit_price", "client_overtime_rate", "client_deduction_rate",
  "partner_unit_price", "partner_overtime_rate", "partner_deduction_rate",
];

const formatRate = (v) => {
  const raw = String(v ?? "").replace(/,/g, "").replace(/[^0-9]/g, "");
  return raw ? Number(raw).toLocaleString() : "";
};

const EMPTY_FORM = {
  name: "", name_kana: "", partner_company: "", skills: [],
  planner: "", status: "active",
  project_name: "", nearest_station: "", remote: "no",
  contract_start: "", contract_end: "", extension_possibility: "unknown",
  calendar_type: "通常カレンダー", work_hours: "9:00-18:00", actual_work_hours: "8h",
  // 甲
  client_company: "",
  client_unit_price: "", client_settlement_range: "140-180h",
  client_overtime_rate: "", client_deduction_rate: "",
  client_settlement_unit: "15分", client_payment_site: "月末日締め、翌月末日支払い",
  client_timesheet_format: "現場フォーマット", client_timesheet_collection: "",
  client_invoice_deadline: "第2営業日まで",
  client_contact_to: "", client_contact_cc: "",
  // 乙
  partner_unit_price: "", partner_settlement_range: "140-180h",
  partner_overtime_rate: "", partner_deduction_rate: "",
  partner_settlement_unit: "15分", partner_payment_site: "月末日締め、翌月末日支払い",
  partner_timesheet_format: "現場フォーマット", partner_timesheet_collection: "",
  partner_invoice_deadline: "第2営業日まで",
  partner_contact_to: "", partner_contact_cc: "",
  // 弊社
  our_admin_to: "i-uemae@1dr.co.jp", our_admin_cc: "kintai_seikyu@1dr.co.jp",
  notes: "",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// カードコンポーネント（表裏フリップ）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PartnerCard({ engineer, onEdit, onDelete, onMemo, isSelected, onSelect, memoRefreshTrigger }) {
  const [flipped, setFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [memoStats, setMemoStats] = useState({ total: 0, urgent: 0, high: 0, pending: 0 });
  const st = STATUS_CONFIG[engineer.status] || STATUS_CONFIG.inactive;

  const fetchMemoStats = useCallback(async () => {
    if (!engineer.name) return;
    try {
      const res = await fetch(`${API_BASE}/memos/by_engineer/?engineer_name=${encodeURIComponent(engineer.name)}`);
      if (res.ok) {
        const memos = await res.json();
        setMemoStats({
          total: memos.length,
          urgent: memos.filter((m) => m.priority === 'urgent' && !m.is_completed).length,
          high:   memos.filter((m) => m.priority === 'high'   && !m.is_completed).length,
          pending: memos.filter((m) => !m.is_completed).length,
        });
      }
    } catch (e) { /* silent */ }
  }, [engineer.name]);

  useEffect(() => { fetchMemoStats(); }, [fetchMemoStats, memoRefreshTrigger]);

  const getHighestPriority = () => {
    if (memoStats.urgent > 0) return 'urgent';
    if (memoStats.high > 0) return 'high';
    if (memoStats.pending > 0) return 'medium';
    if (memoStats.total > 0) return 'low';
    return 'none';
  };

  const MEMO_PRIORITY_STYLE = {
    urgent: { btn: 'bg-red-500 hover:bg-red-600 text-white', badge: 'bg-red-500', label: '緊急' },
    high:   { btn: 'bg-orange-500 hover:bg-orange-600 text-white', badge: 'bg-orange-500', label: '重要' },
    medium: { btn: 'bg-amber-400 hover:bg-amber-500 text-white', badge: 'bg-amber-400', label: '未完了' },
    low:    { btn: 'bg-blue-400 hover:bg-blue-500 text-white', badge: 'bg-blue-400', label: 'メモあり' },
    none:   { btn: 'bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600', badge: '', label: '' },
  };
  const priority = getHighestPriority();
  const memoStyle = MEMO_PRIORITY_STYLE[priority];

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('engineer-id', engineer.id);
  };
  const handleDragEnd = () => setIsDragging(false);

  const skillsArr = Array.isArray(engineer.skills)
    ? engineer.skills
    : typeof engineer.skills === "string"
    ? engineer.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const fmt = (val) => (val ? `¥${Number(val).toLocaleString()}` : "―");
  const fmtDate = (d) => (d ? d.replace(/-/g, "/") : "―");

  // NEW / 延長バッジ判定
  // last_user_updated_at は新規登録時はnull、更新時のみセットされる
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const isNew = engineer.last_user_updated_at &&
    (now - new Date(engineer.last_user_updated_at).getTime()) < ONE_MONTH_MS;
  const isExtended = engineer.contract_extended_at && (now - new Date(engineer.contract_extended_at).getTime()) < ONE_MONTH_MS;

  return (
    <>
    <div
      className={`relative cursor-pointer transition-all duration-200 ${isDragging ? 'opacity-50 rotate-3 scale-95 z-50' : ''}`}
      style={{ perspective: "1200px", height: "320px" }}
      onClick={() => !isDragging && setFlipped((f) => !f)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* チェックボックス */}
      <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(engineer.id, e.target.checked)}
          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
        />
      </div>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ── 表面 ── */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 p-5 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* ステータスバッジ */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-1">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${st.color}`}>
                {st.label}
              </span>
              {isExtended && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-500 text-white flex items-center gap-1">
                  <i className="fas fa-calendar-check text-[8px]"></i>延長
                </span>
              )}
              {isNew && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onMemo(engineer.name)}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${memoStyle.btn}`}
                title="メモ"
              >
                <i className="fas fa-sticky-note text-[10px]"></i>
                {priority !== 'none' && (
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${memoStyle.badge} rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white`}>
                    {memoStats.urgent || memoStats.high || memoStats.pending || memoStats.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => onEdit(engineer)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-pen text-[10px]"></i>
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-trash text-[10px]"></i>
              </button>
            </div>
          </div>

          {/* 名前 */}
          <div className="mb-1">
            <p className="font-bold text-slate-800 text-base leading-tight">{engineer.name}</p>
            {engineer.name_kana && (
              <p className="text-[11px] text-slate-400 mt-0.5">{engineer.name_kana}</p>
            )}
            {/* メモ優先度バッジ */}
            {priority !== 'none' && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white mt-1 ${memoStyle.badge}`}>
                <i className="fas fa-sticky-note text-[8px]"></i>
                {memoStyle.label}
              </span>
            )}
          </div>

          {/* 会社名 */}
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
            <i className="fas fa-building text-slate-400 text-[10px]"></i>
            {engineer.partner_company}
          </p>

          {/* スキル */}
          <div className="flex flex-wrap gap-1.5 mb-3 content-start items-start">
            {skillsArr.slice(0, 6).map((s) => (
              <span key={s} className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium leading-5">
                {s}
              </span>
            ))}
            {skillsArr.length > 6 && (
              <span className="text-[11px] text-slate-400 leading-5">+{skillsArr.length - 6}</span>
            )}
          </div>

          {/* 単価・期間 */}
          <div className="border-t border-slate-100 pt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">甲単価</span>
              <span className="font-bold text-slate-700">{fmt(engineer.client_unit_price)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">乙単価</span>
              <span className="font-bold text-slate-700">{fmt(engineer.partner_unit_price)}</span>
            </div>
            {(engineer.contract_start || engineer.contract_end) && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">契約期間</span>
                <span className="text-slate-600">
                  {fmtDate(engineer.contract_start)} 〜 {fmtDate(engineer.contract_end)}
                </span>
              </div>
            )}
          </div>

          {/* フリップヒント */}
          <p className="text-center text-[10px] text-slate-300 mt-2 flex items-center justify-center gap-1">
            <i className="fas fa-sync-alt"></i> クリックで契約情報を表示
          </p>
        </div>

        {/* ── 裏面（契約情報） ── */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-md p-5 flex flex-col overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-bold text-sm">{engineer.name}</p>
            <p className="text-slate-400 text-[10px] flex items-center gap-1">
              <i className="fas fa-sync-alt text-[9px]"></i> 戻る
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs scrollbar-thin">
            {/* 甲セクション */}
            <div>
              <p className="text-amber-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                【甲】{engineer.client_company || "―"}
              </p>
              <ContractRow label="案件名"    value={engineer.project_name} />
              <ContractRow label="最寄り駅"  value={engineer.nearest_station} />
              <ContractRow label="リモート"  value={REMOTE_LABELS[engineer.remote]} />
              <ContractRow label="契約期間"  value={`${fmtDate(engineer.contract_start)} 〜 ${fmtDate(engineer.contract_end)}`} />
              <ContractRow label="延長"      value={EXTENSION_LABELS[engineer.extension_possibility]} />
              <ContractRow label="勤務時間"  value={`${engineer.work_hours}（実働 ${engineer.actual_work_hours}）`} />
              <ContractRow label="甲基本単価" value={fmt(engineer.client_unit_price)} highlight />
              <ContractRow label="精算幅"    value={engineer.client_settlement_range} />
              <ContractRow label="超過単価"  value={engineer.client_overtime_rate ? `¥${Number(engineer.client_overtime_rate).toLocaleString()}` : "―"} />
              <ContractRow label="控除単価"  value={engineer.client_deduction_rate  ? `¥${Number(engineer.client_deduction_rate).toLocaleString()}`  : "―"} />
              <ContractRow label="支払サイト" value={engineer.client_payment_site} />
              <ContractRow label="勤怠回収"  value={engineer.client_timesheet_collection} />
              <ContractRow label="請求書期限" value={engineer.client_invoice_deadline} />
              {engineer.client_contact_to && <ContractRow label="送付先 To" value={engineer.client_contact_to} />}
              {engineer.client_contact_cc && <ContractRow label="送付先 Cc" value={engineer.client_contact_cc} />}
            </div>

            {/* 乙セクション */}
            <div className="border-t border-slate-700 pt-2 mt-2">
              <p className="text-sky-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                【乙】{engineer.partner_company}
              </p>
              <ContractRow label="乙基本単価" value={fmt(engineer.partner_unit_price)} highlight />
              <ContractRow label="精算幅"    value={engineer.partner_settlement_range} />
              <ContractRow label="超過単価"  value={engineer.partner_overtime_rate ? `¥${Number(engineer.partner_overtime_rate).toLocaleString()}` : "―"} />
              <ContractRow label="控除単価"  value={engineer.partner_deduction_rate  ? `¥${Number(engineer.partner_deduction_rate).toLocaleString()}`  : "―"} />
              <ContractRow label="支払サイト" value={engineer.partner_payment_site} />
              <ContractRow label="勤怠回収"  value={engineer.partner_timesheet_collection} />
              <ContractRow label="請求書期限" value={engineer.partner_invoice_deadline} />
              {engineer.partner_contact_to && <ContractRow label="送付先 To" value={engineer.partner_contact_to} />}
              {engineer.partner_contact_cc && <ContractRow label="送付先 Cc" value={engineer.partner_contact_cc} />}
            </div>

            {/* 弊社 */}
            {(engineer.our_admin_to || engineer.our_admin_cc) && (
              <div className="border-t border-slate-700 pt-2 mt-2">
                <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">弊社事務担当</p>
                {engineer.our_admin_to && <ContractRow label="To" value={engineer.our_admin_to} />}
                {engineer.our_admin_cc && <ContractRow label="Cc" value={engineer.our_admin_cc} />}
              </div>
            )}

            {engineer.notes && (
              <div className="border-t border-slate-700 pt-2 mt-2">
                <p className="text-slate-400 text-[10px] mb-1">備考</p>
                <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{engineer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* 削除確認ダイアログ */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" style={{ animation: 'bounceIn 0.3s ease' }}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 text-yellow-500">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">削除確認</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-red-600">{engineer.name}</span> さんを削除しますか？
                <br />この操作は取り消せません。
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={() => { onDelete(engineer.id); setShowConfirmDelete(false); }}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ContractRow({ label, value, highlight }) {
  if (!value || value === "―" || value === "/ ―" || value === "― 〜 ―") return null;
  return (
    <div className="flex gap-2 leading-snug">
      <span className="text-slate-500 shrink-0 w-20 text-[10px]">{label}</span>
      <span className={`${highlight ? "text-amber-300 font-bold" : "text-slate-300"} text-[10px] break-all`}>{value}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 登録・編集モーダル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PartnerForm({ initial, onClose, onSave }) {
  const initForm = (src) => {
    if (!src) return EMPTY_FORM;
    const f = { ...src };
    RATE_FIELDS.forEach((k) => { f[k] = formatRate(f[k]); });
    return f;
  };

  const [form, setForm] = useState(() => initForm(initial));
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic"); // basic | client | partner | admin

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setRate = (k, v) => set(k, formatRate(v));

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    const arr = Array.isArray(form.skills) ? form.skills : [];
    if (!arr.includes(s)) set("skills", [...arr, s]);
    setSkillInput("");
  };

  const removeSkill = (s) => {
    set("skills", (Array.isArray(form.skills) ? form.skills : []).filter((x) => x !== s));
  };

  // Field / inp / sel はモジュールレベルで定義済み（フォーカスバグ防止）

  const handleSave = async () => {
    if (!form.name || !form.partner_company) return;
    setSaving(true);
    const submitForm = { ...form };
    RATE_FIELDS.forEach((k) => { if (submitForm[k]) submitForm[k] = submitForm[k].replace(/,/g, ""); });
    await onSave(submitForm);
    setSaving(false);
  };

  const TAB_LIST = [
    { key: "basic",   label: "基本情報",  icon: "fa-user" },
    { key: "client",  label: "甲 契約",   icon: "fa-file-contract" },
    { key: "partner", label: "乙 契約",   icon: "fa-handshake" },
    { key: "admin",   label: "事務・備考", icon: "fa-envelope" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-user-tie text-indigo-500"></i>
            {initial?.id ? "BPエンジニア編集" : "BPエンジニア登録"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
                tab === t.key
                  ? "border-b-2 border-indigo-500 text-indigo-700 bg-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <i className={`fas ${t.icon} text-[11px]`}></i>{t.label}
            </button>
          ))}
        </div>

        {/* フォーム本体 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {/* ── 基本情報タブ ── */}
          {tab === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="技術者氏名" required>
                  <input className={inp} placeholder="例: 高橋 尚樹" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="フリガナ">
                  <input className={inp} placeholder="例: タカハシ ナオキ" value={form.name_kana} onChange={(e) => set("name_kana", e.target.value)} />
                </Field>
              </div>
              <Field label="所属会社（BP会社名）" required>
                <input className={inp} placeholder="例: 株式会社サムシス" value={form.partner_company} onChange={(e) => set("partner_company", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="担当プランナー">
                  <input className={inp} placeholder="例: 温水" value={form.planner} onChange={(e) => set("planner", e.target.value)} />
                </Field>
                <Field label="ステータス">
                  <select className={sel} value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* スキル */}
              <Field label="スキル">
                <div className="flex gap-2 mb-2">
                  <input
                    className={inp}
                    placeholder="スキルを入力してEnter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  />
                  <button
                    onClick={addSkill}
                    className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shrink-0"
                  >追加</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(form.skills) ? form.skills : []).map((s) => (
                    <span key={s} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-red-500 leading-none">×</button>
                    </span>
                  ))}
                </div>
              </Field>

              {/* 案件情報 */}
              <div className="pt-1 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">案件情報</p>
              </div>
              <Field label="案件名">
                <input className={inp} placeholder="例: インフラ運用・業務改善" value={form.project_name} onChange={(e) => set("project_name", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="最寄り駅">
                  <input className={inp} placeholder="例: 名古屋駅" value={form.nearest_station} onChange={(e) => set("nearest_station", e.target.value)} />
                </Field>
                <Field label="リモート有無">
                  <select className={sel} value={form.remote} onChange={(e) => set("remote", e.target.value)}>
                    <option value="no">無</option>
                    <option value="yes">有</option>
                    <option value="hybrid">ハイブリッド</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="契約開始日">
                  <input type="date" className={inp} value={form.contract_start} onChange={(e) => set("contract_start", e.target.value)} />
                </Field>
                <Field label="契約終了日">
                  <input type="date" className={inp} value={form.contract_end} onChange={(e) => set("contract_end", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="延長の可能性">
                  <select className={sel} value={form.extension_possibility} onChange={(e) => set("extension_possibility", e.target.value)}>
                    <option value="yes">有</option>
                    <option value="no">無</option>
                    <option value="unknown">未定</option>
                  </select>
                </Field>
                <Field label="勤務時間">
                  <input className={inp} placeholder="9:00-18:00" value={form.work_hours} onChange={(e) => set("work_hours", e.target.value)} />
                </Field>
                <Field label="実働時間">
                  <input className={inp} placeholder="8h" value={form.actual_work_hours} onChange={(e) => set("actual_work_hours", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* ── 甲契約タブ ── */}
          {tab === "client" && (
            <>
              <Field label="甲：会社名">
                <input className={inp} placeholder="例: 株式会社メイテツコム" value={form.client_company} onChange={(e) => set("client_company", e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="基本単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="730,000" value={form.client_unit_price} onChange={(e) => setRate("client_unit_price", e.target.value)} />
                </Field>
                <Field label="精算幅">
                  <input className={inp} placeholder="140-180h" value={form.client_settlement_range} onChange={(e) => set("client_settlement_range", e.target.value)} />
                </Field>
                <Field label="精算単位">
                  <input className={inp} placeholder="15分" value={form.client_settlement_unit} onChange={(e) => set("client_settlement_unit", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="超過単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="4,050" value={form.client_overtime_rate} onChange={(e) => setRate("client_overtime_rate", e.target.value)} />
                </Field>
                <Field label="控除単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="5,210" value={form.client_deduction_rate} onChange={(e) => setRate("client_deduction_rate", e.target.value)} />
                </Field>
              </div>
              <Field label="支払サイト">
                <input className={inp} value={form.client_payment_site} onChange={(e) => set("client_payment_site", e.target.value)} />
              </Field>
              <Field label="勤務表">
                <input className={inp} value={form.client_timesheet_format} onChange={(e) => set("client_timesheet_format", e.target.value)} />
              </Field>
              <Field label="勤怠表の回収方法">
                <input className={inp} placeholder="例: メイテツコム様→IDR" value={form.client_timesheet_collection} onChange={(e) => set("client_timesheet_collection", e.target.value)} />
              </Field>
              <Field label="請求書期限">
                <input className={inp} value={form.client_invoice_deadline} onChange={(e) => set("client_invoice_deadline", e.target.value)} />
              </Field>
              <Field label="書類送付先 To">
                <input className={inp} placeholder="例: 宮島（miyajima@example.co.jp）" value={form.client_contact_to} onChange={(e) => set("client_contact_to", e.target.value)} />
              </Field>
              <Field label="書類送付先 Cc">
                <input className={inp} placeholder="例: 小島（yukie@example.co.jp）" value={form.client_contact_cc} onChange={(e) => set("client_contact_cc", e.target.value)} />
              </Field>
            </>
          )}

          {/* ── 乙契約タブ ── */}
          {tab === "partner" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="基本単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="660,000" value={form.partner_unit_price} onChange={(e) => setRate("partner_unit_price", e.target.value)} />
                </Field>
                <Field label="精算幅">
                  <input className={inp} placeholder="140-180h" value={form.partner_settlement_range} onChange={(e) => set("partner_settlement_range", e.target.value)} />
                </Field>
                <Field label="精算単位">
                  <input className={inp} placeholder="15分" value={form.partner_settlement_unit} onChange={(e) => set("partner_settlement_unit", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="超過単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="3,660" value={form.partner_overtime_rate} onChange={(e) => setRate("partner_overtime_rate", e.target.value)} />
                </Field>
                <Field label="控除単価（円）">
                  <input type="text" inputMode="numeric" className={inp} placeholder="4,710" value={form.partner_deduction_rate} onChange={(e) => setRate("partner_deduction_rate", e.target.value)} />
                </Field>
              </div>
              <Field label="支払サイト">
                <input className={inp} value={form.partner_payment_site} onChange={(e) => set("partner_payment_site", e.target.value)} />
              </Field>
              <Field label="勤務表">
                <input className={inp} value={form.partner_timesheet_format} onChange={(e) => set("partner_timesheet_format", e.target.value)} />
              </Field>
              <Field label="勤怠表の回収方法">
                <input className={inp} placeholder="例: アイディーアール→サムシス様" value={form.partner_timesheet_collection} onChange={(e) => set("partner_timesheet_collection", e.target.value)} />
              </Field>
              <Field label="請求書期限">
                <input className={inp} value={form.partner_invoice_deadline} onChange={(e) => set("partner_invoice_deadline", e.target.value)} />
              </Field>
              <Field label="書類送付先 To">
                <input className={inp} placeholder="例: 小林（Kobayashi@example.co.jp）" value={form.partner_contact_to} onChange={(e) => set("partner_contact_to", e.target.value)} />
              </Field>
              <Field label="書類送付先 Cc">
                <input className={inp} placeholder="例: ―" value={form.partner_contact_cc} onChange={(e) => set("partner_contact_cc", e.target.value)} />
              </Field>
            </>
          )}

          {/* ── 事務・備考タブ ── */}
          {tab === "admin" && (
            <>
              <Field label="弊社事務担当 To">
                <input className={inp} value={form.our_admin_to} onChange={(e) => set("our_admin_to", e.target.value)} />
              </Field>
              <Field label="弊社事務担当 Cc">
                <input className={inp} value={form.our_admin_cc} onChange={(e) => set("our_admin_cc", e.target.value)} />
              </Field>
              <Field label="備考">
                <textarea
                  rows={6}
                  className={`${inp} resize-none`}
                  placeholder="自由記述"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.partner_company}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインコンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function PartnerEngineerList() {
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [memoTarget, setMemoTarget] = useState(null);
  const [memoRefreshTrigger, setMemoRefreshTrigger] = useState(0);
  const initialLoadDone = React.useRef(false);

  const fetchAll = useCallback(async () => {
    // 初回のみローディングスピナーを表示（2回目以降はサイレント更新）
    if (!initialLoadDone.current) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner-engineers/`);
      if (!res.ok) return;
      const data = await res.json();

      // 契約開始日を迎えた「稼働予定」エンジニアを自動で「稼働中」に更新
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const toActivate = data.filter(
        (e) => e.status === "upcoming" && e.contract_start && new Date(e.contract_start) <= today
      );
      if (toActivate.length > 0) {
        await Promise.all(
          toActivate.map((e) =>
            fetch(`${API_BASE}/partner-engineers/${e.id}/`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "active" }),
            })
          )
        );
        setEngineers(data.map((e) =>
          toActivate.find((t) => t.id === e.id) ? { ...e, status: "active" } : e
        ));
        toastRef.current.success(`${toActivate.length}件のエンジニアを「稼働中」に自動更新しました`);
      } else {
        setEngineers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (form) => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `${API_BASE}/partner-engineers/${form.id}/` : `${API_BASE}/partner-engineers/`;
    const payload = { ...form };

    // 数値フィールドの空文字→null変換
    ["client_unit_price", "client_overtime_rate", "client_deduction_rate",
     "partner_unit_price", "partner_overtime_rate", "partner_deduction_rate"].forEach((k) => {
      if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
      else payload[k] = Number(payload[k]);
    });

    // 日付フィールドの空文字→null変換（DateFieldに空文字を送るとDjango側で400エラーになる）
    ["contract_start", "contract_end"].forEach((k) => {
      if (!payload[k]) payload[k] = null;
    });

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("保存エラー:", errText);
      toast.error(`保存に失敗しました。\n${errText}`);
      return;
    }

    setShowForm(false);
    setEditTarget(null);
    await fetchAll();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/partner-engineers/${id}/`, { method: "DELETE" });
    toast.success("削除完了!");
    fetchAll();
  };

  const handleDropDelete = (id) => {
    const eng = engineers.find(e => e.id === id);
    if (eng && window.confirm(`${eng.name}さんを削除しますか？`)) {
      handleDelete(id);
    }
  };

  const handleSelectEngineer = (id, checked) => {
    setSelectedEngineers(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const handleSelectAll = () => {
    if (selectedEngineers.length === filtered.length) {
      setSelectedEngineers([]);
    } else {
      setSelectedEngineers(filtered.map(e => e.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedEngineers.length === 0) return;
    if (window.confirm(`選択した${selectedEngineers.length}件のエンジニアを削除しますか？`)) {
      Promise.all(
        selectedEngineers.map(id =>
          fetch(`${API_BASE}/partner-engineers/${id}/`, { method: "DELETE" })
        )
      ).then(() => {
        fetchAll();
        setSelectedEngineers([]);
        toast.success(`${selectedEngineers.length}件のエンジニアを削除しました`);
      }).catch(() => toast.error("一括削除に失敗しました"));
    }
  };

  const handleEdit = (eng) => {
    setEditTarget(eng);
    setShowForm(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    const eng = engineers.find((e) => e.id === id);
    if (!eng || eng.status === newStatus) return;
    const res = await fetch(`${API_BASE}/partner-engineers/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setEngineers((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
      toast.success(`ステータスを「${STATUS_CONFIG[newStatus].label}」に変更しました`);
    } else {
      toast.error("ステータス変更に失敗しました");
    }
  };

  const filtered = engineers.filter((e) => {
    const q = search.toLowerCase();
    if (q && !e.name.toLowerCase().includes(q) && !e.partner_company.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ━━ ラグジュアリーヘッダー ━━ */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-wide text-slate-700 flex items-center gap-4 font-display">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <i className="fas fa-user-tie text-white text-xl"></i>
            </div>
            BPエンジニアリスト
          </h2>
          <div className="flex items-center gap-3 ml-16">
            <span className="px-4 py-2 bg-indigo-50 text-slate-700 rounded-2xl text-lg font-medium border border-indigo-100">
              {filtered.length}件表示中
            </span>
            <span className="text-slate-500 font-normal">/ 総数 {engineers.length}件</span>
            <span className="text-xs text-slate-400 ml-2">カードをクリックで契約情報を表示</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 全選択 + 一括削除 */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedEngineers.length === filtered.length && filtered.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-600 font-medium">全選択</span>
          </label>
          {selectedEngineers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <i className="fas fa-trash text-xs"></i>
              {selectedEngineers.length}件削除
            </button>
          )}

          {/* 検索 */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              className="w-56 pl-9 pr-3 py-3 text-sm border border-slate-200 rounded-2xl bg-white/90 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="名前・会社名で検索…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 新規登録ボタン */}
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium flex items-center gap-3 transition-all duration-300 text-sm"
            style={{ boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)' }}
          >
            <i className="fas fa-plus text-sm"></i>
            新規登録
          </button>
        </div>
      </div>

      {/* ━━ カンバンボード ━━ */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <i className="fas fa-user-tie text-indigo-400 text-2xl"></i>
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">読み込み中...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
            const colEngineers = filtered.filter((e) => e.status === statusKey);
            const isOver = dragOverColumn === statusKey;
            return (
              <div
                key={statusKey}
                className={`rounded-2xl p-4 transition-all duration-200 border-2 ${
                  isOver
                    ? `${config.bg} border-dashed border-current shadow-lg scale-[1.01]`
                    : "bg-slate-50/60 border-transparent"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(statusKey); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverColumn(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = parseInt(e.dataTransfer.getData('engineer-id'), 10);
                  setDragOverColumn(null);
                  if (id) handleStatusChange(id, statusKey);
                }}
              >
                {/* カラムヘッダー */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${config.color}`}></div>
                  <h3 className={`font-bold text-sm ${config.text}`}>{config.label}</h3>
                  <span className="ml-auto text-xs font-bold text-slate-400 bg-white rounded-full px-2.5 py-0.5 shadow-sm border border-slate-100">
                    {colEngineers.length}
                  </span>
                </div>
                {/* カード一覧 */}
                <div className="space-y-4">
                  {colEngineers.map((eng) => (
                    <PartnerCard
                      key={eng.id}
                      engineer={eng}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMemo={(name) => setMemoTarget(name)}
                      isSelected={selectedEngineers.includes(eng.id)}
                      onSelect={handleSelectEngineer}
                      memoRefreshTrigger={memoRefreshTrigger}
                    />
                  ))}
                  {colEngineers.length === 0 && (
                    <div className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed transition-colors ${
                      isOver ? "border-current opacity-60" : "border-slate-200 text-slate-300"
                    }`}>
                      <i className="fas fa-inbox text-3xl mb-2"></i>
                      <p className="text-sm">ここにドロップ</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 登録・編集モーダル */}
      {showForm && (
        <PartnerForm
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}

      {/* メモモーダル */}
      {memoTarget && (
        <EngineerMemo
          engineerName={memoTarget}
          onClose={() => setMemoTarget(null)}
          onMemoChange={() => setMemoRefreshTrigger((t) => t + 1)}
        />
      )}

      {/* ドロップして削除ゾーン */}
      <DeleteDropZone onDrop={handleDropDelete} />
    </div>
  );
}
