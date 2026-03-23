import React, { useState, useMemo } from 'react';

const DetailedAnalytics = ({ isOpen, onClose, decisionsData, availableMonths }) => {
  // 期間選択（開始月と終了月）
  const [startMonth, setStartMonth] = useState(availableMonths[availableMonths.length - 1]);
  const [endMonth, setEndMonth] = useState(availableMonths[0]);

  // 選択期間のデータをフィルタリング
  const selectedPeriodData = useMemo(() => {
    const start = availableMonths.indexOf(startMonth);
    const end = availableMonths.indexOf(endMonth);
    const selectedMonths = availableMonths.slice(Math.max(end, 0), start + 1);
    
    return selectedMonths.map(month => ({
      month,
      decisions: decisionsData[month] || [],
      pp: (decisionsData[month] || []).filter(d => d.type === 'PP').length,
      bp: (decisionsData[month] || []).filter(d => d.type === 'BP').length,
      total: (decisionsData[month] || []).length
    })).reverse();
  }, [startMonth, endMonth, decisionsData, availableMonths]);

  // プランナー別統計
  const plannerStats = useMemo(() => {
    const stats = {};
    selectedPeriodData.forEach(monthData => {
      monthData.decisions.forEach(decision => {
        if (!stats[decision.planner]) {
          stats[decision.planner] = { pp: 0, bp: 0, total: 0 };
        }
        stats[decision.planner].total++;
        if (decision.type === 'PP') stats[decision.planner].pp++;
        if (decision.type === 'BP') stats[decision.planner].bp++;
      });
    });
    
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [selectedPeriodData]);

  // CSV エクスポート
  const exportToCSV = () => {
    const headers = ['月', 'プランナー', 'タイプ', 'エンジニア名', '企業名', '決定日', '開始月', '単価'];
    const rows = selectedPeriodData.flatMap(monthData => 
      monthData.decisions.map(d => [
        monthData.month,
        d.planner,
        d.type,
        d.engineer_name,
        d.company_name,
        d.decision_date,
        d.start_month,
        d.unit_price
      ])
    );
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `決定数分析_${startMonth}_${endMonth}.csv`;
    link.click();
  };

  // チャート描画（シンプルなSVGベース）
  const TrendChart = () => {
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...selectedPeriodData.map(d => d.total), 10);
    const xStep = chartWidth / (selectedPeriodData.length - 1 || 1);

    const getY = (value) => height - padding.bottom - (value / maxValue) * chartHeight;
    const getX = (index) => padding.left + index * xStep;

    // PP・BP・合計のラインパス
    const ppPath = selectedPeriodData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.pp)}`)
      .join(' ');
    
    const bpPath = selectedPeriodData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.bp)}`)
      .join(' ');
    
    const totalPath = selectedPeriodData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.total)}`)
      .join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* グリッドライン */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const y = height - padding.bottom - (i / 5) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text x={padding.left - 10} y={y + 5} textAnchor="end" fontSize="12" fill="#6b7280">
                {Math.round((maxValue / 5) * i)}
              </text>
            </g>
          );
        })}

        {/* X軸ラベル */}
        {selectedPeriodData.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - padding.bottom + 25}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {d.month.slice(5)}月
          </text>
        ))}

        {/* ラインチャート */}
        <path d={ppPath} fill="none" stroke="#3b82f6" strokeWidth="3" />
        <path d={bpPath} fill="none" stroke="#10b981" strokeWidth="3" />
        <path d={totalPath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5" />

        {/* データポイント */}
        {selectedPeriodData.map((d, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(d.pp)} r="5" fill="#3b82f6" />
            <circle cx={getX(i)} cy={getY(d.bp)} r="5" fill="#10b981" />
            <circle cx={getX(i)} cy={getY(d.total)} r="5" fill="#8b5cf6" />
          </g>
        ))}
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-chart-line"></i>
              決定数 詳細分析
            </h2>
            <p className="text-indigo-100 mt-1">期間別・プランナー別の詳細レポート</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <i className="fas fa-times fa-lg"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 期間選択とエクスポート */}
          <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <i className="fas fa-calendar-alt text-gray-600"></i>
              <div className="flex items-center gap-2">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <span className="text-gray-600">〜</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <i className="fas fa-download"></i>
              CSVエクスポート
            </button>
          </div>

          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <div className="text-blue-100 text-sm">PP決定</div>
              <div className="text-3xl font-bold mt-1">
                {selectedPeriodData.reduce((sum, d) => sum + d.pp, 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg p-4">
              <div className="text-emerald-100 text-sm">BP決定</div>
              <div className="text-3xl font-bold mt-1">
                {selectedPeriodData.reduce((sum, d) => sum + d.bp, 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
              <div className="text-purple-100 text-sm">合計決定</div>
              <div className="text-3xl font-bold mt-1">
                {selectedPeriodData.reduce((sum, d) => sum + d.total, 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4">
              <div className="text-amber-100 text-sm">月平均</div>
              <div className="text-3xl font-bold mt-1">
                {(selectedPeriodData.reduce((sum, d) => sum + d.total, 0) / selectedPeriodData.length).toFixed(1)}
              </div>
            </div>
          </div>

          {/* トレンドチャート */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-chart-line text-indigo-600"></i>
              月次トレンド
            </h3>
            <div className="h-80">
              <TrendChart />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-sm text-gray-600">PP決定</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-500"></div>
                <span className="text-sm text-gray-600">BP決定</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500" style={{ borderTop: '2px dashed' }}></div>
                <span className="text-sm text-gray-600">合計</span>
              </div>
            </div>
          </div>

          {/* プランナー別パフォーマンス */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-users text-indigo-600"></i>
              プランナー別パフォーマンス
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ランク</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">プランナー</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">PP決定</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">BP決定</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">合計</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ビジュアル</th>
                  </tr>
                </thead>
                <tbody>
                  {plannerStats.map((planner, index) => (
                    <tr key={planner.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {index === 0 && <i className="fas fa-trophy text-yellow-500"></i>}
                        {index === 1 && <i className="fas fa-medal text-gray-400"></i>}
                        {index === 2 && <i className="fas fa-award text-amber-600"></i>}
                        {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{planner.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {planner.pp}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {planner.bp}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {planner.total}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <div 
                            className="h-6 bg-blue-500 rounded"
                            style={{ width: `${(planner.pp / planner.total) * 100}px` }}
                            title={`PP: ${planner.pp}`}
                          ></div>
                          <div 
                            className="h-6 bg-emerald-500 rounded"
                            style={{ width: `${(planner.bp / planner.total) * 100}px` }}
                            title={`BP: ${planner.bp}`}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 月別詳細データ */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-file-export text-indigo-600"></i>
              月別詳細データ
            </h3>
            <div className="space-y-4">
              {selectedPeriodData.map(monthData => (
                <div key={monthData.month} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-800">{monthData.month}</h4>
                    <div className="flex gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        PP: {monthData.pp}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">
                        BP: {monthData.bp}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                        計: {monthData.total}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {monthData.decisions.map(decision => (
                      <div key={decision.id} className="bg-gray-50 p-2 rounded">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-800">{decision.engineer_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            decision.type === 'PP' ? 'bg-blue-200 text-blue-800' : 'bg-emerald-200 text-emerald-800'
                          }`}>
                            {decision.type}
                          </span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          {decision.company_name} / {decision.planner}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalytics;
