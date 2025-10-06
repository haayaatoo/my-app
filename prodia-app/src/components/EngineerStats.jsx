import React from 'react';

const EngineerStats = ({ engineers }) => {
  const total = engineers.length;
  const assigned = engineers.filter(e => e.engineer_status === 'アサイン済').length;
  const unassigned = engineers.filter(e => e.engineer_status === '未アサイン').length;
  
  // スキル統計
  const skillCounts = {};
  engineers.forEach(engineer => {
    if (Array.isArray(engineer.skills)) {
      engineer.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  
  const topSkills = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

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
    alert('レポート機能は開発中です！');
  };

  const handleSyncData = () => {
    alert('データ同期機能は開発中です！');
  };

  return (
    <div className="relative p-8 bg-gradient-to-br from-white/90 via-amber-50/60 to-stone-100/80 rounded-3xl border border-white/80 shadow-2xl mb-8 overflow-hidden group hover:bg-white/95 transition-all duration-500">
      {/* ラグジュアリーなパーティクル効果 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-200 rounded-full animate-ping opacity-20"
            style={{
              top: `${18 + (i * 12)}%`,
              left: `${12 + (i * 10)}%`,
              animationDelay: `${i * 0.18}s`,
              animationDuration: '2.2s'
            }}
          />
        ))}
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-3 tracking-wide">
          <span className="text-amber-500 text-3xl">📊</span>
          エンジニア統計
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 基本統計 */}
          <div className="bg-white/90 rounded-2xl p-6 shadow border border-white/60">
            <h4 className="text-base font-bold text-slate-700 mb-4 tracking-wide flex items-center gap-2">
              <i className="fas fa-users text-blue-400"></i>
              アサイン状況
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  総数
                </span>
                <span className="font-extrabold text-2xl text-blue-600 drop-shadow">{total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 flex items-center gap-2">
                  アサイン済
                </span>
                <span className="font-extrabold text-xl text-green-600">{assigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-rose-700 flex items-center gap-2">
                  未アサイン
                </span>
                <span className="font-extrabold text-xl text-rose-500">{unassigned}</span>
              </div>
            </div>
            {/* プログレスバー */}
            <div className="mt-5">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${total > 0 ? (assigned / total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-semibold">
                アサイン率: {total > 0 ? Math.round((assigned / total) * 100) : 0}%
              </p>
            </div>
          </div>
          {/* 人気スキル */}
          <div className="bg-white/90 rounded-2xl p-6 shadow border border-white/60">
            <h4 className="text-base font-bold text-slate-700 mb-4 tracking-wide flex items-center gap-2">
              <i className="fas fa-code text-amber-400"></i>
              人気スキル TOP5
            </h4>
            <div className="space-y-3">
              {topSkills.map(([skill, count], index) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-500">#{index + 1}</span>
                    {skill}
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {count}人
                  </span>
                </div>
              ))}
              {topSkills.length === 0 && (
                <p className="text-slate-400 text-sm">スキルデータがありません</p>
              )}
            </div>
          </div>
          {/* アクション */}
          <div className="bg-white/90 rounded-2xl p-6 shadow border border-white/60 flex flex-col justify-between">
            <h4 className="text-base font-bold text-slate-700 mb-4 tracking-wide flex items-center gap-2">
              <i className="fas fa-bolt text-purple-400"></i>
              クイックアクション
            </h4>
            <div className="space-y-3">
              <button
                onClick={handleGenerateReport}
                className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <i className="fas fa-chart-line"></i>
                レポート出力
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <i className="fas fa-file-csv"></i>
                CSVエクスポート
              </button>
              <button
                onClick={handleSyncData}
                className="w-full bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-bold hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <i className="fas fa-sync-alt"></i>
                データ同期
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineerStats;
