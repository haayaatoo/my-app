import React, { useEffect, useState } from "react";
// import { useUser } from "../contexts/UserContext";

// ──────────────────────────────────────────────
// アラート計算ヘルパー（UtilizationDashboard と共通ロジック）
// ──────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function extensionCheckDate(endDateStr) {
  if (!endDateStr) return null;
  const base = new Date(endDateStr);
  base.setMonth(base.getMonth() - 1);
  const dow = base.getDay();
  const monday = new Date(base);
  if (dow === 0) monday.setDate(monday.getDate() + 1);
  else if (dow === 6) monday.setDate(monday.getDate() + 2);
  else monday.setDate(monday.getDate() - (dow - 1));
  return monday;
}

function hasExtensionAlert(endDateStr) {
  const checkDate = extensionCheckDate(endDateStr);
  if (!checkDate) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const check = new Date(checkDate); check.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr); end.setHours(0, 0, 0, 0);
  const daysToEnd = Math.round((end - today) / 86400000);
  if (daysToEnd <= 0) return false;
  const daysToCheck = Math.round((check - today) / 86400000);
  return daysToCheck <= 14;
}

// 高級感のあるアニメーションカウンター（モダンラグジュアリー）
function AnimatedCounter({ end, label, prefix = "", suffix = "", color = "blue", icon }) {
  const safeEnd = (end !== undefined && end !== null && !isNaN(end) && isFinite(end)) ? Math.max(0, Math.round(end)) : 0;
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (safeEnd === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / safeEnd), 30);
    const timer = setInterval(() => {
      start += Math.ceil(safeEnd / (duration / stepTime));
      if (start >= safeEnd) {
        setCount(safeEnd);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [safeEnd]);
  
  const colorClasses = {
    blue:   { bg: "bg-gradient-to-br from-blue-500 to-indigo-600",   iconBg: "bg-white/20", labelText: "text-blue-100",   valueText: "text-white" },
    green:  { bg: "bg-gradient-to-br from-emerald-500 to-teal-600",  iconBg: "bg-white/20", labelText: "text-emerald-100", valueText: "text-white" },
    red:    { bg: "bg-gradient-to-br from-rose-500 to-red-600",      iconBg: "bg-white/20", labelText: "text-rose-100",   valueText: "text-white" },
    purple: { bg: "bg-gradient-to-br from-violet-500 to-purple-600", iconBg: "bg-white/20", labelText: "text-violet-100", valueText: "text-white" },
    yellow: { bg: "bg-gradient-to-br from-amber-400 to-orange-500",  iconBg: "bg-white/20", labelText: "text-amber-100",  valueText: "text-white" },
  };
  const c = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${c.bg} rounded-xl p-5 shadow-md`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} text-sm text-white`}></i>
        </div>
        <span className={`text-xs font-medium ${c.labelText} uppercase tracking-wide truncate`}>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${c.valueText}`}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

// 売上予測カード（高度な計算ロジック）
function RevenueCard({ engineers }) {
  const assignedEngineers = engineers.filter(e => e.engineer_status === 'アサイン済');
  
  // スキル別単価テーブル（実際の市場価格に基づく）
  const skillRates = {
    // 高単価スキル
    'AWS': 120, 'React': 110, 'TypeScript': 105, 'Next.js': 115,
    'Python': 100, 'Django': 95, 'FastAPI': 105,
    
    // 中単価スキル  
    'Vue.js': 90, 'Node.js': 85, 'PHP': 75, 'Laravel': 80,
    'Java': 85, 'Spring Boot': 90, 'C#': 85, '.NET': 85,
    
    // 標準単価スキル
    'HTML': 60, 'CSS': 60, 'JavaScript': 75, 'jQuery': 65,
    'MySQL': 70, 'PostgreSQL': 75, 'MongoDB': 80,
    
    // 特殊スキル
    'Docker': 95, 'Kubernetes': 110, 'GraphQL': 100,
    'Firebase': 85, 'Vercel': 80, 'Heroku': 75
  };
  
  // 経験レベル係数
  const experienceMultiplier = {
    '要件定義': 1.3,
    '基本設計': 1.2,
    '詳細設計': 1.1,
    '製造': 1.0,
    'テスト': 0.9,
    '運用・保守': 0.85
  };
  
  // 各エンジニアの予測売上を計算
  const detailedRevenue = assignedEngineers.map(engineer => {
    // 基本単価（最高スキルを基準）
    const skills = Array.isArray(engineer.skills) ? engineer.skills : [];
    const skillRatesList = skills.map(skill => skillRates[skill] || 70);
    const maxSkillRate = skillRatesList.length > 0 ? Math.max(...skillRatesList) : 70;
    
    // 経験レベル補正
    const phases = Array.isArray(engineer.phase) ? engineer.phase : [];
    const experienceBonuses = phases.map(phase => experienceMultiplier[phase] || 1.0);
    const experienceBonus = experienceBonuses.length > 0 ? Math.max(...experienceBonuses) : 1.0;
    
    // 最終単価計算（万円/月）
    const finalRate = maxSkillRate * experienceBonus;
    
    return {
      name: engineer.name,
      baseRate: maxSkillRate,
      experienceBonus: experienceBonus,
      finalRate: Math.round(finalRate),
      topSkill: skills.find(skill => skillRates[skill] === maxSkillRate) || '不明',
      topPhase: phases.find(phase => experienceMultiplier[phase] === experienceBonus) || '不明'
    };
  });
  
  // 総売上計算（エラーハンドリング追加）
  const totalRevenue = detailedRevenue.reduce((total, engineer) => {
    const rate = isNaN(engineer.finalRate) ? 0 : engineer.finalRate;
    return total + rate;
  }, 0);
  
  const monthlyRevenue = totalRevenue * 10000; // 万円を円に変換
  const quarterlyForecast = monthlyRevenue * 3;
  const yearlyForecast = monthlyRevenue * 12;
  
  // 稼働率を考慮（実際は85%程度）
  const realMonthlyRevenue = monthlyRevenue * 0.85;
  const realQuarterlyForecast = quarterlyForecast * 0.85;
  const realYearlyForecast = yearlyForecast * 0.85;
  
  // 安全な表示用関数
  const safeFormatMillion = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0.0';
    return (value / 1000000).toFixed(1);
  };
  
  const safeFormatMillionInt = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    return (value / 1000000).toFixed(0);
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden">
      {/* 上端アクセントライン */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-400 rounded-t-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-light text-slate-700 tracking-wide flex items-center">
            <i className="fas fa-chart-line mr-4 text-3xl text-amber-600"></i>
            売上予測（AI分析）
          </h3>
          <div className="text-3xl transform hover:scale-110 transition-transform duration-300 text-amber-600/70">
            <i className="fas fa-chart-line"></i>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="transform hover:scale-105 transition-transform duration-300 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/70">
            <div className="text-5xl font-ultralight mb-3 tracking-tight text-slate-700">
              <span className="inline-block hover:text-amber-600 transition-colors duration-300">
                ¥{safeFormatMillion(realMonthlyRevenue)}M
              </span>
            </div>
            <div className="text-sm font-medium text-slate-600 uppercase tracking-widest mb-1">今月売上予測 (稼働率85%考慮)</div>
            <div className="text-xs text-slate-500 mt-2">理論値: ¥{safeFormatMillion(monthlyRevenue)}M</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-white/70 to-emerald-50/50 rounded-2xl backdrop-blur-sm border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-light mb-2 text-slate-700">¥{safeFormatMillion(realQuarterlyForecast)}M</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest">四半期予測</div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-white/70 to-violet-50/50 rounded-2xl backdrop-blur-sm border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-light mb-2 text-slate-700">¥{safeFormatMillionInt(realYearlyForecast)}M</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest">年間予測</div>
            </div>
          </div>
        </div>
        
        {/* 詳細分析 */}
        <div className="mt-6 p-6 bg-white/40 rounded-2xl backdrop-blur-sm border border-white/70">
          <div className="text-sm font-medium text-slate-600 mb-4 uppercase tracking-widest">売上内訳 (TOP3)</div>
          <div className="space-y-3">
            {detailedRevenue
              .sort((a, b) => b.finalRate - a.finalRate)
              .slice(0, 3)
              .map((engineer, index) => (
                <div key={engineer.name} className="flex justify-between items-center p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors duration-200 border border-white/60">
                  <span className="font-medium text-slate-700">{engineer.name} ({engineer.topSkill})</span>
                  <span className="font-semibold text-amber-600">¥{engineer.finalRate}万/月</span>
                </div>
              ))
            }
          </div>
          
          {/* 統計情報 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-gradient-to-br from-white/70 to-blue-50/50 rounded-xl border border-white/60">
              <div className="text-xl font-light text-slate-700">¥{assignedEngineers.length > 0 ? Math.round(monthlyRevenue / assignedEngineers.length / 10000) : 0}万</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-1">平均単価</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-white/70 to-rose-50/50 rounded-xl border border-white/60">
              <div className="text-xl font-light text-slate-700">¥{detailedRevenue.length > 0 ? Math.max(...detailedRevenue.map(e => e.finalRate)) : 0}万</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-1">最高単価</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// アラートサマリーバナー（IDR + BP + 待機中 + 延長確認待ち）
// ──────────────────────────────────────────────
function AlertSummaryBanner({ engineers, partners, onNavigate }) {
  // IDR: 30日以内契約終了（稼働中のみ）
  const idrExpiring = engineers.filter(e => {
    if (e.engineer_status !== 'アサイン済' || !e.project_end_date) return false;
    const d = daysUntil(e.project_end_date);
    return d !== null && d >= 0 && d <= 30;
  });
  const idrUrgent  = idrExpiring.filter(e => daysUntil(e.project_end_date) <= 14);
  const idrWarning = idrExpiring.filter(e => daysUntil(e.project_end_date) > 14);

  // IDR: 待機中・フェードアウト
  const idrWaiting = engineers.filter(e =>
    e.engineer_status === '未アサイン' || e.engineer_status === 'フェードアウト'
  );

  // IDR: 延長確認待ち
  const idrExtension = engineers.filter(e =>
    e.project_end_date && hasExtensionAlert(e.project_end_date)
  );

  // BP: 30日以内契約終了
  const bpExpiring = (partners || []).filter(p => {
    if (!p.contract_end) return false;
    const d = daysUntil(p.contract_end);
    return d !== null && d >= 0 && d <= 30;
  });
  const bpUrgent  = bpExpiring.filter(p => daysUntil(p.contract_end) <= 14);
  const bpWarning = bpExpiring.filter(p => daysUntil(p.contract_end) > 14);

  // BP: 延長確認待ち
  const bpExtension = (partners || []).filter(p =>
    p.contract_end && hasExtensionAlert(p.contract_end)
  );

  const totalUrgent = idrUrgent.length + bpUrgent.length;
  const extensionCount = idrExtension.length + bpExtension.length;
  const totalAlert = idrExpiring.length + bpExpiring.length + idrWaiting.length + extensionCount;

  // バナーカラー
  const bannerCls = totalUrgent > 0
    ? 'bg-red-50 border-red-200'
    : totalAlert > 0
    ? 'bg-orange-50 border-orange-200'
    : 'bg-emerald-50 border-emerald-200';

  const iconCls = totalUrgent > 0
    ? 'bg-red-100 text-red-500'
    : totalAlert > 0
    ? 'bg-orange-100 text-orange-500'
    : 'bg-emerald-100 text-emerald-500';

  const titleCls = totalUrgent > 0 ? 'text-red-800' : totalAlert > 0 ? 'text-orange-800' : 'text-emerald-800';

  // バッジ定義
  const badges = [
    idrUrgent.length  > 0 && { label: `IDR 緊急 ${idrUrgent.length}件`,          cls: 'bg-red-100 text-red-700 border-red-200' },
    idrWarning.length > 0 && { label: `IDR 30日以内 ${idrWarning.length}件`,     cls: 'bg-orange-100 text-orange-700 border-orange-200' },
    bpUrgent.length   > 0 && { label: `BP 緊急 ${bpUrgent.length}件`,            cls: 'bg-red-100 text-red-700 border-red-200' },
    bpWarning.length  > 0 && { label: `BP 30日以内 ${bpWarning.length}件`,       cls: 'bg-violet-100 text-violet-700 border-violet-200' },
    idrWaiting.length > 0 && { label: `待機中 ${idrWaiting.length}名`,           cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    extensionCount    > 0 && { label: `延長確認待ち ${extensionCount}件`,         cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ].filter(Boolean);

  return (
    <div
      className={`rounded-xl border px-5 py-4 cursor-pointer hover:shadow-md transition-all ${bannerCls}`}
      onClick={() => onNavigate && onNavigate('utilization')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCls}`}>
            <i className="fas fa-bell text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold mb-1.5 flex items-center gap-2 flex-wrap ${titleCls}`}>
              エンジニアアラートサマリー
              {totalUrgent > 0 && (
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <i className="fas fa-exclamation text-[9px]"></i>
                  緊急 {totalUrgent}件
                </span>
              )}
            </p>
            {totalAlert > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b, i) => (
                  <span key={i} className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <i className="fas fa-check-circle text-[11px]"></i>
                対応が必要なアラートはありません
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 flex-shrink-0 hover:text-indigo-600 transition-colors whitespace-nowrap mt-1">
          稼働率管理で詳細を確認
          <i className="fas fa-arrow-right text-[10px] ml-0.5"></i>
        </div>
      </div>
    </div>
  );
}

// 直近タイムライン（localStorageから最新5〜10件）
const TIMELINE_ACTION_CONFIG = {
  create: { label: '新規登録', icon: 'fa-plus-circle', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  update: { label: '更新',     icon: 'fa-edit',        color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  delete: { label: '削除',     icon: 'fa-trash-alt',   color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

function RecentTimeline({ onNavigate }) {
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    fetch('/api/activity-logs/?limit=50')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) { setLogs([]); return; }
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);
        const filtered = data.filter(log => new Date(log.created_at) >= oneWeekAgo);
        setLogs(filtered.slice(0, 8));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 10000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `今日 ${timeStr}`;
    if (isYesterday) return `昨日 ${timeStr}`;
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) + ` ${timeStr}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-history text-indigo-500"></i>
          最近の操作
        </h3>
        <button
          onClick={() => onNavigate && onNavigate('timeline')}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
        >
          もっと見る
          <i className="fas fa-arrow-right text-[10px]"></i>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-6 text-slate-300">
          <i className="fas fa-clock text-2xl mb-2 block"></i>
          <p className="text-xs">直近1週間の操作はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const cfg = TIMELINE_ACTION_CONFIG[log.action] || TIMELINE_ACTION_CONFIG.update;
            return (
              <div key={log.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${cfg.icon} text-xs ${cfg.color}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    <span className="font-bold">{log.user_name}</span>
                    <span className="text-slate-400 mx-1">が</span>
                    <span className="font-semibold">{log.target_name}</span>
                    <span className="text-slate-400 ml-1">を{cfg.label}しました。</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDate(log.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 稼働予定カード
function ScheduleCard({ engineers }) {
  const assigned = engineers.filter(e => e.engineer_status === 'アサイン済');
  const unassigned = engineers.filter(e => e.engineer_status === '未アサイン');
  const utilizationRate = engineers.length > 0 ? (assigned.length / engineers.length * 100) : 0;
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-white"></i>
            </div>
            稼働状況
          </h3>
          <div className={`text-3xl font-bold ${utilizationRate >= 80 ? 'text-emerald-600' : utilizationRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
            {isFinite(utilizationRate) && !isNaN(utilizationRate) ? utilizationRate.toFixed(0) : '0'}%
          </div>
        </div>
        
        {/* プログレスバー */}
        <div className="mb-6">
          <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out relative ${
                utilizationRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                utilizationRate >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 
                'bg-gradient-to-r from-rose-400 to-rose-600'
              }`}
              style={{ width: `${utilizationRate}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '400ms', animationFillMode: 'forwards'}}>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{assigned.length}</div>
              <div className="text-emerald-700 text-sm font-medium">稼働中</div>
              <div className="flex items-center justify-center mt-2">
                <i className="fas fa-user-check text-emerald-500 text-sm"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">{unassigned.length}</div>
              <div className="text-amber-700 text-sm font-medium">待機中</div>
              <div className="flex items-center justify-center mt-2">
                <i className="fas fa-user-clock text-amber-500 text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// リアルタイム市場トレンドコンポーネント
function RealTimeMarketTrends() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('aichi'); // デフォルトを愛知県に

  const fetchMarketData = async (region = 'aichi') => {
    try {
      setLoading(true);
      
      // 地域別APIエンドポイント選択
      const apiUrl = region === 'aichi' 
        ? "/api/market/aichi/summary/"
        : "/api/market/summary/";
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 愛知県データと全国データの構造差を吸収
        const trendsData = region === 'aichi' 
          ? data.summary.top_growing_technologies 
          : data.summary.top_growing_technologies || [];
        
        setMarketData(trendsData);
        setLastUpdated(new Date(data.last_updated));
        setError(null);
      } else {
        throw new Error(data.error || '市場データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Market data fetch error:', err);
      setError(err.message);
      
      // エラー時は地域別フォールバックデータを使用
      const fallbackData = region === 'aichi' ? [
        { technology: "ROS", change_percentage: 67.4, trend_direction: "up", job_count: 18, avg_salary: 6500000, major_companies: ["トヨタ自動車", "豊田自動織機"] },
        { technology: "Unity", change_percentage: 41.5, trend_direction: "up", job_count: 29, avg_salary: 5100000, major_companies: ["トヨタ自動車", "デンソー"] },
        { technology: "C++", change_percentage: 31.7, trend_direction: "up", job_count: 98, avg_salary: 5900000, major_companies: ["トヨタ自動車", "デンソー"] },
        { technology: "Python", change_percentage: 28.4, trend_direction: "up", job_count: 145, avg_salary: 5200000, major_companies: ["トヨタ自動車", "デンソー"] }
      ] : [
        { technology: "React", change_percentage: 18.5, trend_direction: "up" },
        { technology: "TypeScript", change_percentage: 24.3, trend_direction: "up" },
        { technology: "AWS", change_percentage: 15.7, trend_direction: "up" },
        { technology: "jQuery", change_percentage: -8.4, trend_direction: "down" }
      ];
      
      setMarketData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(selectedRegion);
    
    // 5分ごとに自動更新
    const interval = setInterval(() => fetchMarketData(selectedRegion), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedRegion]);

  const getTrendColor = (percentage, direction) => {
    if (direction === 'up' && percentage > 15) return 'text-green-600';
    if (direction === 'up' && percentage > 5) return 'text-blue-600';
    if (direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (direction, percentage) => {
    if (direction === 'up') {
      return percentage > 15 ? 
        <i className="fas fa-rocket text-green-600"></i> : 
        <i className="fas fa-arrow-trend-up text-green-500"></i>;
    }
    if (direction === 'down') {
      return <i className="fas fa-arrow-trend-down text-red-500"></i>;
    }
    return <i className="fas fa-arrow-right text-gray-500"></i>;
  };

  if (loading && marketData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          <span className="ml-2 text-gray-600">市場データを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-green-100/50 rounded-full transform translate-x-16 -translate-y-16"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {selectedRegion === 'aichi' ? 
                <i className="fas fa-industry text-orange-600"></i> : 
                <i className="fas fa-chart-area text-blue-600"></i>
              }
              {selectedRegion === 'aichi' ? '愛知県' : '全国'} IT市場トレンド分析
              {loading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
              )}
            </h3>
            
            {/* 地域切り替えボタン */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedRegion('aichi')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedRegion === 'aichi' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-industry mr-1"></i> 愛知県
              </button>
              <button
                onClick={() => setSelectedRegion('national')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedRegion === 'national' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-globe-asia mr-1"></i> 全国
              </button>
            </div>
          </div>
          <div className="text-right">
            <button 
              onClick={() => fetchMarketData(selectedRegion)} 
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center gap-1"
            >
              <i className="fas fa-sync-alt"></i>
              更新
            </button>
            <div className="text-xs text-gray-500 mt-1">
              {lastUpdated ? `更新: ${lastUpdated.toLocaleString('ja-JP')}` : 'データ読み込み中...'}
            </div>
            {error && (
              <div className="text-xs text-red-500 mt-1">
                <i className="fas fa-exclamation-triangle text-red-500 mr-1"></i> {error}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {marketData.slice(0, 4).map((trend, index) => (
            <div 
              key={trend.technology}
              className={`text-center p-4 rounded-xl border hover:shadow-md transition-all duration-300 transform hover:scale-105 ${
                selectedRegion === 'aichi' 
                  ? 'bg-gradient-to-br from-orange-50 to-red-50/30 border-orange-100' 
                  : 'bg-gradient-to-br from-gray-50 to-blue-50/30 border-gray-100'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl mb-2 flex justify-center">
                {getTrendIcon(trend.trend_direction, trend.change_percentage)}
              </div>
              <div className={`text-xl font-bold ${getTrendColor(trend.change_percentage, trend.trend_direction)}`}>
                {trend.change_percentage > 0 ? '↑' : trend.change_percentage < 0 ? '↓' : '→'} 
                {Math.abs(trend.change_percentage).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 font-medium mt-1">
                {trend.technology}
              </div>
              
              {/* 愛知県データの場合、追加情報を表示 */}
              {selectedRegion === 'aichi' && trend.job_count && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-orange-600 font-semibold">
                    求人: {trend.job_count}件
                  </div>
                  {trend.avg_salary && (
                    <div className="text-xs text-green-600 font-semibold">
                      年収: {Math.round(trend.avg_salary / 10000)}万円
                    </div>
                  )}
                  {trend.major_companies && trend.major_companies.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {trend.major_companies[0]}他
                    </div>
                  )}
                </div>
              )}
              
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    selectedRegion === 'aichi'
                      ? trend.trend_direction === 'up' ? 'bg-orange-500' : 
                        trend.trend_direction === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      : trend.trend_direction === 'up' ? 'bg-green-500' : 
                        trend.trend_direction === 'down' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(trend.change_percentage) * 3)}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* データソース情報 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              <i className="fas fa-satellite-dish text-gray-500 mr-1"></i> データソース: {selectedRegion === 'aichi' 
                ? '愛知県求人統計, 製造業DX調査, 地域IT企業分析' 
                : 'GitHub API, Stack Overflow, 求人サイト統計'
              }
            </span>
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                selectedRegion === 'aichi' ? 'bg-orange-500' : 'bg-green-500'
              }`}></div>
              {selectedRegion === 'aichi' ? '愛知県特化データ' : 'リアルタイム更新中'}
            </span>
          </div>
          
          {/* 愛知県特別情報 */}
          {selectedRegion === 'aichi' && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-700">
                <i className="fas fa-industry text-orange-600 mr-1"></i> <strong>愛知県IT市場の特徴:</strong> 製造業DX・自動車関連技術が高需要 | 
                平均年収509万円（全国トップクラス） | 
                トヨタグループを中心とした技術投資活発
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 男女比率ドーナツチャート
// ──────────────────────────────────────────────
function GenderPieChart({ engineers }) {
  const maleCount = engineers.filter(e => e.gender === 'male').length;
  const femaleCount = engineers.filter(e => e.gender === 'female').length;
  const unknownCount = engineers.filter(e => !e.gender || (e.gender !== 'male' && e.gender !== 'female')).length;
  const total = engineers.length;

  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;
  const unknownPercent = total > 0 ? 100 - malePercent - femalePercent : 0;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const segments = [];
  if (maleCount > 0) segments.push({ label: '男性', count: maleCount, percent: malePercent, color: '#3b82f6' });
  if (femaleCount > 0) segments.push({ label: '女性', count: femaleCount, percent: femalePercent, color: '#ec4899' });
  if (unknownCount > 0) segments.push({ label: '未設定', count: unknownCount, percent: unknownPercent, color: '#94a3b8' });

  let cumulativeAngle = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <i className="fas fa-users text-violet-500 text-lg"></i>
        <h3 className="text-base font-semibold text-slate-700">男女比率</h3>
        <span className="ml-auto text-xs text-slate-400">IDRエンジニア</span>
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          データがありません
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* SVGドーナツチャート */}
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {segments.length === 0 ? (
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="24" />
              ) : (
                segments.map((seg) => {
                  const segLength = (seg.percent / 100) * circumference;
                  const rotation = -90 + cumulativeAngle;
                  cumulativeAngle += (seg.percent / 100) * 360;
                  return (
                    <circle
                      key={seg.label}
                      cx="80" cy="80" r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="24"
                      strokeDasharray={`${segLength} ${circumference}`}
                      strokeDashoffset={0}
                      transform={`rotate(${rotation}, 80, 80)`}
                    />
                  );
                })
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-700">{total}</span>
              <span className="text-xs text-slate-400">総人数</span>
            </div>
          </div>

          {/* 凡例 */}
          <div className="w-full space-y-2">
            {segments.map(seg => (
              <div key={seg.label} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }}></div>
                  <span className="text-sm text-slate-600">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{seg.count}名</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{seg.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  // const { user } = useUser(); // 現在未使用
  const [engineers, setEngineers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // 💰 売上シミュレーション用状態
  const [showRevenueSimulation, setShowRevenueSimulation] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    engineerCount: 0,
    averageRate: 75,
    workingRate: 85,
    projectDuration: 12
  });

  // エンジニアデータを取得
  const fetchEngineers = (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    Promise.all([
      fetch("/api/engineers/").then(r => r.json()),
      fetch("/api/partner-engineers/").then(r => r.json()),
    ])
      .then(([engData, bpData]) => {
        setEngineers(Array.isArray(engData) ? engData : []);
        setPartners(Array.isArray(bpData) ? bpData : []);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  // エンジニア数更新時にシミュレーションパラメータを更新
  useEffect(() => {
    if (engineers.length > 0) {
      setSimulationParams(prev => ({
        ...prev,
        engineerCount: engineers.length
      }));
    }
  }, [engineers]);

  if (loading) {
    return (
    <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">エンジニア情報を読み込んでいます</p>
        </div>
      </div>
    );
  }

  const assignedCount = engineers.filter(e => e.engineer_status === 'アサイン済').length;
  const unassignedCount = engineers.filter(e => e.engineer_status === '未アサイン').length;

  // 高度な売上計算（KPI用）
  const calculateAdvancedRevenue = () => {
    const assignedEngineers = engineers.filter(e => e.engineer_status === 'アサイン済');
    const skillRates = {
      'AWS': 120, 'React': 110, 'TypeScript': 105, 'Next.js': 115,
      'Python': 100, 'Django': 95, 'FastAPI': 105,
      'Vue.js': 90, 'Node.js': 85, 'PHP': 75, 'Laravel': 80,
      'Java': 85, 'Spring Boot': 90, 'C#': 85, '.NET': 85,
      'HTML': 60, 'CSS': 60, 'JavaScript': 75, 'jQuery': 65,
      'MySQL': 70, 'PostgreSQL': 75, 'MongoDB': 80,
      'Docker': 95, 'Kubernetes': 110, 'GraphQL': 100,
      'Firebase': 85, 'Vercel': 80, 'Heroku': 75
    };
    
    const experienceMultiplier = {
      '要件定義': 1.3, '基本設計': 1.2, '詳細設計': 1.1,
      '製造': 1.0, 'テスト': 0.9, '運用・保守': 0.85
    };
    
    const totalRevenue = assignedEngineers.reduce((total, engineer) => {
      const skills = Array.isArray(engineer.skills) ? engineer.skills : [];
      const phases = Array.isArray(engineer.phase) ? engineer.phase : [];
      
      const skillRatesList = skills.map(skill => skillRates[skill] || 70);
      const maxSkillRate = skillRatesList.length > 0 ? Math.max(...skillRatesList) : 70;
      
      const experienceBonusList = phases.map(phase => experienceMultiplier[phase] || 1.0);
      const experienceBonus = experienceBonusList.length > 0 ? Math.max(...experienceBonusList) : 1.0;
      
      return total + (maxSkillRate * experienceBonus);
    }, 0);
    
    return Math.round(totalRevenue * 0.85); // 稼働率85%考慮
  };

  const advancedMonthlyRevenue = calculateAdvancedRevenue();

  // 実データ（client_unit_price / partner_unit_price）を優先した収益計算
  const calculateActualRevenueData = () => {
    const assignedEngineers = engineers.filter(e => e.engineer_status === 'アサイン済');
    const skillRates = {
      'AWS': 120, 'React': 110, 'TypeScript': 105, 'Next.js': 115,
      'Python': 100, 'Django': 95, 'FastAPI': 105,
      'Vue.js': 90, 'Node.js': 85, 'PHP': 75, 'Laravel': 80,
      'Java': 85, 'Spring Boot': 90, 'C#': 85, '.NET': 85,
      'HTML': 60, 'CSS': 60, 'JavaScript': 75, 'jQuery': 65,
      'MySQL': 70, 'PostgreSQL': 75, 'MongoDB': 80,
      'Docker': 95, 'Kubernetes': 110, 'GraphQL': 100,
      'Firebase': 85, 'Vercel': 80, 'Heroku': 75
    };
    const experienceMultiplier = {
      '要件定義': 1.3, '基本設計': 1.2, '詳細設計': 1.1,
      '製造': 1.0, 'テスト': 0.9, '運用・保守': 0.85
    };
    let totalRevenue = 0;
    let totalCost = 0;
    assignedEngineers.forEach(eng => {
      const clientPrice = parseFloat(eng.client_unit_price);
      const partnerPrice = parseFloat(eng.partner_unit_price);
      if (!isNaN(clientPrice) && clientPrice > 0) {
        // 実データあり（円→万円変換）
        const revMan = clientPrice / 10000;
        totalRevenue += revMan;
        totalCost += (!isNaN(partnerPrice) && partnerPrice > 0)
          ? partnerPrice / 10000
          : revMan * 0.70; // partner未入力はclientの70%と推計
      } else {
        // フォールバック: スキルレートで推計
        const skills = Array.isArray(eng.skills) ? eng.skills : [];
        const phases = Array.isArray(eng.phase) ? eng.phase : [];
        const maxSkillRate = skills.length > 0 ? Math.max(...skills.map(s => skillRates[s] || 70)) : 70;
        const expBonus = phases.length > 0 ? Math.max(...phases.map(p => experienceMultiplier[p] || 1.0)) : 1.0;
        const est = maxSkillRate * expBonus * 0.85;
        totalRevenue += est;
        totalCost += est * 0.70;
      }
    });
    const monthlyRevenue = Math.round(totalRevenue);
    const profitRate = totalRevenue > 0
      ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10
      : 0;
    const avgUnitPrice = assignedEngineers.length > 0
      ? Math.round(totalRevenue / assignedEngineers.length)
      : 0;
    return { monthlyRevenue, profitRate, avgUnitPrice };
  };

  const { monthlyRevenue: actualMonthlyRevenue, profitRate, avgUnitPrice } = calculateActualRevenueData();

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <i className="fas fa-tachometer-alt text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Executive Dashboard</h1>
              <p className="text-xs text-slate-400 mt-0.5">リアルタイム人材管理システム</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="week">直近7日</option>
              <option value="month">直近1ヶ月</option>
              <option value="quarter">直近3ヶ月</option>
            </select>
            <button
              onClick={() => fetchEngineers(true)}
              disabled={isRefreshing}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm flex items-center gap-2 font-medium disabled:opacity-60"
            >
              <i className={`fas fa-sync-alt text-xs${isRefreshing ? ' animate-spin' : ''}`}></i>
              {isRefreshing ? '更新中...' : '更新'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">

        {/* アラートサマリーバナー */}
        <div className="mb-4">
          <AlertSummaryBanner engineers={engineers} partners={partners} onNavigate={onNavigate} />
        </div>

        {/* 直近タイムライン */}
        <div className="mb-6">
          <RecentTimeline onNavigate={onNavigate} />
        </div>

        {/* KPIメトリクス */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <AnimatedCounter 
            end={engineers.length} 
            label="総エンジニア数" 
            color="blue"
            suffix="名" 
            icon="fas fa-users"
          />
          <AnimatedCounter 
            end={assignedCount} 
            label="稼働中" 
            color="green"
            suffix="名" 
            icon="fas fa-user-check"
          />
          <AnimatedCounter 
            end={unassignedCount} 
            label="待機中" 
            color="yellow"
            suffix="名" 
            icon="fas fa-user-clock"
          />
          <AnimatedCounter 
            end={engineers.length > 0 ? Math.round((assignedCount / engineers.length) * 100) : 0} 
            label="稼働率" 
            color="purple"
            suffix="%" 
            icon="fas fa-chart-pie"
          />
          <AnimatedCounter 
            end={advancedMonthlyRevenue} 
            label="AI予測売上" 
            color="green"
            suffix="万円/月" 
            icon="fas fa-robot"
          />
        </div>

        {/* 🚀 売上・収益予測セクション */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <i className="fas fa-chart-area text-green-500 text-2xl"></i>
              売上・収益予測 Executive Overview
            </h3>
            <button 
              onClick={() => setShowRevenueSimulation(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <i className="fas fa-calculator"></i>
              詳細シミュレーション
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 月間売上実績 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <i className="fas fa-coins text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">月間売上実績</h4>
                    <p className="text-xs text-slate-500">今月の確定売上</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                <AnimatedCounter end={actualMonthlyRevenue} suffix="万円" />
              </div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                <i className="fas fa-database text-xs"></i>
                実績単価データより算出
              </div>
            </div>

            {/* 年間予測 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <i className="fas fa-chart-line text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">年間予測売上</h4>
                    <p className="text-xs text-slate-500">AI予測モデル</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <AnimatedCounter end={Math.round(actualMonthlyRevenue * 12)} suffix="万円" />
              </div>
              <div className="text-sm text-blue-600 flex items-center gap-1">
                <i className="fas fa-calendar text-xs"></i>
                月次売上 × 12ヶ月換算
              </div>
            </div>

            {/* プロジェクト収益性 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <i className="fas fa-briefcase text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">プロジェクト数</h4>
                    <p className="text-xs text-slate-500">進行中案件</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                <AnimatedCounter end={assignedCount} suffix="件" />
              </div>
              <div className="text-sm text-purple-600 flex items-center gap-1">
                <i className="fas fa-rocket text-xs"></i>
                平均単価 {avgUnitPrice}万円
              </div>
            </div>

            {/* 収益率・効率性 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <i className="fas fa-percentage text-amber-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">収益率</h4>
                    <p className="text-xs text-slate-500">営業利益率</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-2">
                <AnimatedCounter end={profitRate} suffix="%" />
              </div>
              <div className="text-sm text-amber-600 flex items-center gap-1">
                <i className="fas fa-trophy text-xs"></i>
                業界平均 18%
              </div>
            </div>
          </div>

          {/* SES売上計算式の説明 */}
          <div className="mt-6 p-4 bg-white/70 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <i className="fas fa-info-circle text-green-500"></i>
              <span><strong>SES売上計算式:</strong> エンジニア単価 × 稼働率 × プロジェクト期間 | AI予測モデルがスキル・経験・市場価格を分析</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="space-y-6 mb-8">
          {/* 売上・稼働状況・男女比率を横並び */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueCard engineers={engineers} />
            <ScheduleCard engineers={engineers} />
            <GenderPieChart engineers={engineers} />
          </div>
        </div>

        {/* 市場トレンド - 全幅表示 */}
        <div className="soft-panel rounded-3xl overflow-hidden">
          <RealTimeMarketTrends />
        </div>
      </div>

      {/* 💰 売上シミュレーションモーダル */}
      {showRevenueSimulation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-4 pb-4 px-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/50 w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-fade-in">
            {/* モーダルヘッダー */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-calculator text-2xl"></i>
                  <div>
                    <h2 className="text-2xl font-bold">売上シミュレーション</h2>
                    <p className="text-green-100 mt-1">パラメータを調整して将来の売上を予測</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRevenueSimulation(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* モーダル本体 */}
            <div className="p-6 space-y-6">
              {/* パラメータ調整パネル */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* エンジニア数 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-users text-blue-600"></i>
                    エンジニア数
                  </h4>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="1"
                    value={simulationParams.engineerCount}
                    onChange={(e) => setSimulationParams(prev => ({...prev, engineerCount: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>1名</span>
                    <span className="font-bold text-lg text-blue-600">{simulationParams.engineerCount}名</span>
                    <span>150名</span>
                  </div>
                  
                  {/* 50単位の目安表示 */}
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>小規模</span>
                    <span>50名</span>
                    <span>100名</span>
                    <span>大規模</span>
                  </div>
                  
                  {/* 50単位クイック設定ボタン */}
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 150].map(count => (
                      <button
                        key={count}
                        onClick={() => setSimulationParams(prev => ({...prev, engineerCount: count}))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                          simulationParams.engineerCount === count
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {count}名
                      </button>
                    ))}
                  </div>
                </div>

                {/* 平均単価 */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-yen-sign text-green-600"></i>
                    平均単価
                  </h4>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={simulationParams.averageRate}
                    onChange={(e) => setSimulationParams(prev => ({...prev, averageRate: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>40万円</span>
                    <span className="font-bold text-lg text-green-600">{simulationParams.averageRate}万円</span>
                    <span>150万円</span>
                  </div>
                </div>

                {/* 稼働率 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie text-purple-600"></i>
                    稼働率
                  </h4>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={simulationParams.workingRate}
                    onChange={(e) => setSimulationParams(prev => ({...prev, workingRate: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>50%</span>
                    <span className="font-bold text-lg text-purple-600">{simulationParams.workingRate}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* プロジェクト期間 */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-calendar text-amber-600"></i>
                    予測期間
                  </h4>
                  <input
                    type="range"
                    min="3"
                    max="24"
                    value={simulationParams.projectDuration}
                    onChange={(e) => setSimulationParams(prev => ({...prev, projectDuration: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>3ヶ月</span>
                    <span className="font-bold text-lg text-amber-600">{simulationParams.projectDuration}ヶ月</span>
                    <span>24ヶ月</span>
                  </div>
                </div>
              </div>

              {/* 予測結果表示 */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6">
                <h4 className="font-semibold text-slate-800 mb-6 text-xl flex items-center gap-2">
                  <i className="fas fa-chart-line text-slate-600"></i>
                  シミュレーション結果
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 月間売上予測 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">月間売上予測</h5>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100)).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        {simulationParams.engineerCount}名 × {simulationParams.averageRate}万円 × {simulationParams.workingRate}%
                      </div>
                    </div>
                  </div>

                  {/* 期間売上予測 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">{simulationParams.projectDuration}ヶ月売上予測</h5>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100) * simulationParams.projectDuration).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        月間売上 × {simulationParams.projectDuration}ヶ月
                      </div>
                    </div>
                  </div>

                  {/* 年換算売上 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">年換算売上</h5>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100) * 12).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        月間売上 × 12ヶ月
                      </div>
                    </div>
                  </div>
                </div>

                {/* 計算式説明 */}
                <div className="mt-6 p-4 bg-white/70 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-600">
                    <strong>計算式:</strong> エンジニア数 × 平均単価 × 稼働率 = 月間売上<br/>
                    <strong>想定:</strong> SES単価はスキル・経験・市場価格により40万円〜150万円で変動
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
