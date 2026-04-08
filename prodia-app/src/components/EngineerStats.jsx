import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';
import DetailedAnalytics from './DetailedAnalytics';

// 決定実績データ（月別） - APIから取得予定
const DECISIONS_BY_MONTH = {};

// 待機エンジニアデータ - APIから取得予定
const WAITING_ENGINEERS = [];

const useCountUp = (target = 0, duration = 1200) => {
  const [value, setValue] = useState(0);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) {
      setValue(0);
      startValueRef.current = 0;
      return;
    }

    const startValue = startValueRef.current;
    const change = target - startValue;

    if (change === 0) {
      setValue(target);
      startValueRef.current = target;
      return;
    }

    let frameId;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + change * eased);
      setValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        startValueRef.current = target;
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
};

// 決定目標バナーコンポーネント
const MonthlyGoalBanner = ({ ppGoal, bpGoal, ppAchieved, bpAchieved, selectedMonth, onMonthChange, ppPrevMonth, bpPrevMonth }) => {
  const ppProgress = ppGoal > 0 ? (ppAchieved / ppGoal) * 100 : 0;
  const bpProgress = bpGoal > 0 ? (bpAchieved / bpGoal) * 100 : 0;
  const totalRemaining = (ppGoal - ppAchieved) + (bpGoal - bpAchieved);

  // 残り日数を実際の月末から計算
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentYM;
  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const lastDay = new Date(selYear, selMonthNum, 0).getDate();
  const daysLeft = isCurrentMonth ? lastDay - now.getDate() : 0;

  const ppChange = ppAchieved - ppPrevMonth;
  const bpChange = bpAchieved - bpPrevMonth;

  const getChangeIcon = (change) => {
    if (change > 0) return { icon: 'fa-arrow-up', color: 'text-green-400' };
    if (change < 0) return { icon: 'fa-arrow-down', color: 'text-red-400' };
    return { icon: 'fa-minus', color: 'text-gray-400' };
  };

  // 過去3ヶ月分を動的生成
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月${i === 0 ? '（今月）' : ''}`;
    return { value: val, label };
  });

  return (
    <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-bullseye"></i>
            決定目標
          </h2>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {months.map(m => (
              <option key={m.value} value={m.value} className="bg-slate-700 text-white">
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-white/80 text-sm">
          {isCurrentMonth
            ? <>残り<span className="text-xl font-bold text-white mx-1">{daysLeft}</span>日</>
            : <span className="text-white/60 text-sm">過去月</span>
          }
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PP目標 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-medium">PP営業</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{ppAchieved}/{ppGoal}名</span>
              {ppPrevMonth !== undefined && (
                <span className={`flex items-center gap-1 text-xs ${getChangeIcon(ppChange).color}`}>
                  <i className={`fas ${getChangeIcon(ppChange).icon}`}></i>
                  {ppChange !== 0 && Math.abs(ppChange)}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(ppProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-white/70 text-xs flex items-center justify-between">
            <span>
              残り<span className="text-white font-semibold mx-1">{ppGoal - ppAchieved}名</span>
              ({ppProgress.toFixed(0)}%達成)
            </span>
            {ppPrevMonth !== undefined && (
              <span className="text-white/50">先月: {ppPrevMonth}名</span>
            )}
          </div>
        </div>

        {/* BP目標 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-medium">BP営業</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{bpAchieved}/{bpGoal}名</span>
              {bpPrevMonth !== undefined && (
                <span className={`flex items-center gap-1 text-xs ${getChangeIcon(bpChange).color}`}>
                  <i className={`fas ${getChangeIcon(bpChange).icon}`}></i>
                  {bpChange !== 0 && Math.abs(bpChange)}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(bpProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-white/70 text-xs flex items-center justify-between">
            <span>
              残り<span className="text-white font-semibold mx-1">{bpGoal - bpAchieved}名</span>
              ({bpProgress.toFixed(0)}%達成)
            </span>
            {bpPrevMonth !== undefined && (
              <span className="text-white/50">先月: {bpPrevMonth}名</span>
            )}
          </div>
        </div>
      </div>

      {totalRemaining > 0 && isCurrentMonth && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-white/90 text-sm flex items-center gap-2">
            <i className="fas fa-fire text-yellow-300"></i>
            目標達成まで<span className="text-yellow-300 font-bold text-lg mx-1">{totalRemaining}件</span>必要！
          </p>
        </div>
      )}
    </div>
  );
};

// 今日のアクションカード
const TodayActionsCard = ({ interviews, waitingEngineers }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayInterviews = interviews.filter(i => i.date === today);
  const urgentDeadlines = interviews.filter(i => i.deadline === today);
  const urgentWaiting = waitingEngineers.filter(w => w.urgency === 'high');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <i className="fas fa-exclamation-circle text-red-500"></i>
        今日のアクション
      </h3>
      
      <div className="space-y-3">
        {urgentDeadlines.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <i className="fas fa-exclamation-triangle text-red-500 mt-1"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">回答期限が今日</p>
              <p className="text-xs text-red-600">
                {urgentDeadlines.map(i => `${i.engineer}さん(${i.company}) ${i.time}まで`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {todayInterviews.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <i className="fas fa-calendar-day text-blue-500 mt-1"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">本日の面談: {todayInterviews.length}件</p>
              <p className="text-xs text-blue-600">
                {todayInterviews.map(i => `${i.engineer}(${i.time})`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {urgentWaiting.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <i className="fas fa-user-clock text-amber-500 mt-1"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">待機予定（緊急）: {urgentWaiting.length}名</p>
              <p className="text-xs text-amber-600">
                {urgentWaiting.map(w => `${w.name}(${w.days_left}日後終了)`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {urgentDeadlines.length === 0 && todayInterviews.length === 0 && urgentWaiting.length === 0 && (
          <div className="text-center py-4 text-slate-400">
            <i className="fas fa-check-circle text-3xl mb-2"></i>
            <p className="text-sm">緊急アクションはありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

// カラフルなKPIカード（グラデーション背景）
const ModernKpiCard = ({ icon, label, value, sub, gradient, onClick, change, unit = '', delay = 0 }) => {
  const animatedValue = useCountUp(value);

  const getChangeIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return { icon: 'fa-arrow-up', color: 'bg-green-500/20', textColor: 'text-green-100' };
    if (change < 0) return { icon: 'fa-arrow-down', color: 'bg-red-500/20', textColor: 'text-red-100' };
    return { icon: 'fa-minus', color: 'bg-gray-500/20', textColor: 'text-gray-100' };
  };

  const changeInfo = getChangeIcon();

  return (
    <div 
      className={`relative rounded-2xl shadow-lg overflow-hidden p-5 hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} animate-fadeInUp`}
      onClick={onClick}
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <i className={`fas ${icon} text-lg text-white`}></i>
          </div>
          {changeInfo && (
            <div className={`${changeInfo.color} backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1`}>
              <i className={`fas ${changeInfo.icon} text-xs ${changeInfo.textColor}`}></i>
              <span className={`text-xs font-bold ${changeInfo.textColor}`}>
                {Math.abs(change)}
              </span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {animatedValue}{unit && <span className="text-2xl ml-1">{unit}</span>}
        </div>
        <div className="text-xs font-medium text-white/90 mb-1">{label}</div>
        <div className="text-xs text-white/70">{sub}</div>
      </div>
    </div>
  );
};

// プランナーリスト（定数として外部定義）
const PLANNERS = ['熊谷', '瀬戸山', '上前', '岡田', '温水', '野田', '服部', '山口'];

// 個人別決定ランキング
const DecisionRankingSection = ({ decisions, onDetailClick, onOpenDetailAnalytics }) => {
  
  const plannerStats = useMemo(() => {
    const stats = {};
    PLANNERS.forEach(p => {
      stats[p] = { pp: 0, bp: 0, total: 0, ppDetails: [], bpDetails: [] };
    });
    
    decisions.forEach(d => {
      if (stats[d.planner]) {
        if (d.type === 'PP') {
          stats[d.planner].pp++;
          stats[d.planner].ppDetails.push(d);
        } else {
          stats[d.planner].bp++;
          stats[d.planner].bpDetails.push(d);
        }
        stats[d.planner].total++;
      }
    });
    
    return stats;
  }, [decisions]);

  const getMedalIcon = (index) => {
    if (index === 0) return <i className="fas fa-trophy text-yellow-500"></i>;
    if (index === 1) return <i className="fas fa-medal text-gray-400"></i>;
    if (index === 2) return <i className="fas fa-award text-orange-600"></i>;
    return <i className="far fa-circle text-slate-300"></i>;
  };

  const sortedPP = PLANNERS.map(p => ({ name: p, count: plannerStats[p].pp, details: plannerStats[p].ppDetails })).sort((a, b) => b.count - a.count);
  const sortedBP = PLANNERS.map(p => ({ name: p, count: plannerStats[p].bp, details: plannerStats[p].bpDetails })).sort((a, b) => b.count - a.count);
  const sortedTotal = PLANNERS.map(p => ({ name: p, count: plannerStats[p].total })).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-trophy text-yellow-500"></i>
          個人別決定状況（今月）
        </h3>
        <button
          onClick={onOpenDetailAnalytics}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <i className="fas fa-chart-line"></i>
          詳細分析を見る
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PP決定 */}
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
          <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center justify-between">
            <span>PP決定 ({sortedPP.reduce((sum, p) => sum + p.count, 0)}/5名)</span>
          </h4>
          <div className="space-y-2">
            {sortedPP.map((p, idx) => (
              <div 
                key={p.name} 
                className={`flex items-center justify-between p-2 rounded-lg ${p.count > 0 ? 'bg-white cursor-pointer hover:bg-blue-50' : 'bg-slate-50'}`}
                onClick={() => p.count > 0 && onDetailClick && onDetailClick(p.name, 'PP', p.details)}
              >
                <div className="flex items-center gap-2">
                  <span>{getMedalIcon(idx)}</span>
                  <span className={`text-sm ${p.count > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${p.count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                  {p.count}件
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BP決定 */}
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
          <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center justify-between">
            <span>BP決定 ({sortedBP.reduce((sum, p) => sum + p.count, 0)}/10名)</span>
          </h4>
          <div className="space-y-2">
            {sortedBP.map((p, idx) => (
              <div 
                key={p.name} 
                className={`flex items-center justify-between p-2 rounded-lg ${p.count > 0 ? 'bg-white cursor-pointer hover:bg-emerald-50' : 'bg-slate-50'}`}
                onClick={() => p.count > 0 && onDetailClick && onDetailClick(p.name, 'BP', p.details)}
              >
                <div className="flex items-center gap-2">
                  <span>{getMedalIcon(idx)}</span>
                  <span className={`text-sm ${p.count > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${p.count > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                  {p.count}件
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 合計 */}
        <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/30">
          <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center justify-between">
            <span>合計決定</span>
          </h4>
          <div className="space-y-2">
            {sortedTotal.map((p, idx) => (
              <div 
                key={p.name} 
                className={`flex items-center justify-between p-2 rounded-lg ${p.count > 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span>{getMedalIcon(idx)}</span>
                  <span className={`text-sm ${p.count > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${p.count > 0 ? 'text-purple-600' : 'text-slate-300'}`}>
                  {p.count}件
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 待機予定者リスト
const WaitingEngineersList = ({ waitingEngineers }) => {
  const getUrgencyColor = (urgency) => {
    if (urgency === 'high') return 'border-red-300 bg-red-50';
    if (urgency === 'medium') return 'border-amber-300 bg-amber-50';
    return 'border-emerald-300 bg-emerald-50';
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'high') return <i className="fas fa-circle text-red-500"></i>;
    if (urgency === 'medium') return <i className="fas fa-circle text-yellow-500"></i>;
    return <i className="fas fa-circle text-green-500"></i>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <i className="fas fa-user-clock text-orange-500"></i>
        待機予定者リスト（アサイン緊急度順）
      </h3>
      
      <div className="space-y-3">
        {waitingEngineers.map(eng => (
          <div 
            key={eng.id} 
            className={`border-2 rounded-xl p-4 ${getUrgencyColor(eng.urgency)} hover:shadow-md transition-all cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span>{getUrgencyIcon(eng.urgency)}</span>
                <div>
                  <h4 className="font-bold text-slate-800">{eng.name}</h4>
                  <p className="text-xs text-slate-600">
                    {eng.skills.join(' / ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">{eng.unit_price.toLocaleString()}円</p>
                <p className="text-xs text-slate-500">単価</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">終了予定: {eng.end_date}</span>
              <span className={`font-bold ${eng.urgency === 'high' ? 'text-red-600' : eng.urgency === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                あと{eng.days_left}日
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EngineerStats = ({ engineers }) => {
  const toast = useToast();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isDetailAnalyticsOpen, setIsDetailAnalyticsOpen] = useState(false);

  // ダッシュボードで参照する派生データをまとめて計算
  const stats = useMemo(() => {
    const total = engineers.length;
    const assigned = engineers.filter(e => e.engineer_status === 'アサイン済').length;
    const unassigned = engineers.filter(e => e.engineer_status === '未アサイン').length;

    const skillCounts = {};
    const plannerCounts = {};
    const statusCounts = {};
    const phaseCounts = {};
    const benchSkillCounts = {};
    let totalSkillEntries = 0;

    engineers.forEach(engineer => {
      const status = engineer.engineer_status || '未設定';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const planner = engineer.planner?.trim() || '未割り当て';
      plannerCounts[planner] = (plannerCounts[planner] || 0) + 1;

      const phases = Array.isArray(engineer.phase) && engineer.phase.length > 0 ? engineer.phase : ['未設定'];
      phases.forEach(phase => {
        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
      });

      if (Array.isArray(engineer.skills)) {
        engineer.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          totalSkillEntries += 1;

          if (engineer.engineer_status === '未アサイン') {
            benchSkillCounts[skill] = (benchSkillCounts[skill] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const benchHotSkills = Object.entries(benchSkillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const plannerRanking = Object.entries(plannerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      total,
      assigned,
      unassigned,
      assignmentRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      averageSkills: total > 0 ? (totalSkillEntries / total).toFixed(1) : '0.0',
      uniqueSkills: Object.keys(skillCounts).length,
      uniquePlanners: Object.keys(plannerCounts).filter(name => name !== '未割り当て').length,
      topSkills,
      benchHotSkills,
      plannerRanking,
      statusCounts,
      phaseCounts
    };
  }, [engineers]);

  // 実際のCSVエクスポート機能
  const handleExportCSV = () => {
    const csvData = engineers.map(e => ({
      名前: e.name,
      役職: e.position || '',
      プロジェクト: e.project_name || '',
      プランナー: e.planner || '',
      スキル: Array.isArray(e.skills) ? e.skills.join(', ') : '',
      ステータス: e.engineer_status,
      フェーズ: Array.isArray(e.phase) ? e.phase.join(', ') : ''
    }));

    if (csvData.length === 0) {
      toast.warning('エクスポートできるエンジニアがまだ登録されていません');
      return;
    }

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `engineers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleGenerateReport = () => {
    toast.info('レポート機能は開発中です！');
  };

  const handleDetailClick = (planner, type, details) => {
    setModalData({ planner, type, details });
    setShowDetailModal(true);
  };

  // PP営業進捗から実際のデータを取得
  const [ppInterviews, setPpInterviews] = React.useState([]);
  
  React.useEffect(() => {
    const loadPPInterviews = () => {
      const savedData = localStorage.getItem('ppInterviews');
      if (savedData) {
        try {
          setPpInterviews(JSON.parse(savedData));
        } catch (e) {
          console.error('PP営業データの読み込みに失敗しました', e);
        }
      }
    };
    
    // 初回読み込み
    loadPPInterviews();
    
    // 定期的にデータを更新（1秒ごと）
    const interval = setInterval(loadPPInterviews, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // BP進捗からリアルデータを取得
  const [bpProspects, setBpProspects] = React.useState([]);

  React.useEffect(() => {
    const loadBPProspects = () => {
      const savedData = localStorage.getItem('bpProspects');
      if (savedData) {
        try {
          setBpProspects(JSON.parse(savedData));
        } catch (e) {
          console.error('BP見込みデータの読み込みに失敗しました', e);
        }
      }
    };
    loadBPProspects();
    const interval = setInterval(loadBPProspects, 1000);
    return () => clearInterval(interval);
  }, []);

  // 選択月のデータ（PP・BP実データから統合）
  const currentMonthDecisions = React.useMemo(() => {
    const ppWon = ppInterviews
      .filter(i => i.status === '成約' && i.start_month === selectedMonth)
      .map(i => ({ ...i, planner: i.sales_person, type: 'PP' }));
    const bpWon = bpProspects
      .filter(p => p.status === '成約' && typeof p.interview_date === 'string' && p.interview_date.substring(0, 7) === selectedMonth)
      .map(p => ({ ...p, planner: p.main_planner, type: 'BP' }));
    return [...ppWon, ...bpWon];
  }, [ppInterviews, bpProspects, selectedMonth]);

  // 営業データ統計 - PP営業進捗の実データを使用
  const currentMonthStr = selectedMonth;
  const ppDecisions = ppInterviews.filter(i => 
    i.status === '成約' && i.start_month === currentMonthStr
  ).length;
  
  // BP進捗の実データを使用（面談日が当月の成約件数）
  const bpDecisions = bpProspects.filter(p =>
    p.status === '成約' &&
    typeof p.interview_date === 'string' &&
    p.interview_date.substring(0, 7) === currentMonthStr
  ).length;
  const inProgressCount = ppInterviews.filter(i => 
    ['日程調整中', '面談予定', '面談済み', '回答待ち'].includes(i.status) &&
    i.start_month === currentMonthStr
  ).length;
  
  // 前月データ - PP/BP両方の実データを使用
  const prevMonthStr = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1); // m-1が現在月(0-indexed)なのでm-2が前月
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  })();
  const ppPrevMonth = ppInterviews.filter(i => 
    i.status === '成約' && i.start_month === prevMonthStr
  ).length;
  const bpPrevMonth = bpProspects.filter(p =>
    p.status === '成約' &&
    typeof p.interview_date === 'string' &&
    p.interview_date.substring(0, 7) === prevMonthStr
  ).length;
  
  // 前月比
  const ppChange = ppDecisions - ppPrevMonth;
  const bpChange = bpDecisions - bpPrevMonth;
  
  // 成約率計算 - PP営業進捗の実データを使用
  const totalInterviews = ppInterviews.filter(i => 
    i.start_month === currentMonthStr && 
    !['失注'].includes(i.status)
  ).length;
  const totalDecisions = ppDecisions + bpDecisions;
  const successRate = totalInterviews > 0 ? Math.round((ppDecisions / totalInterviews) * 100) : 0;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        {/* 🎯 ZONE 1: 司令塔 */}
        <MonthlyGoalBanner 
          ppGoal={5} 
          bpGoal={10} 
          ppAchieved={ppDecisions} 
          bpAchieved={bpDecisions}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          ppPrevMonth={ppPrevMonth}
          bpPrevMonth={bpPrevMonth}
        />

        <TodayActionsCard 
          interviews={ppInterviews.map(i => ({
            ...i,
            engineer: i.engineer_name,
            company: i.company_name,
            date: i.interview_date,
            time: i.interview_time,
            deadline: i.response_deadline,
            type: 'PP'
          }))}
          waitingEngineers={WAITING_ENGINEERS} 
        />

        {/* 📊 ZONE 2: 戦況（KPI） */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-slate-600"></i>
            KPIダッシュボード
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ModernKpiCard 
              icon="fa-check-circle" 
              label="PP決定" 
              value={ppDecisions} 
              sub="今月の実績" 
              gradient="from-blue-500 to-blue-600"
              change={ppChange}
              unit="件"
              delay={0}
            />
            <ModernKpiCard 
              icon="fa-handshake" 
              label="BP決定" 
              value={bpDecisions} 
              sub="今月の実績" 
              gradient="from-emerald-500 to-emerald-600"
              change={bpChange}
              unit="件"
              delay={1}
            />
            <ModernKpiCard 
              icon="fa-tasks" 
              label="進行中" 
              value={inProgressCount} 
              sub="面談・回答待ち" 
              gradient="from-amber-500 to-orange-600"
              unit="件"
              delay={2}
            />
            <ModernKpiCard 
              icon="fa-percentage" 
              label="成約率" 
              value={successRate} 
              sub={`${totalDecisions}/${totalInterviews}件`}
              gradient="from-purple-500 to-purple-600"
              unit="%"
              delay={3}
            />
            <ModernKpiCard 
              icon="fa-chart-pie" 
              label="稼働率" 
              value={stats.assignmentRate} 
              sub={`${stats.assigned}/${stats.total}名`}
              gradient="from-slate-600 to-slate-700"
              unit="%"
              delay={4}
            />
            <ModernKpiCard 
              icon="fa-user-clock" 
              label="待機予定" 
              value={WAITING_ENGINEERS.length} 
              sub="アサイン必要" 
              gradient="from-rose-500 to-pink-600"
              unit="名"
              delay={5}
            />
          </div>
        </div>

        <DecisionRankingSection 
          decisions={currentMonthDecisions} 
          onDetailClick={handleDetailClick}
          onOpenDetailAnalytics={() => setIsDetailAnalyticsOpen(true)}
        />

        <WaitingEngineersList waitingEngineers={WAITING_ENGINEERS} />

        {/* ⚙️ ZONE 3: 戦力（リソース分析） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* スキルインサイト */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-code-branch text-amber-500"></i>
              スキルセット分布
            </h3>
            <div className="space-y-3">
              {stats.topSkills.map(([skill, count], index) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-500">#{index + 1}</span>
                      <span className="text-sm font-semibold text-slate-700">{skill}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{count}名</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                      style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-600 mb-1">平均スキル数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageSkills}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 mb-1">スキル領域</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.uniqueSkills}</p>
              </div>
            </div>
          </div>

          {/* プランナーランキング */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-users text-blue-500"></i>
              プランナー別担当数
            </h3>
            <div className="space-y-3">
              {stats.plannerRanking.map((planner, index) => (
                <div key={planner.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {planner.name.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-700">{planner.name}</span>
                      <span className="text-sm font-bold text-blue-600">{planner.count}名</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                        style={{ width: stats.total > 0 ? `${(planner.count / stats.total) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-purple-500"></i>
            クイックアクション
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleGenerateReport}
              className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-chart-line"></i>
              稼働レポート生成
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-csv"></i>
              CSVエクスポート
            </button>
            <button
              onClick={() => toast.info('データ同期機能は開発中です')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-sync-alt"></i>
              データ同期
            </button>
          </div>
        </div>

        {/* 詳細モーダル */}
        {showDetailModal && modalData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    {modalData.planner}さんの{modalData.type}決定詳細
                  </h3>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-slate-600">決定数</p>
                  <p className="text-3xl font-bold text-slate-800">{modalData.details.length}件</p>
                </div>

                <div className="space-y-3">
                  {modalData.details.map(d => {
                    const isBP = modalData.type === 'BP';
                    const grossProfit = isBP && d.sales_price && d.purchase_price ? d.sales_price - d.purchase_price : null;
                    return (
                    <div key={d.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-800">{d.engineer_name}</h4>
                        <span className="text-sm font-semibold text-emerald-600">決定</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">企業名</p>
                          <p className="text-slate-700">{d.company_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">決定日</p>
                          <p className="text-slate-700">{d.decision_date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">開始月</p>
                          <p className="text-slate-700">{d.start_month}</p>
                        </div>
                        {isBP ? (
                          <>
                            <div>
                              <p className="text-xs text-slate-500">売上単価</p>
                              <p className="text-blue-700 font-bold">{d.sales_price ? d.sales_price.toLocaleString() + '円' : '未登録'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">仕入れ単価</p>
                              <p className="text-orange-700 font-bold">{d.purchase_price ? d.purchase_price.toLocaleString() + '円' : '未登録'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">粗利</p>
                              <p className={`font-bold ${grossProfit !== null && grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {grossProfit !== null ? grossProfit.toLocaleString() + '円' : '未計算'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div>
                            <p className="text-xs text-slate-500">単価</p>
                            <p className="text-slate-700 font-bold">{d.unit_price.toLocaleString()}円</p>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 詳細分析モーダル */}
      <DetailedAnalytics
        isOpen={isDetailAnalyticsOpen}
        onClose={() => setIsDetailAnalyticsOpen(false)}
        decisionsData={DECISIONS_BY_MONTH}
        availableMonths={Object.keys(DECISIONS_BY_MONTH).sort().reverse()}
      />
    </div>
  );
};

export default EngineerStats;
