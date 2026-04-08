import React, { useEffect, useState, useMemo } from "react";

const API_BASE = "http://localhost:8000/api";

// 今日から何日後か計算
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// 緊急度の設定
function urgencyConfig(days) {
  if (days === null) return null;
  if (days < 0)  return { label: "契約終了済", color: "bg-slate-100 text-slate-500", badge: "bg-slate-400", ring: "ring-slate-300", dot: "bg-slate-400", priority: 0 };
  if (days <= 14) return { label: `残${days}日`, color: "bg-red-50 text-red-700", badge: "bg-red-500", ring: "ring-red-300", dot: "bg-red-500", priority: 1 };
  if (days <= 30) return { label: `残${days}日`, color: "bg-orange-50 text-orange-700", badge: "bg-orange-400", ring: "ring-orange-300", dot: "bg-orange-400", priority: 2 };
  return null; // 30日超は警告対象外
}

// 延長確認日：契約終了1ヶ月前の日が属する週の月曜日（第1営楮日）
function extensionCheckDate(endDateStr) {
  if (!endDateStr) return null;
  const base = new Date(endDateStr);
  base.setMonth(base.getMonth() - 1);
  const dow = base.getDay(); // 0=日, 1=月...6=土
  const monday = new Date(base);
  if (dow === 0) monday.setDate(monday.getDate() + 1);
  else if (dow === 6) monday.setDate(monday.getDate() + 2);
  else monday.setDate(monday.getDate() - (dow - 1));
  return monday;
}

// 延長確認アラートが必要かチェック（14日以内に確認日が来る or 超過中）
function extensionAlertStatus(endDateStr) {
  const checkDate = extensionCheckDate(endDateStr);
  if (!checkDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const check = new Date(checkDate); check.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr); end.setHours(0, 0, 0, 0);
  const daysToEnd = Math.round((end - today) / 86400000);
  if (daysToEnd <= 0) return null; // 契約終了済めは除外
  const daysToCheck = Math.round((check - today) / 86400000);
  if (daysToCheck > 14) return null; // 2週間超先はまだ表示しない
  return { checkDate: check, daysToCheck, daysToEnd };
}

// ────────────────────────────────────────────────
// KPIカード
// ────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, gradient, textColor, pulse = false }) {
  return (
    <div className={`relative rounded-2xl p-5 ${gradient} overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} text-white text-base`}></i>
        </div>
        {pulse && <span className="flex h-2.5 w-2.5 relative mt-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span></span>}
      </div>
      <p className={`text-3xl font-bold text-white mb-1`}>{value}</p>
      <p className="text-xs text-white/80 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-white/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ────────────────────────────────────────────────
// 契約終了アラートカード（IDR / BP 共通）
// ────────────────────────────────────────────────
function AlertRow({ engineer, days, cfg }) {
  const isBP = engineer._type === 'bp';
  const endDate = isBP ? engineer.contract_end : engineer.project_end_date;
  const dateLabel = endDate
    ? new Date(endDate).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
    : "-";
  const rateLabel = isBP
    ? (engineer.client_unit_price && engineer.partner_unit_price
        ? `粗利 ¥${(Number(engineer.client_unit_price) - Number(engineer.partner_unit_price)).toLocaleString()}`
        : "単価未設定")
    : (engineer.monthly_rate ? `¥${Number(engineer.monthly_rate).toLocaleString()}` : "未設定");

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.color} ring-1 ${cfg.ring} transition-all hover:shadow-sm`}>
      {/* 種別ドット */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`text-[9px] font-bold px-1.5 rounded ${isBP ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isBP ? 'BP' : 'IDR'}
        </span>
      </div>

      {/* 名前・会社 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 text-sm">{engineer.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
          <i className="fas fa-building text-[10px]"></i>
          {engineer.client_company || "客先未設定"}
          {isBP && engineer.partner_company && (
            <><span className="text-slate-300">·</span>
            <i className="fas fa-handshake text-[10px]"></i>
            {engineer.partner_company}</>
          )}
          <span className="text-slate-300">·</span>
          <i className="fas fa-user text-[10px]"></i>
          {engineer.planner || "-"}
        </p>
      </div>

      {/* 終了日・単価 */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
          <i className="fas fa-calendar-times text-[10px] text-slate-400"></i>
          {dateLabel}
        </p>
        <p className="text-[11px] text-slate-500">{rateLabel} / 月</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 延長確認アラート行
// ────────────────────────────────────────────────
function ExtensionCheckRow({ engineer }) {
  const isBP = engineer._type === 'bp';
  const endDateStr = isBP ? engineer.contract_end : engineer.project_end_date;
  const { checkDate, daysToCheck, daysToEnd } = engineer._extStatus;

  const checkDateLabel = checkDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
  const endDateLabel = new Date(endDateStr).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });

  let statusLabel, badgeColor, rowColor, ringColor;
  if (daysToCheck < 0) {
    statusLabel = `${Math.abs(daysToCheck)}日超過`;
    badgeColor = "bg-red-500";
    rowColor = "bg-red-50 text-red-700";
    ringColor = "ring-red-200";
  } else if (daysToCheck === 0) {
    statusLabel = "本日が確認日！";
    badgeColor = "bg-red-500 animate-pulse";
    rowColor = "bg-red-50 text-red-700";
    ringColor = "ring-red-200";
  } else if (daysToCheck <= 3) {
    statusLabel = `${daysToCheck}日後に確認`;
    badgeColor = "bg-orange-400";
    rowColor = "bg-orange-50 text-orange-700";
    ringColor = "ring-orange-200";
  } else {
    statusLabel = `${daysToCheck}日後に確認`;
    badgeColor = "bg-amber-400";
    rowColor = "bg-amber-50 text-amber-700";
    ringColor = "ring-amber-200";
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${rowColor} ring-1 ${ringColor} transition-all hover:shadow-sm`}>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <i className="fas fa-clipboard-check text-sm opacity-60"></i>
        <span className={`text-[9px] font-bold px-1.5 rounded ${isBP ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isBP ? 'BP' : 'IDR'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 text-sm">{engineer.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${badgeColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
          <i className="fas fa-building text-[10px]"></i>
          {engineer.client_company || "客先未設定"}
          <span className="text-slate-300">·</span>
          <i className="fas fa-user text-[10px]"></i>
          {engineer.planner || "-"}
          {isBP && engineer.extension_possibility && engineer.extension_possibility !== 'unknown' && (
            <><span className="text-slate-300">·</span>
            <span className={`text-[10px] font-semibold ${engineer.extension_possibility === 'yes' ? 'text-emerald-600' : 'text-slate-400'}`}>
              延長{engineer.extension_possibility === 'yes' ? '済み' : 'なし'}
            </span></>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
          <i className="fas fa-calendar-check text-[10px] text-amber-400"></i>
          確認日: {checkDateLabel}
        </p>
        <p className="text-[11px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
          <i className="fas fa-calendar-times text-[10px] text-slate-300"></i>
          終了: {endDateLabel}（残{daysToEnd}日）
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 稼働率ゲージ
// ────────────────────────────────────────────────
function UtilizationGauge({ rate }) {
  const clamp = Math.min(100, Math.max(0, rate));
  const label =
    clamp >= 80 ? "優良" :
    clamp >= 60 ? "要注意" :
    "危険";
  const labelColor =
    clamp >= 80 ? "text-emerald-600 bg-emerald-50" :
    clamp >= 60 ? "text-amber-600 bg-amber-50" :
    "text-red-600 bg-red-50";

  // SVG円形ゲージ
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamp / 100);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={clamp >= 80 ? "#34d399" : clamp >= 60 ? "#fbbf24" : "#f87171"} />
              <stop offset="100%" stopColor={clamp >= 80 ? "#14b8a6" : clamp >= 60 ? "#f97316" : "#ef4444"} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{clamp.toFixed(0)}<span className="text-lg">%</span></span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${labelColor}`}>{label}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">稼働率（稼働中 / 全体）</p>
    </div>
  );
}

// ────────────────────────────────────────────────
// ステータス別バー
// ────────────────────────────────────────────────
function StatusBreakdown({ engineers }) {
  const counts = useMemo(() => {
    const c = {};
    engineers.forEach((e) => {
      const s = e.engineer_status || "不明";
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [engineers]);

  const total = engineers.length;
  const buckets = [
    { key: "アサイン済", label: "稼働中", color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
    { key: "未アサイン", label: "待機中", color: "bg-amber-400", textColor: "text-amber-700", bg: "bg-amber-50" },
    { key: "フェードアウト", label: "フェードアウト中", color: "bg-orange-400", textColor: "text-orange-700", bg: "bg-orange-50" },
    { key: "退職", label: "退職", color: "bg-slate-400", textColor: "text-slate-600", bg: "bg-slate-50" },
  ];

  // 上記buckets以外のステータスもまとめて表示
  const knownKeys = buckets.map((b) => b.key);
  const otherCount = Object.entries(counts)
    .filter(([k]) => !knownKeys.includes(k))
    .reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-3">
      {buckets.map((b) => {
        const count = counts[b.key] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={b.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold ${b.textColor}`}>{b.label}</span>
              <span className="text-slate-500">{count}名 <span className="text-slate-400">({pct.toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${b.color} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {otherCount > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-500">その他</span>
            <span className="text-slate-500">{otherCount}名</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 rounded-full" style={{ width: `${(otherCount / total) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// エンジニア一覧テーブル（全員）
// ────────────────────────────────────────────────
function EngineerTable({ engineers }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("action"); // "action" | "all"

  const statuses = useMemo(() => {
    const s = new Set(engineers.map((e) => e.engineer_status).filter(Boolean));
    return [...s];
  }, [engineers]);

  const rows = useMemo(() => {
    return engineers
      .map((e) => ({ ...e, _days: daysUntil(e.project_end_date), _extStatus: extensionAlertStatus(e.project_end_date) }))
      .filter((e) => {
        // 要対応フィルター: 30日以内に終了 OR 待機中 OR フェードアウト OR 延長確認対象
        if (viewMode === "action") {
          const needsAction =
            (e._days !== null && e._days <= 30) ||
            e.engineer_status === "未アサイン" ||
            e.engineer_status === "フェードアウト" ||
            e._extStatus !== null;
          if (!needsAction) return false;
        }
        if (filterStatus && e.engineer_status !== filterStatus) return false;
        if (search) {
          const q = search.toLowerCase();
          return e.name?.toLowerCase().includes(q) || e.client_company?.toLowerCase().includes(q) || e.planner?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a._days === null && b._days === null) return 0;
        if (a._days === null) return 1;
        if (b._days === null) return -1;
        return a._days - b._days;
      });
  }, [engineers, search, filterStatus, viewMode]);

  // 要対応件数（バッジ用）
  const actionCount = useMemo(() => engineers.filter(e => {
    const d = daysUntil(e.project_end_date);
    return (d !== null && d <= 30) || e.engineer_status === "未アサイン" || e.engineer_status === "フェードアウト" || extensionAlertStatus(e.project_end_date) !== null;
  }).length, [engineers]);

  return (
    <div className="flex flex-col">
      {/* 要対応 / 全員 トグル + フィルター */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* トグル */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("action")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "action" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fas fa-exclamation-circle text-[10px]" />
            要対応のみ
            {actionCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                viewMode === "action" ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"
              }`}>{actionCount}</span>
            )}
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "all" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            全員
          </button>
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="名前・客先・担当で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">すべてのステータス</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{rows.length}件</span>
      </div>

      {/* テーブル */}
      <div className="overflow-auto rounded-xl border border-slate-100 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">氏名</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">客先</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">担当営業</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">月単価</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">契約終了予定</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">残日数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                  {viewMode === "action"
                    ? <span className="flex items-center justify-center gap-2 text-emerald-500"><i className="fas fa-check-circle text-base" />現在、対応が必要なエンジニアはいません</span>
                    : "該当なし"
                  }
                </td>
              </tr>
            ) : rows.map((e) => {
              const cfg = urgencyConfig(e._days);
              const statusColor =
                e.engineer_status === "アサイン済" ? "bg-emerald-100 text-emerald-700" :
                e.engineer_status === "未アサイン" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600";

              return (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {e.engineer_status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{e.client_company || <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{e.planner || <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                    {e.monthly_rate
                      ? `¥${Number(e.monthly_rate).toLocaleString()}`
                      : <span className="text-slate-300 font-normal">未設定</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {e.project_end_date
                      ? new Date(e.project_end_date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
                      : <span className="text-slate-300">未設定</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {cfg ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      ) : e._days !== null ? (
                        <span className="text-xs text-slate-400">残{e._days}日</span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                      {e._extStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-0.5 ${
                          e._extStatus.daysToCheck <= 0 ? 'bg-red-400' :
                          e._extStatus.daysToCheck <= 3 ? 'bg-orange-400' : 'bg-amber-400'
                        }`}>
                          <i className="fas fa-clipboard-check text-[8px]"></i>
                          延長確認{e._extStatus.daysToCheck <= 0 ? `（${Math.abs(e._extStatus.daysToCheck)}日超過）` : `（${e._extStatus.daysToCheck}日後）`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// BP ステータス内訳
// ────────────────────────────────────────────────
function BPStatusBreakdown({ partners }) {
  const total = partners.length;
  const buckets = [
    { key: "active",   label: "稼働中",   color: "bg-violet-500", textColor: "text-violet-700" },
    { key: "upcoming", label: "稼働予定", color: "bg-blue-400",   textColor: "text-blue-700"   },
    { key: "inactive", label: "契約終了",   color: "bg-slate-400",  textColor: "text-slate-600"  },
  ];
  return (
    <div className="space-y-3">
      {buckets.map((b) => {
        const count = partners.filter(p => p.status === b.key).length;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={b.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold ${b.textColor}`}>{b.label}</span>
              <span className="text-slate-500">{count}名 <span className="text-slate-400">({pct.toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${b.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────
// BP テーブル
// ────────────────────────────────────────────────
function BPTable({ partners }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("action"); // "action" | "all"

  const STATUS_LABELS = { active: "稼働中", upcoming: "稼働予定", inactive: "契約終了" };
  const statusColor = (s) =>
    s === "active" ? "bg-violet-100 text-violet-700" :
    s === "upcoming" ? "bg-blue-100 text-blue-700" :
    "bg-slate-100 text-slate-600";

  const rows = useMemo(() => {
    return partners
      .map((p) => ({ ...p, _days: daysUntil(p.contract_end), _extStatus: extensionAlertStatus(p.contract_end) }))
      .filter((p) => {
        // 要対応フィルター: 30日以内に終了 OR 非稼働 OR 延長確認対象
        if (viewMode === "action") {
          const needsAction =
            (p._days !== null && p._days <= 30) ||
            p.status === "inactive" ||
            p._extStatus !== null;
          if (!needsAction) return false;
        }
        if (filterStatus && p.status !== filterStatus) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name?.toLowerCase().includes(q) ||
                 p.partner_company?.toLowerCase().includes(q) ||
                 p.client_company?.toLowerCase().includes(q) ||
                 p.planner?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a._days === null && b._days === null) return 0;
        if (a._days === null) return 1;
        if (b._days === null) return -1;
        return a._days - b._days;
      });
  }, [partners, search, filterStatus, viewMode]);

  // 要対応件数（バッジ用）
  const actionCount = useMemo(() => partners.filter(p => {
    const d = daysUntil(p.contract_end);
    return (d !== null && d <= 30) || p.status === "inactive" || extensionAlertStatus(p.contract_end) !== null;
  }).length, [partners]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* トグル */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("action")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "action" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fas fa-exclamation-circle text-[10px]" />
            要対応のみ
            {actionCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                viewMode === "action" ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"
              }`}>{actionCount}</span>
            )}
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "all" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            全員
          </button>
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="名前・BP会社・客先で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">すべてのステータス</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{rows.length}件</span>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-100 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">氏名</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">BP会社</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">客先</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">担当営業</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">甲単価</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">乙単価</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">粗利</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">契約終了</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">残日数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-400 text-sm">
                {viewMode === "action"
                  ? <span className="flex items-center justify-center gap-2 text-emerald-500"><i className="fas fa-check-circle text-base" />現在、対応が必要なBPエンジニアはいません</span>
                  : "該当なし"
                }
              </td></tr>
            ) : rows.map((p) => {
              const cfg = urgencyConfig(p._days);
              const gross = (p.client_unit_price && p.partner_unit_price)
                ? Number(p.client_unit_price) - Number(p.partner_unit_price)
                : null;
              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.partner_company || <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.client_company || <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.planner || <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    {p.client_unit_price ? `¥${Number(p.client_unit_price).toLocaleString()}` : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    {p.partner_unit_price ? `¥${Number(p.partner_unit_price).toLocaleString()}` : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {gross !== null ? (
                      <span className={`font-bold text-sm ${gross >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ¥{gross.toLocaleString()}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {p.contract_end
                      ? new Date(p.contract_end).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
                      : <span className="text-slate-300">未設定</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {cfg ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${cfg.badge}`}>{cfg.label}</span>
                      ) : p._days !== null ? (
                        <span className="text-xs text-slate-400">残{p._days}日</span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                      {p._extStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-0.5 ${
                          p._extStatus.daysToCheck <= 0 ? 'bg-red-400' :
                          p._extStatus.daysToCheck <= 3 ? 'bg-orange-400' : 'bg-amber-400'
                        }`}>
                          <i className="fas fa-clipboard-check text-[8px]"></i>
                          延長確認{p._extStatus.daysToCheck <= 0 ? `（${Math.abs(p._extStatus.daysToCheck)}日超過）` : `（${p._extStatus.daysToCheck}日後）`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────
export default function UtilizationDashboard() {
  const [engineers, setEngineers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [engineerTab, setEngineerTab] = useState("idr"); // "idr" | "bp"

  const fetchAll = async () => {
    try {
      const [engRes, bpRes] = await Promise.all([
        fetch(`${API_BASE}/engineers/`),
        fetch(`${API_BASE}/partner-engineers/`),
      ]);
      if (engRes.ok) setEngineers(await engRes.json());
      if (bpRes.ok) setPartners(await bpRes.json());
      setLastFetched(new Date());
    } catch (e) {
      console.error("データ取得エラー:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // ─── IDR 集計 ─────────────────────────────
  const idrStats = useMemo(() => {
    const total = engineers.length;
    const assigned = engineers.filter((e) => e.engineer_status === "アサイン済").length;
    const waiting = engineers.filter((e) => e.engineer_status === "未アサイン").length;
    const utilizationRate = total > 0 ? (assigned / total) * 100 : 0;
    const totalRevenue = engineers
      .filter(e => e.engineer_status === "アサイン済" && e.monthly_rate)
      .reduce((s, e) => s + Number(e.monthly_rate), 0);
    const idrAlerts = engineers
      .map((e) => ({ ...e, _days: daysUntil(e.project_end_date), _type: 'idr' }))
      .filter((e) => e._days !== null && e._days <= 30)
      .sort((a, b) => a._days - b._days);
    const critical = idrAlerts.filter((e) => e._days <= 14).length;
    const warning  = idrAlerts.filter((e) => e._days > 14 && e._days <= 30).length;
    return { total, assigned, waiting, utilizationRate, totalRevenue, alerts: idrAlerts, critical, warning };
  }, [engineers]);

  // ─── BP 集計 ──────────────────────────────
  const bpStats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter(p => p.status === 'active').length;
    const free = partners.filter(p => p.status === 'free').length;
    const utilizationRate = total > 0 ? (active / total) * 100 : 0;
    const totalGross = partners
      .filter(p => p.status === 'active' && p.client_unit_price && p.partner_unit_price)
      .reduce((s, p) => s + (Number(p.client_unit_price) - Number(p.partner_unit_price)), 0);
    const avgGrossRate = (() => {
      const valid = partners.filter(p => p.client_unit_price && p.partner_unit_price && Number(p.client_unit_price) > 0);
      if (!valid.length) return 0;
      const rates = valid.map(p => (Number(p.client_unit_price) - Number(p.partner_unit_price)) / Number(p.client_unit_price) * 100);
      return rates.reduce((s, r) => s + r, 0) / rates.length;
    })();
    const bpAlerts = partners
      .map((p) => ({ ...p, _days: daysUntil(p.contract_end), _type: 'bp' }))
      .filter((p) => p._days !== null && p._days <= 30)
      .sort((a, b) => a._days - b._days);
    const critical = bpAlerts.filter((p) => p._days <= 14).length;
    const warning  = bpAlerts.filter((p) => p._days > 14 && p._days <= 30).length;
    return { total, active, free, utilizationRate, totalGross, avgGrossRate, alerts: bpAlerts, critical, warning };
  }, [partners]);

  // ─── 統合アラート（IDR + BP 合算）─────────
  const combinedAlerts = useMemo(() => {
    return [...idrStats.alerts, ...bpStats.alerts].sort((a, b) => a._days - b._days);
  }, [idrStats.alerts, bpStats.alerts]);

  const combinedCritical = combinedAlerts.filter(e => e._days <= 14).length;

  // ─── 延長確認アラート（IDR + BP 合算）────
  const extensionAlerts = useMemo(() => {
    const idrItems = engineers
      .filter(e => e.project_end_date && extensionAlertStatus(e.project_end_date))
      .map(e => ({ ...e, _type: 'idr', _extStatus: extensionAlertStatus(e.project_end_date) }));
    const bpItems = partners
      .filter(p => p.contract_end && extensionAlertStatus(p.contract_end))
      .map(p => ({ ...p, _type: 'bp', _extStatus: extensionAlertStatus(p.contract_end) }));
    return [...idrItems, ...bpItems].sort((a, b) => a._extStatus.daysToCheck - b._extStatus.daysToCheck);
  }, [engineers, partners]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">データを取得中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10 overflow-auto">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-4 border-b border-white/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <i className="fas fa-user-check text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">稼働率ダッシュボード</h1>
              <p className="text-xs text-slate-400 mt-0.5">契約終了アラート付き · リアルタイム管理</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {combinedCritical > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                <i className="fas fa-exclamation-triangle"></i>
                緊急アラート {combinedCritical}件
              </div>
            )}
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <i className="fas fa-sync-alt text-[10px]"></i>
              更新
            </button>
            {lastFetched && (
              <span className="text-[11px] text-slate-400">
                最終更新: {lastFetched.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">

        {/* ─────────── 統合 契約終了アラート（IDR + BP 常時表示）─────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <i className="fas fa-bell text-orange-400"></i>
              契約終了アラート
              <span className="ml-1 text-[11px] font-normal text-slate-400">（IDR + BP · 30日以内）</span>
            </h2>
            <div className="flex items-center gap-2">
              {combinedAlerts.filter(e => e._days <= 14 && e._days >= 0).length > 0 && (
                <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full">
                  緊急 {combinedAlerts.filter(e => e._days <= 14 && e._days >= 0).length}件
                </span>
              )}
              {combinedAlerts.length > 0 && (
                <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full">
                  計{combinedAlerts.length}件
                </span>
              )}
            </div>
          </div>
          {combinedAlerts.length === 0 ? (
            <div className="text-center py-6 text-slate-300">
              <i className="fas fa-check-circle text-2xl mb-2 block text-emerald-300"></i>
              <p className="text-sm">30日以内に終了する契約はありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {combinedAlerts.map((e) => {
                const cfg = urgencyConfig(e._days);
                return cfg ? <AlertRow key={`${e._type}-${e.id}`} engineer={e} days={e._days} cfg={cfg} /> : null;
              })}
            </div>
          )}
        </div>

        {/* ─────────── 延長確認アラート ─────────── */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <i className="fas fa-clipboard-check text-amber-500"></i>
              延長確認アラート
              <span className="ml-1 text-[11px] font-normal text-slate-400">（終了1ヶ月前の週の月曜日に延長有無を確認）</span>
            </h2>
            <div className="flex items-center gap-2">
              {extensionAlerts.filter(e => e._extStatus.daysToCheck <= 0).length > 0 && (
                <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full animate-pulse">
                  要確認 {extensionAlerts.filter(e => e._extStatus.daysToCheck <= 0).length}件
                </span>
              )}
              {extensionAlerts.length > 0 && (
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full">
                  計{extensionAlerts.length}件
                </span>
              )}
            </div>
          </div>
          {extensionAlerts.length === 0 ? (
            <div className="text-center py-6 text-slate-300">
              <i className="fas fa-check-circle text-2xl mb-2 block text-emerald-300"></i>
              <p className="text-sm">現在、延長確認が必要なエンジニアはいません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {extensionAlerts.map(e => (
                <ExtensionCheckRow key={`ext-${e._type}-${e.id}`} engineer={e} />
              ))}
            </div>
          )}
        </div>

        {/* ─────────── IDR / BP タブ ─────────── */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setEngineerTab("idr")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              engineerTab === "idr" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fas fa-user-tie" />
            IDR
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              engineerTab === "idr" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
            }`}>{idrStats.total}名</span>
          </button>
          <button
            onClick={() => setEngineerTab("bp")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              engineerTab === "bp" ? "bg-white shadow-sm text-violet-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fas fa-handshake" />
            BP
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              engineerTab === "bp" ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"
            }`}>{bpStats.total}名</span>
          </button>
        </div>

        {/* ─────────── IDRタブ ─────────── */}
        {engineerTab === "idr" && <>
          {/* KPI カード */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard label="総IDR数" value={`${idrStats.total}名`}
              icon="fas fa-users" gradient="bg-slate-600" />
            <KpiCard label="稼働中" value={`${idrStats.assigned}名`} sub="アサイン済"
              icon="fas fa-user-check" gradient="bg-emerald-600" />
            <KpiCard label="待機中" value={`${idrStats.waiting}名`} sub="未アサイン"
              icon="fas fa-user-clock"
              gradient={idrStats.waiting > 0 ? "bg-amber-500" : "bg-slate-400"}
              pulse={idrStats.waiting > 0} />
            <KpiCard
              label="月売上合計"
              value={idrStats.totalRevenue >= 1000000
                ? `¥${(idrStats.totalRevenue / 1000000).toFixed(1)}M`
                : `¥${idrStats.totalRevenue.toLocaleString()}`}
              sub="稼働中エンジニア"
              icon="fas fa-yen-sign"
              gradient="bg-teal-600" />
            <KpiCard
              label="稼働率" value={`${idrStats.utilizationRate.toFixed(0)}%`}
              sub={idrStats.utilizationRate >= 80 ? "良好" : idrStats.utilizationRate >= 60 ? "要注意" : "危険水域"}
              icon="fas fa-chart-pie"
              gradient={
                idrStats.utilizationRate >= 80 ? "bg-emerald-600" :
                idrStats.utilizationRate >= 60 ? "bg-amber-500" :
                "bg-red-500"
              } />
          </div>

          {/* ゲージ + テーブル */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <i className="fas fa-chart-pie text-emerald-500"></i>稼働率
              </h2>
              <UtilizationGauge rate={idrStats.utilizationRate} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">ステータス内訳</p>
                <StatusBreakdown engineers={engineers} />
              </div>
            </div>
            <div className="lg:col-span-3">
              <EngineerTable engineers={engineers} />
            </div>
          </div>
        </>}

        {/* ─────────── BPタブ ─────────── */}
        {engineerTab === "bp" && <>
          {/* KPI カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="総BP数" value={`${bpStats.total}名`}
              icon="fas fa-handshake" gradient="bg-slate-600" />
            <KpiCard label="稼働中" value={`${bpStats.active}名`} sub="稼働中"
              icon="fas fa-user-check" gradient="bg-indigo-600" />
            <KpiCard
              label="稼働中粗利合計"
              value={bpStats.totalGross >= 1000000
                ? `¥${(bpStats.totalGross / 1000000).toFixed(1)}M`
                : `¥${bpStats.totalGross.toLocaleString()}`}
              sub="甲-乙単価合算"
              icon="fas fa-coins"
              gradient="bg-indigo-500" />
            <KpiCard
              label="平均粗利率" value={`${bpStats.avgGrossRate.toFixed(1)}%`}
              sub={bpStats.avgGrossRate >= 20 ? "良好" : bpStats.avgGrossRate >= 10 ? "要確認" : "要改善"}
              icon="fas fa-percentage"
              gradient={
                bpStats.avgGrossRate >= 20 ? "bg-indigo-600" :
                bpStats.avgGrossRate >= 10 ? "bg-amber-500" :
                "bg-red-500"
              } />
          </div>

          {/* ゲージ + テーブル */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <i className="fas fa-chart-pie text-violet-500"></i>稼働率
              </h2>
              <UtilizationGauge rate={bpStats.utilizationRate} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">ステータス内訳</p>
                <BPStatusBreakdown partners={partners} />
              </div>
            </div>
            <div className="lg:col-span-3">
              <BPTable partners={partners} />
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}
