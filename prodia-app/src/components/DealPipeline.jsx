
import React, { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8000/api";

const STAGES = [
  { key: "open_system",   label: "オープン系",       color: "bg-blue-50 border-blue-200",      header: "bg-blue-100",    badge: "bg-blue-400",    text: "text-blue-700"   },
  { key: "web",           label: "Web系",           color: "bg-indigo-50 border-indigo-200",  header: "bg-indigo-100",  badge: "bg-indigo-400",  text: "text-indigo-700" },
  { key: "embedded",      label: "組み込み",         color: "bg-orange-50 border-orange-200",  header: "bg-orange-100",  badge: "bg-orange-400",  text: "text-orange-700" },
  { key: "infrastructure",label: "インフラ",         color: "bg-emerald-50 border-emerald-200",header: "bg-emerald-100", badge: "bg-emerald-500", text: "text-emerald-700"},
  { key: "support_other", label: "開発支援・その他", color: "bg-purple-50 border-purple-200",  header: "bg-purple-100",  badge: "bg-purple-400",  text: "text-purple-700" },
  { key: "low_skill",     label: "ロースキル",       color: "bg-slate-100 border-slate-300",   header: "bg-slate-200",   badge: "bg-slate-400",   text: "text-slate-700"  },
];

const PRIORITY_CONFIG = {
  low:    { label: "低",   color: "bg-slate-100 text-slate-500"  },
  medium: { label: "中",   color: "bg-blue-100 text-blue-600"    },
  high:   { label: "高",   color: "bg-amber-100 text-amber-600"  },
  urgent: { label: "至急", color: "bg-red-100 text-red-600 font-bold" },
};

const ACTIVITY_ICONS = {
  note:       "fas fa-sticky-note",
  call:       "fas fa-phone",
  email:      "fas fa-envelope",
  meeting:    "fas fa-handshake",
  proposal:   "fas fa-file-alt",
  stage_move: "fas fa-arrow-right",
};

// ────────────────────────────────────────────────
// 案件カード
// ────────────────────────────────────────────────
// description フィールドから【キー】値 を取り出すヘルパー
function parseDesc(description, key) {
  if (!description) return null;
  const m = description.match(new RegExp(`【${key}】([^\n]+)`));
  return m ? m[1].trim() : null;
}

function DealCard({ deal, onClickCard, onDragStart }) {
  const pri = PRIORITY_CONFIG[deal.priority] || PRIORITY_CONFIG.medium;
  const rate = deal.expected_monthly_rate
    ? `¥${Number(deal.expected_monthly_rate).toLocaleString()}`
    : null;
  const language = parseDesc(deal.description, "言語");
  const timing   = parseDesc(deal.description, "時期");

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none"
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={() => onClickCard(deal)}
    >
      {/* 優先度 + 成約確率 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.color}`}>
          {pri.label}
        </span>
        {deal.win_probability != null && (
          <span className="text-[10px] text-slate-400 font-medium">
            成約確率 {deal.win_probability}%
          </span>
        )}
      </div>

      {/* 案件名 */}
      <p className="font-semibold text-sm text-slate-800 leading-snug mb-2 line-clamp-2">
        {deal.title}
      </p>

      {/* 言語 */}
      {language && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <i className="fas fa-code text-[10px] text-slate-400"></i>
          <span className="text-xs text-slate-600">{language}</span>
        </div>
      )}

      {/* 時期 */}
      {timing && (
        <div className="flex items-center gap-1.5 mb-2">
          <i className="fas fa-calendar text-[10px] text-slate-400"></i>
          <span className="text-xs text-slate-500">{timing}</span>
        </div>
      )}

      {/* フッター：単価・担当プランナー */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 mt-1">
        <span className="font-bold text-slate-600">{rate || "単価未定"}</span>
        <span className="flex items-center gap-1">
          <i className="fas fa-user text-[9px]"></i>
          {deal.assigned_to || "未定"}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// かんばんカラム
// ────────────────────────────────────────────────
function KanbanColumn({ stage, data, onClickCard, onDragStart, onDrop, onDragOver, onAddDeal }) {
  return (
    <div
      className={`flex flex-col min-w-[240px] w-64 rounded-2xl border ${stage.color} flex-shrink-0`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.key)}
    >
      {/* ヘッダー */}
      <div className={`${stage.header} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {stage.icon && <i className={`${stage.icon} text-xs ${stage.text}`}></i>}
          <span className={`text-xs font-bold ${stage.text}`}>{stage.label}</span>
          <span className={`${stage.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
            {data?.count ?? 0}
          </span>
        </div>
        {data?.total_amount > 0 && (
          <span className="text-[10px] text-slate-500 font-medium">
            ¥{Math.round(data.total_amount).toLocaleString()}
          </span>
        )}
      </div>

      {/* カード一覧 */}
      <div className="flex-1 flex flex-col gap-2 p-3 min-h-[120px] overflow-y-auto max-h-[calc(100vh-260px)]">
        {(data?.deals ?? []).map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onClickCard={onClickCard}
            onDragStart={onDragStart}
          />
        ))}
        {(data?.deals ?? []).length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-300 py-6">
            案件なし
          </div>
        )}
      </div>

      {/* 追加ボタン */}
      <button
        onClick={() => onAddDeal(stage.key)}
        className="mx-3 mb-3 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 py-1.5 rounded-lg hover:bg-white/70 transition-colors justify-center border border-dashed border-slate-300 hover:border-slate-400"
      >
        <i className="fas fa-plus text-[10px]"></i> 案件追加
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────
// 案件詳細ドロワー
// ────────────────────────────────────────────────
function DealDrawer({ deal, onClose, onSave, onDelete, engineers }) {
  const [form, setForm] = useState({ ...deal });
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${form.title}」を削除しますか？この操作は元に戻せません。`)) return;
    setDeleting(true);
    await onDelete(form.id);
    setDeleting(false);
  };

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    setAddingActivity(true);
    try {
      const res = await fetch(`${API_BASE}/deals/${deal.id}/add_activity/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: activityType,
          content: activityText,
          created_by: form.assigned_to || "営業",
        }),
      });
      if (res.ok) {
        const updated = await fetch(`${API_BASE}/deals/${deal.id}/`).then((r) => r.json());
        setForm(updated);
        setActivityText("");
      }
    } finally {
      setAddingActivity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* オーバーレイ */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* ドロワー本体 */}
      <div className="w-[480px] bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-amber-50 to-stone-50">
          <div className="flex-1 min-w-0">
            <input
              className="font-bold text-lg text-slate-800 bg-transparent border-none outline-none w-full"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="案件タイトル"
            />
            <p className="text-sm text-slate-500 mt-0.5">{form.client_company}</p>
          </div>
          <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 基本情報 */}
          <div className="px-6 py-4 space-y-3 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">ステージ</label>
                <select
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
                  value={form.stage}
                  onChange={(e) => set("stage", e.target.value)}
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">優先度</label>
                <select
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                >
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">担当営業</label>
                <input
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  value={form.assigned_to || ""}
                  onChange={(e) => set("assigned_to", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">受注確率</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range" min="0" max="100" step="10"
                    value={form.win_probability ?? 50}
                    onChange={(e) => set("win_probability", Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-slate-700 w-10 text-right">
                    {form.win_probability ?? 50}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">想定月単価</label>
                <input
                  type="number"
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  value={form.expected_monthly_rate || ""}
                  onChange={(e) => set("expected_monthly_rate", e.target.value)}
                  placeholder="例: 700000"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">参画予定日</label>
                <input
                  type="date"
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  value={form.expected_start_date || ""}
                  onChange={(e) => set("expected_start_date", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">客先担当者</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="担当者名"
                  value={form.contact_person || ""}
                  onChange={(e) => set("contact_person", e.target.value)}
                />
                <input
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="メールアドレス"
                  value={form.contact_email || ""}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">次回アクション</label>
              <div className="flex gap-2 mt-1">
                <input
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="例: 来週中に提案書送付"
                  value={form.next_action || ""}
                  onChange={(e) => set("next_action", e.target.value)}
                />
                <input
                  type="date"
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 w-36"
                  value={form.next_action_date || ""}
                  onChange={(e) => set("next_action_date", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wide">案件詳細</label>
              <textarea
                rows={3}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none"
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="案件の詳細情報"
              />
            </div>
          </div>

          {/* 活動履歴 */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">活動履歴</h3>

            {/* 入力エリア */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex gap-2 mb-2">
                {Object.entries(ACTIVITY_ICONS).filter(([k]) => k !== "stage_move").map(([k, iconClass]) => (
                  <button
                    key={k}
                    onClick={() => setActivityType(k)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${activityType === k ? "bg-amber-100 text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                    title={k}
                  >
                    <i className={`${iconClass} text-sm`}></i>
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none bg-white"
                placeholder="活動内容を記録..."
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddActivity}
                  disabled={addingActivity || !activityText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                >
                  {addingActivity ? "記録中..." : "記録する"}
                </button>
              </div>
            </div>

            {/* 履歴一覧 */}
            <div className="space-y-2">
              {(form.activities || []).length === 0 && (
                <p className="text-xs text-slate-300 text-center py-4">活動記録がありません</p>
              )}
              {(form.activities || []).map((act) => (
                <div key={act.id} className="flex gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`${ACTIVITY_ICONS[act.activity_type] || "fas fa-thumbtack"} text-slate-500 text-xs`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 leading-snug">{act.content}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {act.created_by} · {new Date(act.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50"
          >
            閉じる
          </button>
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <i className="fas fa-trash text-xs"></i>
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 新規案件作成モーダル
// ────────────────────────────────────────────────
function NewDealModal({ initialStage, onClose, onCreate, engineers }) {
  const [form, setForm] = useState({
    title: "",
    stage: initialStage || "open_system",
    priority: "medium",
    location: "",
    timing: "",
    language: "",
    phase: "",
    interview: "",
    headcount: "",
    expected_monthly_rate: "",
    time_range: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.title) return;
    setSaving(true);
    // 各項目を description に構造化して保存
    const description = [
      form.location   && `【場所】${form.location}`,
      form.timing     && `【時期】${form.timing}`,
      form.language   && `【言語】${form.language}`,
      form.phase      && `【担当フェーズ】${form.phase}`,
      form.interview  && `【面談】${form.interview}`,
      form.headcount  && `【人数】${form.headcount}`,
      form.time_range && `【時間幅】${form.time_range}`,
    ].filter(Boolean).join("\n");

    await onCreate({
      title: form.title,
      client_company: form.title,
      assigned_to: "未定",
      stage: form.stage,
      priority: form.priority,
      expected_monthly_rate: form.expected_monthly_rate || null,
      description,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-stone-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">新規案件概要を追加</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-3">
          {/* セクションヘッダー */}
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-1">案件概要</p>

          {/* 案件名 */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【案件名】 <span className="text-red-400">*</span></label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: React / Django フルスタック開発"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* ステージ */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ジャンル</label>
            <select
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              value={form.stage}
              onChange={(e) => set("stage", e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* 場所 */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【場所】</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: 名古屋市中区 / フルリモート"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          {/* 時期 */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【時期】</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: 2026年5月〜 / 即日"
              value={form.timing}
              onChange={(e) => set("timing", e.target.value)}
            />
          </div>

          {/* 言語 */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【言語】</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: Java / Python / React"
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
            />
          </div>

          {/* 担当フェーズ */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【担当フェーズ】</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: 要件定義〜製造 / テスト・運用保守"
              value={form.phase}
              onChange={(e) => set("phase", e.target.value)}
            />
          </div>

          {/* 面談 */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【面談】</label>
            <input
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: 1回 / オンライン"
              value={form.interview}
              onChange={(e) => set("interview", e.target.value)}
            />
          </div>

          {/* 人数・単価・時間幅 を横並び */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【人数】</label>
              <input
                className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="例: 2名"
                value={form.headcount}
                onChange={(e) => set("headcount", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【単価】</label>
              <input
                type="number"
                className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="例: 650000"
                value={form.expected_monthly_rate}
                onChange={(e) => set("expected_monthly_rate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">【時間幅】</label>
              <input
                className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="例: 140〜180h"
                value={form.time_range}
                onChange={(e) => set("time_range", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleCreate}
            disabled={saving || !form.title}
            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
          >
            {saving ? "作成中..." : "案件を作成"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 案件一覧ビュー
// ────────────────────────────────────────────────
function DealListView({ deals, loading, onClickDeal }) {
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortKey, setSortKey] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = deals
    .filter((d) => {
      const q = search.toLowerCase();
      if (q && !d.title.toLowerCase().includes(q) && !d.client_company.toLowerCase().includes(q)) return false;
      if (filterStage && d.stage !== filterStage) return false;
      if (filterPriority && d.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortKey] ?? "";
      let vb = b[sortKey] ?? "";
      if (["expected_monthly_rate", "win_probability"].includes(sortKey)) {
        va = Number(va) || 0; vb = Number(vb) || 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }) =>
    sortKey !== col
      ? <span className="text-slate-300 ml-1">↕</span>
      : <span className="text-amber-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;

  const Th = ({ label, col, className = "" }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none whitespace-nowrap ${className}`}
      onClick={() => col && handleSort(col)}
    >
      {label}{col && <SortIcon col={col} />}
    </th>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 検索・フィルターバー */}
      <div className="px-6 py-3 border-b border-white/60 bg-white/40 flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="案件名・企業名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white/80 text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
        >
          <option value="">すべてのステージ</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white/80 text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">すべての優先度</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto font-medium">{filtered.length}件</span>
      </div>

      {/* テーブル */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400 text-sm animate-pulse">読み込み中...</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <Th label="案件名" col="title" className="min-w-[200px]" />
                  <Th label="客先企業" col="client_company" />
                  <Th label="ステージ" col="stage" />
                  <Th label="優先度" col="priority" />
                  <Th label="担当営業" col="assigned_to" />
                  <Th label="月単価" col="expected_monthly_rate" />
                  <Th label="受注確率" col="win_probability" />
                  <Th label="次回アクション" col="next_action_date" />
                  <Th label="更新日" col="updated_at" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-300 text-sm">
                      該当する案件がありません
                    </td>
                  </tr>
                ) : filtered.map((deal) => {
                  const stage = STAGES.find((s) => s.key === deal.stage);
                  const pri = PRIORITY_CONFIG[deal.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                      onClick={() => onClickDeal(deal)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 line-clamp-1">{deal.title}</p>
                        {deal.proposed_engineer_names?.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            <i className="fas fa-user text-[9px]"></i>{deal.proposed_engineer_names.map((e) => e.name).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><i className="fas fa-building text-slate-400 text-xs"></i>{deal.client_company}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stage?.badge || "bg-slate-400"} text-white`}>
                          {stage?.label || deal.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pri.color}`}>
                          {pri.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{deal.assigned_to || "-"}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                        {deal.expected_monthly_rate
                          ? `¥${Number(deal.expected_monthly_rate).toLocaleString()}`
                          : <span className="text-slate-300 font-normal">未定</span>}
                      </td>
                      <td className="px-4 py-3">
                        {deal.win_probability != null ? (
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                                style={{ width: `${deal.win_probability}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-8 text-right">{deal.win_probability}%</span>
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {deal.next_action_date
                          ? <span className="text-amber-600 text-xs font-medium flex items-center gap-1"><i className="fas fa-calendar-day text-[10px]"></i>{deal.next_action_date}</span>
                          : <span className="text-slate-300 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {deal.updated_at
                          ? new Date(deal.updated_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// メインコンポーネント：DealPipeline
// ────────────────────────────────────────────────
export default function DealPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDealStage, setNewDealStage] = useState("open_system");
  const [engineers, setEngineers] = useState([]);
  const [activeView, setActiveView] = useState("pipeline");
  const dragDeal = useRef(null);

  const fetchPipeline = async () => {
    try {
      const res = await fetch(`${API_BASE}/deals/pipeline/`);
      if (res.ok) setPipeline(await res.json());
    } catch (e) {
      console.error("パイプライン取得エラー:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/deals/`);
      if (res.ok) setAllDeals(await res.json());
    } catch (e) {
      console.error("案件一覧取得エラー:", e);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await fetch(`${API_BASE}/engineers/`);
      if (res.ok) setEngineers(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchPipeline();
    fetchAllDeals();
    fetchEngineers();
  }, []);

  // ドラッグ＆ドロップ
  const handleDragStart = (e, deal) => { dragDeal.current = deal; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!dragDeal.current || dragDeal.current.stage === targetStage) return;
    try {
      await fetch(`${API_BASE}/deals/${dragDeal.current.id}/move_stage/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      dragDeal.current = null;
      fetchPipeline();
      fetchAllDeals();
    } catch (e) {
      console.error("ステージ移動エラー:", e);
    }
  };

  // 案件保存
  const handleSaveDeal = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/deals/${form.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSelectedDeal(null);
        fetchPipeline();
        fetchAllDeals();
      }
    } catch (e) {
      console.error("保存エラー:", e);
    }
  };

  // 案件削除
  const handleDeleteDeal = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setSelectedDeal(null);
        fetchPipeline();
        fetchAllDeals();
      }
    } catch (e) {
      console.error("削除エラー:", e);
    }
  };

  // 新規案件作成
  const handleCreateDeal = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/deals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          required_skills: [],
          win_probability: form.win_probability ?? 30,
        }),
      });
      if (res.ok) {
        setShowNewDeal(false);
        fetchPipeline();
        fetchAllDeals();
      }
    } catch (e) {
      console.error("作成エラー:", e);
    }
  };

  // サマリー計算
  const activeDeals = STAGES
    .filter((s) => !["won", "lost"].includes(s.key))
    .reduce((s, st) => s + (pipeline[st.key]?.count || 0), 0);
  const wonDeals = pipeline.won?.count || 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100">
      {/* ページヘッダー */}
      <div className="px-6 pt-4 pb-0 border-b border-white/60 bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-chart-bar text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">案件回収管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeView === "pipeline" ? "ドラッグ＆ドロップでジャンルを移動できます"
                  : "案件を検索・絞り込みできます"}
              </p>
            </div>
          </div>

          {/* サマリーバッジ */}
          <div className="flex items-center gap-4 mr-4">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-800">{activeDeals}</p>
              <p className="text-[10px] text-slate-400">進行中</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{wonDeals}</p>
              <p className="text-[10px] text-slate-400">成約</p>
            </div>
          </div>

          <button
              onClick={() => { setNewDealStage("open_system"); setShowNewDeal(true); }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
            >
              <span className="text-lg">+</span> 案件概要追加
            </button>
        </div>

        {/* ── Salesforce スタイル タブ ── */}
        <div className="flex">
          {[
            { key: "pipeline", label: "かんばん", icon: "fas fa-columns" },
            { key: "list",     label: "一覧",         icon: "fas fa-list" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-150 ${
                activeView === tab.key
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <i className={`${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ビュー切り替え ── */}
      {activeView === "pipeline" ? (
        loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-400 text-sm animate-pulse">読み込み中...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
            <div className="flex gap-4 h-full min-w-max">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.key}
                  stage={stage}
                  data={pipeline[stage.key]}
                  onClickCard={setSelectedDeal}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onAddDeal={(s) => { setNewDealStage(s); setShowNewDeal(true); }}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <DealListView
          deals={allDeals}
          loading={loading}
          onClickDeal={setSelectedDeal}
        />
      )}

      {/* 詳細ドロワー */}
      {selectedDeal && (
        <DealDrawer
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onSave={handleSaveDeal}
          onDelete={handleDeleteDeal}
          engineers={engineers}
        />
      )}

      {/* 新規作成モーダル */}
      {showNewDeal && (
        <NewDealModal
          initialStage={newDealStage}
          onClose={() => setShowNewDeal(false)}
          onCreate={handleCreateDeal}
          engineers={engineers}
        />
      )}
    </div>
  );
}
