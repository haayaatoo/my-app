import React, { useState, useEffect, useCallback } from "react";
import TeleapoManager from "./TeleapoManager";

const API_BASE = "/api";

const PLANNERS = ["温水", "瀬戸山", "上前", "岡田", "野田", "服部", "山口"];

// テーマはインデックス順で自動割り当て — PLANNERS に名前を追加するだけでOK
const THEME_PALETTE = [
  { gradient: "from-blue-500 to-indigo-600",   light: "from-blue-50 to-indigo-50",     border: "border-blue-200",    accent: "text-blue-700",    icon: "fa-droplet",      bar: "#6366f1" },
  { gradient: "from-rose-500 to-pink-600",      light: "from-rose-50 to-pink-50",       border: "border-rose-200",    accent: "text-rose-700",    icon: "fa-mountain-sun", bar: "#f43f5e" },
  { gradient: "from-emerald-500 to-teal-600",   light: "from-emerald-50 to-teal-50",   border: "border-emerald-200", accent: "text-emerald-700", icon: "fa-seedling",     bar: "#10b981" },
  { gradient: "from-purple-500 to-violet-600",  light: "from-purple-50 to-violet-50",  border: "border-purple-200",  accent: "text-purple-700",  icon: "fa-bolt",         bar: "#8b5cf6" },
  { gradient: "from-orange-500 to-amber-600",   light: "from-orange-50 to-amber-50",   border: "border-orange-200",  accent: "text-orange-700",  icon: "fa-fire",         bar: "#f97316" },
  { gradient: "from-cyan-500 to-sky-600",       light: "from-cyan-50 to-sky-50",       border: "border-cyan-200",    accent: "text-cyan-700",    icon: "fa-star",         bar: "#06b6d4" },
  { gradient: "from-lime-500 to-green-600",     light: "from-lime-50 to-green-50",     border: "border-lime-200",    accent: "text-lime-700",    icon: "fa-leaf",         bar: "#84cc16" },
  { gradient: "from-fuchsia-500 to-purple-600", light: "from-fuchsia-50 to-purple-50", border: "border-fuchsia-200", accent: "text-fuchsia-700", icon: "fa-gem",          bar: "#d946ef" },
];

const getPlannerTheme = (name) => THEME_PALETTE[PLANNERS.indexOf(name) % THEME_PALETTE.length];

// DBには「温水 飛和」のようなフルネームが入る場合もあるため、姓のみまたは完全一致どちらでもOK
const plannerMatches = (aptPlanner, plannerName) =>
  aptPlanner === plannerName ||
  aptPlanner.startsWith(plannerName + ' ') ||
  aptPlanner.startsWith(plannerName + '　');

// 件数・ランク別のやる気メッセージプール
const MOTIVATION_POOL = {
  zero: [
    { badge: "🔥", text: "最初の一歩を！",   sub: "行動が全ての始まり" },
    { badge: "⚡", text: "エンジン全開！",   sub: "今すぐ動き出そう" },
    { badge: "🚀", text: "発射台に立て！",   sub: "いつでも飛び立てる" },
    { badge: "🎯", text: "狙い定めろ！",     sub: "準備はいい？" },
    { badge: "🌟", text: "スタート切れ！",   sub: "始めれば道は開ける" },
    { badge: "👊", text: "尊ってない！",   sub: "今から巻き返せる" },
    { badge: "💡", text: "チャンス待ちだ！",   sub: "次のアポを摑め！" },
    { badge: "🌈", text: "雲の向こう！",     sub: "未来は自分で作る" },
  ],
  low: [
    { badge: "💪", text: "動き出した！",   sub: "この調子で積み上げろ" },
    { badge: "🌱", text: "芽が出た！",     sub: "ここから加速しよう" },
    { badge: "📈", text: "上昇開始！",     sub: "まだまだ伸びしろあり" },
    { badge: "🎵", text: "リズム刷け！",   sub: "コツコツが最強" },
    { badge: "🔑", text: "鍵は握った！",   sub: "扉を開けよう" },
    { badge: "✨", text: "波長合ってきた！",sub: "この波に乗れ！" },
  ],
  mid: [
    { badge: "💪", text: "いい調子！",     sub: "その調子で頑張れ！" },
    { badge: "🌊", text: "波に乗れ！",     sub: "この勢いを維持せよ" },
    { badge: "🔥", text: "熱が入ってる！",   sub: "モメンタム最高潮" },
    { badge: "⚡", text: "絶好調！",       sub: "止まるな突き進め" },
    { badge: "🎯", text: "的を射てる！",   sub: "正確に仕留めろ" },
    { badge: "🆙", text: "ドライブ中！",   sub: "止まるなフルスロットル" },
  ],
  high: [
    { badge: "🚀", text: "爆速前進中！",   sub: "誰も止められない" },
    { badge: "🌟", text: "輝いてる！",     sub: "周りを圧倒せよ" },
    { badge: "🔥", text: "燃えてる！",     sub: "この炎を絶やすな" },
    { badge: "👑", text: "王者の風格！",   sub: "頂点は目の前" },
    { badge: "⚡", text: "超速モード！",   sub: "加速は止まらない" },
    { badge: "🎉", text: "ヒーロー登場！", sub: "本物の実力見せつけろ" },
  ],
  top: [
    { badge: "🏆", text: "1位キープ！",   sub: "最高のパフォーマンス！" },
    { badge: "👑", text: "王者の貫迾！",   sub: "誰も追いつけない" },
    { badge: "🌟", text: "独走状態！",     sub: "まだまだ差を広げろ" },
    { badge: "🔥", text: "圧倒的１位！",   sub: "チームを引っ張れ" },
    { badge: "⚡", text: "無敵状態！",     sub: "あなたが最強だ" },
    { badge: "🎉", text: "パーフェクト！", sub: "これがプロの仕事" },
  ],
  second: [
    { badge: "🥈", text: "追い上げろ！",   sub: "もうすぐ１位だ！" },
    { badge: "🎯", text: "射程圈内！",     sub: "あと一息で逆転" },
    { badge: "🔥", text: "背中は見えた！",   sub: "全力で追い越せ" },
    { badge: "⚡", text: "ラストスパート！", sub: "今こそ本気を出せ" },
    { badge: "💪", text: "諷めるな！",     sub: "逆転の時は近い" },
    { badge: "🌟", text: "輝くのは今！",   sub: "全てを越えていけ！" },
  ],
};

/** ページロード時に1回だけ生成したランダムシード（プランナー別） */
const INITIAL_SEEDS = Object.fromEntries(PLANNERS.map(name => [name, Math.random()]));

const STATUS_LABELS = {
  scheduled: { label: "予定", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "完了", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "キャンセル", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

// ─── 通知コンポーネント ───────────────────────────────────────
function Notification({ notification }) {
  if (!notification) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-8 py-4 rounded-3xl backdrop-blur-sm text-white font-medium flex items-center gap-4 border border-white/20 animate-bounce-in ${
        notification.type === "success"
          ? "bg-gradient-to-r from-emerald-500 to-green-500"
          : notification.type === "warning"
          ? "bg-gradient-to-r from-amber-500 to-orange-500"
          : "bg-gradient-to-r from-red-500 to-rose-500"
      }`}
      style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
    >
      <i
        className={`fas text-sm ${
          notification.type === "success"
            ? "fa-check"
            : notification.type === "warning"
            ? "fa-exclamation-triangle"
            : "fa-exclamation"
        }`}
      ></i>
      <span className="text-lg tracking-wide">{notification.message}</span>
    </div>
  );
}

// ─── アポ追加/編集モーダル ────────────────────────────────────
function AppointmentModal({ mode, initialData, companies, onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState(
    initialData || {
      company: "",
      planner: "",
      appointment_date: today,
      appointment_time: "",
      status: "scheduled",
      notes: "",
    }
  );
  const [companySearch, setCompanySearch] = useState(
    initialData ? (companies.find((c) => c.id === initialData.company)?.name || "") : ""
  );
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  // コンフリクトチェック
  const checkConflict = useCallback(
    async (companyId, planner) => {
      if (!companyId || !planner || mode === "edit") return;
      setCheckingConflict(true);
      try {
        const params = new URLSearchParams({ company: companyId, planner });
        if (initialData?.id) params.append("exclude_id", initialData.id);
        const res = await fetch(`${API_BASE}/appointments/check_conflict/?${params}`);
        const data = await res.json();
        if (data.has_conflict) {
          setConflictInfo(data.conflict);
        } else {
          setConflictInfo(null);
        }
      } catch {
        setConflictInfo(null);
      } finally {
        setCheckingConflict(false);
      }
    },
    [mode, initialData]
  );

  useEffect(() => {
    if (form.company && form.planner) {
      checkConflict(form.company, form.planner);
    }
  }, [form.company, form.planner, checkConflict]);

  const handleCompanySelect = (company) => {
    setForm((f) => ({ ...f, company: company.id }));
    setCompanySearch(company.name);
    setShowCompanyDropdown(false);
  };

  // 入力テキストから企業を完全一致で自動選択（大文字小文字無視）
  const autoMatchCompany = () => {
    if (form.company || !companySearch.trim()) return;
    const matched = companies.find(
      (c) => c.name.toLowerCase() === companySearch.trim().toLowerCase()
    );
    if (matched) handleCompanySelect(matched);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 未選択の場合、入力テキストで再マッチを試みる
    let companyId = form.company;
    if (!companyId && companySearch.trim()) {
      const matched = companies.find(
        (c) => c.name.toLowerCase() === companySearch.trim().toLowerCase()
      );
      if (matched) {
        companyId = matched.id;
        setForm((f) => ({ ...f, company: matched.id }));
      }
    }
    if (!companyId) {
      setError("企業名をドロップダウンから選択してください（未登録の場合は企業マスタ管理から先に登録）");
      return;
    }
    if (!form.planner) {
      setError("プランナーを選択してください");
      return;
    }
    if (!form.appointment_date) {
      setError("日程を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, company: companyId }, conflictInfo);
    } catch (err) {
      setError(err.message || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.2)" }}
      >
        {/* ヘッダー */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-amber-50 to-stone-50 border-b border-amber-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300"></div>
          <h2 className="text-2xl font-medium text-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white">
              <i className="fas fa-calendar-plus"></i>
            </div>
            {mode === "edit" ? "アポイント編集" : "アポイント追加"}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* 競合警告 */}
          {conflictInfo && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border-2 border-red-200">
              <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 text-lg"></i>
              <div>
                <p className="font-semibold text-red-700">⚠ アポ重複の可能性があります！</p>
                <p className="text-red-600 text-sm mt-1">
                  <span className="font-bold">{conflictInfo.planner}</span>
                  が{" "}
                  <span className="font-bold">
                    {conflictInfo.date
                      ? new Date(conflictInfo.date).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </span>{" "}
                  にアポを入れています。
                  {conflictInfo.time && ` 時間：${conflictInfo.time}`}
                </p>
                <p className="text-red-500 text-xs mt-1">このまま登録すると同一企業で複数アポが発生します。</p>
              </div>
            </div>
          )}

          {/* 企業選択 */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              企業名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setShowCompanyDropdown(true);
                setForm((f) => ({ ...f, company: "" }));
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={autoMatchCompany}
              placeholder="企業名を検索..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent text-slate-700 bg-slate-50"
            />
            {showCompanyDropdown && companySearch && filteredCompanies.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredCompanies.slice(0, 20).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCompanySelect(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-slate-700 text-sm transition-colors border-b border-slate-50 last:border-0"
                  >
                    {c.name}
                    {c.active_appointment && (
                      <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {c.active_appointment.planner}がアポ中
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {form.company && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> 企業を選択しました
              </p>
            )}
          </div>

          {/* プランナー */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              プランナー <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PLANNERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, planner: p }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    form.planner === p
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600"
                  }`}
                >
                  {p}
                  {checkingConflict && form.planner === p && (
                    <i className="fas fa-spinner fa-spin ml-1 text-xs"></i>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 日程 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                日程 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.appointment_date}
                onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">時間（任意）</label>
              <input
                type="time"
                value={form.appointment_time}
                onChange={(e) => setForm((f) => ({ ...f, appointment_time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700"
              />
            </div>
          </div>

          {/* ステータス（編集時のみ） */}
          {mode === "edit" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">ステータス</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700"
              >
                <option value="scheduled">予定</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          )}

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">メモ（任意）</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="担当者名、目的、備考など..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i> {error}
            </p>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all ${
                conflictInfo
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-amber-500 hover:bg-amber-600"
              } shadow-md disabled:opacity-60`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i> 保存中...
                </span>
              ) : conflictInfo ? (
                "⚠ 重複を承知で登録"
              ) : (
                "登録する"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 企業マスタ管理モーダル ───────────────────────────────────
function CompanyMasterModal({ onClose, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [mode, setMode] = useState("single"); // 'single' | 'bulk'
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleSingleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/companies/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.name?.[0] || "登録に失敗しました");
      }
      setNewName("");
      setResult({ type: "success", message: "企業を登録しました" });
      onRefresh();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const names = bulkNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/companies/bulk_create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      setBulkNames("");
      setResult({
        type: "success",
        message: `${data.created}社を新規登録（${data.skipped}社は重複でスキップ）`,
      });
      onRefresh();
    } catch {
      setResult({ type: "error", message: "一括登録に失敗しました" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.2)" }}
      >
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-slate-50 to-stone-50 border-b border-slate-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-stone-300 to-slate-400"></div>
          <h2 className="text-2xl font-medium text-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-stone-500 flex items-center justify-center text-white">
              <i className="fas fa-building"></i>
            </div>
            企業マスタ管理
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* モード切り替え */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "single" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
              }`}
            >
              1件追加
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "bulk" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
              }`}
            >
              一括追加
            </button>
          </div>

          {result && (
            <div
              className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                result.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <i className={`fas ${result.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
              {result.message}
            </div>
          )}

          {mode === "single" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600">企業名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSingleAdd()}
                placeholder="例：株式会社〇〇"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50 text-slate-700"
              />
              <button
                onClick={handleSingleAdd}
                disabled={saving || !newName.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-slate-500 to-stone-500 text-white font-medium hover:from-slate-600 hover:to-stone-600 disabled:opacity-60 transition-all"
              >
                {saving ? "登録中..." : "企業を追加"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600">
                企業名（1行1社）
              </label>
              <textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                rows={8}
                placeholder={"株式会社〇〇\n△△テクノロジー\nXX株式会社\n..."}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50 text-slate-700 text-sm resize-none font-mono"
              />
              <button
                onClick={handleBulkAdd}
                disabled={saving || !bulkNames.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-slate-500 to-stone-500 text-white font-medium hover:from-slate-600 hover:to-stone-600 disabled:opacity-60 transition-all"
              >
                {saving ? "登録中..." : "一括追加"}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────
export default function CompanyAppointmentManager() {
  // ページリロードごとに変わるランダムシード（マウント時に一度だけ生成）
  const [msgSeeds] = useState(() => Object.fromEntries(PLANNERS.map(n => [n, Math.random()])));
  const pickMsg = (pool, name) => {
    const seed = msgSeeds[name] ?? INITIAL_SEEDS[name] ?? 0;
    return pool[Math.floor(seed * pool.length)];
  };

  const [mainTab, setMainTab] = useState("teleapo"); // "apo" | "teleapo"
  const [appointments, setAppointments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // 月ナビゲーション
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState(now.getMonth() + 1);

  const handlePrevMonth = () => {
    if (selectedMonthNum === 1) { setSelectedYear(y => y - 1); setSelectedMonthNum(12); }
    else setSelectedMonthNum(m => m - 1);
  };
  const handleNextMonth = () => {
    if (selectedMonthNum === 12) { setSelectedYear(y => y + 1); setSelectedMonthNum(1); }
    else setSelectedMonthNum(m => m + 1);
  };
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonthNum === now.getMonth() + 1;

  // フィルター
  const [filterPlanner, setFilterPlanner] = useState("");
  const [filterStatus, setFilterStatus] = useState("scheduled");
  const [searchCompany, setSearchCompany] = useState("");

  // モーダル
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showCompanyMaster, setShowCompanyMaster] = useState(false);

  // ページネーション
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 通知
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aptRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/appointments/`),
        fetch(`${API_BASE}/companies/`),
      ]);
      const [aptData, compData] = await Promise.all([aptRes.json(), compRes.json()]);
      setAppointments(Array.isArray(aptData) ? aptData : aptData.results || []);
      setCompanies(Array.isArray(compData) ? compData : compData.results || []);
    } catch {
      showNotification("データ取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // フィルタリング
  const filtered = appointments.filter((apt) => {
    const plannerMatch = filterPlanner ? plannerMatches(apt.planner, filterPlanner) : true;
    const statusMatch = filterStatus ? apt.status === filterStatus : true;
    const searchMatch = searchCompany
      ? apt.company_name?.toLowerCase().includes(searchCompany.toLowerCase())
      : true;
    return plannerMatch && statusMatch && searchMatch;
  });

  // 日付でソート（近い順）
  const sorted = [...filtered].sort((a, b) =>
    new Date(a.appointment_date) - new Date(b.appointment_date)
  );

  // ページネーション
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSorted = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 選択月のアポだけに絞り込んで統計
  const monthPrefix = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`;
  const monthlyApts = appointments.filter((a) => a.appointment_date?.startsWith(monthPrefix));

  const stats = {
    total: monthlyApts.filter((a) => a.status === "scheduled").length,
    totalCompleted: monthlyApts.filter((a) => a.status === "completed").length,
    byPlanner: PLANNERS.map((p) => ({
      name: p,
      count: monthlyApts.filter((a) => plannerMatches(a.planner, p) && a.status === "scheduled").length,
      completed: monthlyApts.filter((a) => plannerMatches(a.planner, p) && a.status === "completed").length,
    })),
  };

  // コンフリクト一覧（同企業に複数のscheduledアポ）
  const conflicts = (() => {
    const scheduled = appointments.filter((a) => a.status === "scheduled");
    const byCompany = {};
    scheduled.forEach((apt) => {
      if (!byCompany[apt.company]) byCompany[apt.company] = [];
      byCompany[apt.company].push(apt);
    });
    return Object.values(byCompany).filter((apts) => apts.length > 1);
  })();

  // フィルター変更時にページリセット
  useEffect(() => { setCurrentPage(1); }, [filterPlanner, filterStatus, searchCompany]);

  // アポ保存
  const handleSaveAppointment = async (formData, conflictInfo) => {
    const isEdit = !!editingAppointment;
    const url = isEdit
      ? `${API_BASE}/appointments/${editingAppointment.id}/`
      : `${API_BASE}/appointments/`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    const data = await res.json();
    setShowAddModal(false);
    setEditingAppointment(null);
    fetchAll();

    if (conflictInfo || data.conflict_warning) {
      showNotification(
        `⚠ 登録しました（${(conflictInfo || data.conflict_warning).planner}のアポと重複しています）`,
        "warning"
      );
    } else {
      showNotification(isEdit ? "更新しました" : "アポを登録しました");
    }
  };

  // ステータス変更
  const handleStatusChange = async (apt, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${apt.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      fetchAll();
      const labels = { completed: "完了", cancelled: "キャンセル", scheduled: "予定" };
      showNotification(`${apt.company_name}のアポを「${labels[newStatus]}」に変更しました`);
    } catch {
      showNotification("更新に失敗しました", "error");
    }
  };

  // 削除
  const handleDelete = async (apt) => {
    if (!window.confirm(`${apt.company_name}のアポを削除しますか？`)) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${apt.id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchAll();
      showNotification("削除しました");
    } catch {
      showNotification("削除に失敗しました", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Notification notification={notification} />

      {/* メインタブ: テレアポ / アポ管理 */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setMainTab("teleapo")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            mainTab === "teleapo" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fas fa-phone" />
          テレアポ
        </button>
        <button
          onClick={() => setMainTab("apo")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            mainTab === "apo" ? "bg-white shadow-sm text-amber-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fas fa-calendar-check" />
          アポ管理
        </button>
      </div>

      {/* テレアポタブ */}
      {mainTab === "teleapo" && (
        <TeleapoManager onApoTaken={fetchAll} />
      )}

      {/* アポ管理タブ */}
      {mainTab === "apo" && (
        <>

      {showAddModal && (
        <AppointmentModal
          mode="add"
          companies={companies}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAppointment}
        />
      )}

      {editingAppointment && (
        <AppointmentModal
          mode="edit"
          initialData={{
            company: editingAppointment.company,
            planner: editingAppointment.planner,
            appointment_date: editingAppointment.appointment_date,
            appointment_time: editingAppointment.appointment_time || "",
            status: editingAppointment.status,
            notes: editingAppointment.notes || "",
          }}
          companies={companies}
          onClose={() => setEditingAppointment(null)}
          onSave={handleSaveAppointment}
        />
      )}

      {showCompanyMaster && (
        <CompanyMasterModal
          onClose={() => setShowCompanyMaster(false)}
          onRefresh={fetchAll}
        />
      )}

      {/* ─── コンフリクト警告バナー ─── */}
      {conflicts.length > 0 && (
        <div
          className="p-5 rounded-2xl bg-red-50 border-2 border-red-200"
          style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
            <h3 className="font-bold text-red-700 text-lg">
              アポ重複が{conflicts.length}件検出されています！
            </h3>
          </div>
          <div className="space-y-2">
            {conflicts.map((apts, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-red-600 bg-white/60 px-3 py-2 rounded-xl">
                <i className="fas fa-building text-red-400"></i>
                <span className="font-semibold">{apts[0].company_name}</span>
                <span>→</span>
                {apts.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-100 rounded-lg">
                    {a.planner}（{a.appointment_date}）
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── サマリーセクション ─── */}
      <div className="space-y-4">
        {/* 全体合計バナー */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #334155 60%, #1e293b 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full -ml-12 -mb-12"></div>
          <div className="absolute top-4 left-1/2 w-2 h-2 bg-amber-400/40 rounded-full animate-ping"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              {/* 月ナビゲーション */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <i className="fas fa-chevron-left text-xs"></i>
                </button>
                <span className="text-white font-bold text-base min-w-[7rem] text-center">
                  {selectedYear}年{selectedMonthNum}月
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
                {!isCurrentMonth && (
                  <button
                    onClick={() => { setSelectedYear(now.getFullYear()); setSelectedMonthNum(now.getMonth() + 1); }}
                    className="ml-1 px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold transition-colors"
                  >
                    今月
                  </button>
                )}
              </div>
              <p className="text-slate-400 text-xs tracking-widest uppercase mb-2">Total Active Pipeline</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-6xl font-black text-white leading-none">{stats.total}</span>
                <span className="text-slate-400 text-lg mb-1">件のアポ進行中</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <i className="fas fa-check-circle"></i>完了 {stats.totalCompleted}件
                </span>
                <span className="text-slate-500">・</span>
                <span className="text-slate-400">累計 {stats.total + stats.totalCompleted}件</span>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <p className="text-slate-500 text-xs tracking-widest uppercase mb-1">Top 3</p>
              {[...stats.byPlanner].sort((a,b) => b.count - a.count).slice(0, 3).map((p, i) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span>{['🥇','🥈','🥉'][i]}</span>
                  <span className="text-slate-300 font-medium">{p.name}</span>
                  <span className="text-white font-bold">{p.count}件</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* プランナー別カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const ranked = [...stats.byPlanner].sort((a, b) => b.count - a.count);
            const maxCount = ranked[0]?.count || 1;
            return stats.byPlanner.map((p) => {
              const theme = getPlannerTheme(p.name);
              const rank = ranked.findIndex((r) => r.name === p.name) + 1;
              const isTop = rank === 1 && p.count > 0;
              const isSecond = rank === 2 && p.count > 0;
              const isSelected = filterPlanner === p.name;
              const progressPct = Math.round((p.count / maxCount) * 100);

              let motivation;
              if (isTop)        motivation = pickMsg(MOTIVATION_POOL.top, p.name);
              else if (isSecond) motivation = pickMsg(MOTIVATION_POOL.second, p.name);
              else if (p.count === 0) motivation = pickMsg(MOTIVATION_POOL.zero, p.name);
              else if (p.count <= 2)  motivation = pickMsg(MOTIVATION_POOL.low, p.name);
              else if (p.count <= 5)  motivation = pickMsg(MOTIVATION_POOL.mid, p.name);
              else                    motivation = pickMsg(MOTIVATION_POOL.high, p.name);

              return (
                <div
                  key={p.name}
                  onClick={() => setFilterPlanner(isSelected ? "" : p.name)}
                  className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
                    isSelected ? `${theme.border} shadow-xl` : `${theme.border} opacity-90 hover:opacity-100`
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? `0 12px 36px ${theme.bar}33`
                      : "0 4px 16px rgba(0,0,0,0.07)",
                  }}
                >
                  {/* 背景グラデーション */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.light}`}></div>

                  {/* 選択中インジケーター */}
                  {isSelected && (
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(to right, ${theme.bar}, ${theme.bar}88)` }}
                    ></div>
                  )}

                  {/* TOPバッジ */}
                  {isTop && (
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <i className="fas fa-crown text-xs"></i> 1位
                    </div>
                  )}

                  <div className="relative z-10 p-5">
                    {/* アイコン + 名前 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                      >
                        <i className={`fas ${theme.icon} text-lg`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-lg leading-tight">{p.name}</p>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <span>{motivation.badge}</span>
                          <span>{motivation.text}</span>
                        </p>
                      </div>
                    </div>

                    {/* メイン数字 */}
                    <div className="flex items-end justify-between mb-3">
                      <div className="flex items-end gap-1">
                        <span className={`text-5xl font-black leading-none ${theme.accent}`}>{p.count}</span>
                        <span className="text-slate-400 text-sm mb-1">件予定</span>
                      </div>
                      {p.completed > 0 && (
                        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                          <i className="fas fa-check text-emerald-500 text-xs"></i>
                          <span className="text-xs font-bold text-emerald-600">{p.completed}完了</span>
                        </div>
                      )}
                    </div>

                    {/* プログレスバー */}
                    <div className="h-2.5 bg-white/80 rounded-full overflow-hidden mb-2 shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progressPct}%`,
                          background: `linear-gradient(to right, ${theme.bar}cc, ${theme.bar})`,
                        }}
                      ></div>
                    </div>

                    {/* サブメッセージ */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{motivation.sub}</p>
                      <p className="text-xs text-slate-400">
                        {isSelected ? (
                          <span className={`font-semibold ${theme.accent}`}>🔍 絞り込み中</span>
                        ) : (
                          "タップで絞り込み"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ─── フィルター & アクション ─── */}
      <div
        className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col md:flex-row md:items-center gap-4"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        {/* 検索 */}
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
            placeholder="企業名で検索..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700 text-sm"
          />
        </div>

        {/* プランナー絞り込み */}
        <select
          value={filterPlanner}
          onChange={(e) => setFilterPlanner(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700 text-sm"
        >
          <option value="">全プランナー</option>
          {PLANNERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* ステータス絞り込み */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 text-slate-700 text-sm"
        >
          <option value="">全ステータス</option>
          <option value="scheduled">予定</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
        </select>

        <div className="flex gap-2">
          {/* 企業マスタ */}
          <button
            onClick={() => setShowCompanyMaster(true)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-building"></i>
            企業管理
          </button>
          {/* アポ追加 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm flex items-center gap-2 hover:bg-amber-600 shadow-md transition-all"
          >
            <i className="fas fa-plus"></i>
            アポを追加
          </button>
        </div>
      </div>

      {/* ─── アポ一覧テーブル ─── */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-times text-slate-400 text-2xl"></i>
          </div>
          <p className="text-slate-500 text-lg">アポが見つかりません</p>
          <p className="text-slate-400 text-sm mt-1">フィルター条件を変更するか、右上の「アポを追加」から登録してください</p>
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">企業名</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">プランナー</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">日程</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">時間</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">ステータス</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium">メモ</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedSorted.map((apt, idx) => {
                // 同企業での重複チェック
                const isConflict = conflicts.some((c) => c.some((a) => a.id === apt.id));
                const statusStyle = STATUS_LABELS[apt.status] || STATUS_LABELS.scheduled;
                return (
                  <tr
                    key={apt.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                      isConflict ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {isConflict && (
                          <i className="fas fa-exclamation-circle text-red-400 text-sm" title="アポ重複"></i>
                        )}
                        <span className="font-medium text-slate-700">{apt.company_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                        {apt.planner}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {apt.appointment_date
                        ? new Date(apt.appointment_date + "T00:00:00").toLocaleDateString("ja-JP", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })
                        : "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {apt.appointment_time ? apt.appointment_time.slice(0, 5) : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.color}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                      {apt.notes || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {/* 完了ボタン */}
                        {apt.status === "scheduled" && (
                          <button
                            onClick={() => handleStatusChange(apt, "completed")}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-600 transition-colors"
                            title="完了にする"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {/* 完了取り消しボタン */}
                        {apt.status === "completed" && (
                          <button
                            onClick={() => handleStatusChange(apt, "scheduled")}
                            className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors"
                            title="予定に戻す"
                          >
                            <i className="fas fa-rotate-left"></i>
                          </button>
                        )}
                        {/* 編集ボタン */}
                        <button
                          onClick={() => setEditingAppointment(apt)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-500 transition-colors"
                          title="編集"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        {/* キャンセルボタン */}
                        {apt.status === "scheduled" && (
                          <button
                            onClick={() => handleStatusChange(apt, "cancelled")}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-500 transition-colors"
                            title="キャンセル"
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        )}
                        {/* 削除ボタン */}
                        <button
                          onClick={() => handleDelete(apt)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                          title="削除"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {sorted.length === 0 ? '0件' : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, sorted.length)}件 / 全${sorted.length}件`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-angles-left"></i>
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200'
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
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-angles-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
