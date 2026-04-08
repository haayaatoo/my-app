import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';

export default function InterviewManager() {
  const { user } = useUser();
  const [interviews, setInterviews] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [groupedByEngineer, setGroupedByEngineer] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'cards', 'dashboard'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [filters, setFilters] = useState({
    engineer_id: '',
    interview_type: '',
    result: '',
    date_from: '',
    date_to: ''
  });

  // フォーム状態
  const [formData, setFormData] = useState({
    engineer: '',
    interview_date: '',
    interview_type: 'customer_interview', // お客様面談に固定
    client_company: '',
    result: '',
    rejection_reason: '',
    notes: '',
    next_action: ''
  });

  const fetchInterviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      // お客様面談のみを取得するフィルターを強制追加
      params.append('interview_type', 'customer_interview');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:8000/api/interviews/?${params}`);
      if (response.ok) {
        const data = await response.json();
        const interviewsData = data.results || data;
        console.log('📊 お客様面談データ:', interviewsData);
        setInterviews(interviewsData);
        
        // エンジニア別にグループ化
        const grouped = interviewsData.reduce((acc, interview) => {
          const engineerName = interview.engineer_name || '未設定';
          if (!acc[engineerName]) {
            acc[engineerName] = [];
          }
          acc[engineerName].push(interview);
          return acc;
        }, {});
        
        // 各エンジニアの面談を日付順でソート
        Object.keys(grouped).forEach(engineerName => {
          grouped[engineerName].sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date));
        });
        
        setGroupedByEngineer(grouped);
      }
    } catch (error) {
      setError('面談履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInterviews();
    fetchEngineers();
  }, [fetchInterviews]);

  const fetchEngineers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/engineers/');
      if (response.ok) {
        const data = await response.json();
        setEngineers(data.results || data);
      }
    } catch (error) {
      console.error('エンジニア情報の取得に失敗:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingInterview 
        ? `http://localhost:8000/api/interviews/${editingInterview.id}/`
        : 'http://localhost:8000/api/interviews/';
      
      const method = editingInterview ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchInterviews();
        setShowForm(false);
        setEditingInterview(null);
        resetForm();
      } else {
        setError('面談履歴の保存に失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('この面談履歴を削除しますか？')) {
      try {
        const response = await fetch(`http://localhost:8000/api/interviews/${id}/`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchInterviews();
        }
      } catch (error) {
        setError('削除に失敗しました');
      }
    }
  };

  const handleEdit = (interview) => {
    setEditingInterview(interview);
    setFormData({
      engineer: interview.engineer,
      interview_date: interview.interview_date,
      interview_type: interview.interview_type,
      client_company: interview.client_company || '',
      result: interview.result,
      rejection_reason: interview.rejection_reason || '',
      notes: interview.notes || '',
      next_action: interview.next_action || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      engineer: '',
      interview_date: '',
      interview_type: 'customer_interview', // お客様面談に固定
      client_company: '',
      result: '',
      rejection_reason: '',
      notes: '',
      next_action: ''
    });
  };

  const getResultBadgeColor = (result) => {
    switch (result) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'fail': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'pass': return '合格';
      case 'fail': return '不合格';
      case 'pending': return '保留';
      case 'canceled': return 'キャンセル';
      default: return result;
    }
  };

  const getInterviewTypeText = (type) => {
    switch (type) {
      case 'customer_interview': return 'お客様面談';
      case 'evaluation_interview': return '評価面談';
      case 'one_on_one': return '1on1面談';
      case 'other': return 'その他';
      default: return type;
    }
  };

  // 🎨 カード型表示関数
  const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500',
  ];
  const getAvatarColor = (name) =>
    name ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] : 'bg-slate-400';

  const CARD_STATUS = {
    pass:     { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'fa-check-circle', text: '合格',      bar: 'border-l-emerald-400' },
    fail:     { badge: 'bg-red-100 text-red-600 border-red-200',             icon: 'fa-times-circle', text: '不合格',    bar: 'border-l-red-400'     },
    pending:  { badge: 'bg-amber-100 text-amber-700 border-amber-200',       icon: 'fa-clock',        text: '保留中',    bar: 'border-l-amber-400'   },
    canceled: { badge: 'bg-slate-100 text-slate-500 border-slate-200',       icon: 'fa-ban',          text: 'キャンセル', bar: 'border-l-slate-300'   },
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {interviews.map(interview => {
        const engineer = engineers.find(e => e.id === interview.engineer);
        const st = CARD_STATUS[interview.result] || CARD_STATUS.pending;
        const isRecent = new Date(interview.interview_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return (
          <div key={interview.id}
            className={`group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${st.bar}`}>

            {/* カードヘッダー */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${getAvatarColor(engineer?.name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {engineer?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{engineer?.name || '不明'}</p>
                  <p className="text-xs text-slate-400 truncate">{interview.client_company || '会社名未設定'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isRecent && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">NEW</span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.badge}`}>
                  <i className={`fas ${st.icon} text-[10px]`} />
                  {st.text}
                </span>
              </div>
            </div>

            {/* 面談日 */}
            <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-slate-500">
              <i className="fas fa-calendar-alt text-slate-300" />
              {new Date(interview.interview_date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })}
            </div>

            {/* メモ / 次アクション / 不合格理由 */}
            {(interview.notes || interview.next_action || (interview.result === 'fail' && interview.rejection_reason)) && (
              <div className="mx-4 mb-3 space-y-2">
                {interview.notes && (
                  <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <i className="fas fa-comment-alt text-slate-400 text-[10px] mt-0.5" />
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{interview.notes}</p>
                  </div>
                )}
                {interview.next_action && (
                  <div className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2">
                    <i className="fas fa-arrow-right text-amber-400 text-[10px] mt-0.5" />
                    <p className="text-xs text-amber-700 line-clamp-1">{interview.next_action}</p>
                  </div>
                )}
                {interview.result === 'fail' && interview.rejection_reason && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2">
                    <i className="fas fa-times text-red-400 text-[10px] mt-0.5" />
                    <p className="text-xs text-red-600 line-clamp-1">{interview.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* フッター */}
            <div className="flex items-center gap-1 px-4 pb-3 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingInterview(interview);
                  setFormData({
                    engineer: interview.engineer,
                    interview_date: interview.interview_date,
                    interview_type: interview.interview_type,
                    client_company: interview.client_company,
                    result: interview.result,
                    rejection_reason: interview.rejection_reason || '',
                    notes: interview.notes || '',
                    next_action: interview.next_action || '',
                  });
                  setShowForm(true);
                }}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-1.5 transition-colors border border-amber-200"
              >
                <i className="fas fa-pen text-[10px]" /> 編集
              </button>
              <button
                onClick={() => { setSelectedInterview(interview); setShowDetailModal(true); }}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <i className="fas fa-info-circle text-[10px]" /> 詳細
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // 📊 高精度ダッシュボード表示関数
  const renderDashboardView = () => {
    // 詳細統計データ計算
    const now = new Date();
    const completedInterviews = interviews.filter(i => i.result && i.result !== 'pending');
    const thisWeek = interviews.filter(i => {
      const interviewDate = new Date(i.interview_date);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return interviewDate >= weekStart;
    });
    const lastWeek = interviews.filter(i => {
      const interviewDate = new Date(i.interview_date);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
      return interviewDate >= lastWeekStart && interviewDate <= lastWeekEnd;
    });

    const stats = {
      total: interviews.length,
      pass: interviews.filter(i => i.result === 'pass').length,
      fail: interviews.filter(i => i.result === 'fail').length,
      pending: interviews.filter(i => i.result === 'pending').length,
      canceled: interviews.filter(i => i.result === 'canceled').length,
      
      // 面談通過率 (重要指標)
      passRate: completedInterviews.length > 0 
        ? Math.round((interviews.filter(i => i.result === 'pass').length / completedInterviews.length) * 100)
        : 0,
      
      // 決定率 (合格+不合格の割合)
      decisionRate: interviews.length > 0 
        ? Math.round((completedInterviews.length / interviews.length) * 100)
        : 0,
      
      // 時期別統計
      thisMonth: interviews.filter(i => {
        const interviewDate = new Date(i.interview_date);
        return interviewDate.getMonth() === now.getMonth() && 
               interviewDate.getFullYear() === now.getFullYear();
      }).length,
      lastMonth: interviews.filter(i => {
        const interviewDate = new Date(i.interview_date);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return interviewDate.getMonth() === lastMonth.getMonth() && 
               interviewDate.getFullYear() === lastMonth.getFullYear();
      }).length,
      thisWeek: thisWeek.length,
      lastWeek: lastWeek.length,
      
      // 今月の通過率
      thisMonthPassRate: (() => {
        const thisMonthInterviews = interviews.filter(i => {
          const interviewDate = new Date(i.interview_date);
          return interviewDate.getMonth() === now.getMonth() && 
                 interviewDate.getFullYear() === now.getFullYear();
        });
        const thisMonthCompleted = thisMonthInterviews.filter(i => i.result && i.result !== 'pending');
        const thisMonthPass = thisMonthInterviews.filter(i => i.result === 'pass');
        return thisMonthCompleted.length > 0 
          ? Math.round((thisMonthPass.length / thisMonthCompleted.length) * 100)
          : 0;
      })(),
      
      // 平均面談期間 (面談日から結果確定まで)
      avgDecisionDays: completedInterviews.length > 0 
        ? Math.round(completedInterviews.reduce((acc, interview) => {
            // 簡易計算: 結果がある場合は1-3日、保留は7日と仮定
            return acc + (interview.result === 'pass' || interview.result === 'fail' ? 2 : 7);
          }, 0) / completedInterviews.length)
        : 0
    };

    // エンジニア別詳細統計
    const engineerStats = engineers.map(engineer => {
      const engineerInterviews = interviews.filter(i => i.engineer === engineer.id);
      const engineerCompleted = engineerInterviews.filter(i => i.result && i.result !== 'pending');
      const thisMonthInterviews = engineerInterviews.filter(i => {
        const interviewDate = new Date(i.interview_date);
        return interviewDate.getMonth() === now.getMonth() && 
               interviewDate.getFullYear() === now.getFullYear();
      });
      
      return {
        ...engineer,
        totalInterviews: engineerInterviews.length,
        passCount: engineerInterviews.filter(i => i.result === 'pass').length,
        failCount: engineerInterviews.filter(i => i.result === 'fail').length,
        pendingCount: engineerInterviews.filter(i => i.result === 'pending').length,
        canceledCount: engineerInterviews.filter(i => i.result === 'canceled').length,
        
        // 通過率 (決定済み面談に対する合格率)
        passRate: engineerCompleted.length > 0 
          ? Math.round((engineerInterviews.filter(i => i.result === 'pass').length / engineerCompleted.length) * 100)
          : 0,
          
        // 活動率 (今月の面談数)
        thisMonthActivity: thisMonthInterviews.length,
        
        // 成功度スコア (合格数 × 2 + 面談数)
        successScore: (engineerInterviews.filter(i => i.result === 'pass').length * 2) + engineerInterviews.length,
        
        // 最近の面談履歴
        recentInterviews: engineerInterviews
          .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))
          .slice(0, 3),
          
        // 最後の面談からの日数
        lastInterviewDays: engineerInterviews.length > 0 
          ? Math.floor((now - new Date(Math.max(...engineerInterviews.map(i => new Date(i.interview_date))))) / (1000 * 60 * 60 * 24))
          : null,
          
        // 面談企業のユニーク数
        uniqueCompanies: new Set(engineerInterviews.map(i => i.client_company)).size
      };
    }).sort((a, b) => b.successScore - a.successScore);

    // 月別詳細推移データ（過去6ヶ月）
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthInterviews = interviews.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate.getMonth() === date.getMonth() && 
               interviewDate.getFullYear() === date.getFullYear();
      });
      
      const monthCompleted = monthInterviews.filter(i => i.result && i.result !== 'pending');
      const monthPass = monthInterviews.filter(i => i.result === 'pass');
      
      return {
        month: `${date.getMonth() + 1}月`,
        total: monthInterviews.length,
        pass: monthPass.length,
        fail: monthInterviews.filter(i => i.result === 'fail').length,
        pending: monthInterviews.filter(i => i.result === 'pending').length,
        canceled: monthInterviews.filter(i => i.result === 'canceled').length,
        passRate: monthCompleted.length > 0 ? Math.round((monthPass.length / monthCompleted.length) * 100) : 0,
        uniqueEngineers: new Set(monthInterviews.map(i => i.engineer)).size,
        uniqueCompanies: new Set(monthInterviews.map(i => i.client_company)).size
      };
    });

    return (
      <div className="space-y-8">
        {/* 📊 主要KPI統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* 総面談数 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-100 text-sm">総面談数</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <i className="fas fa-handshake text-4xl text-blue-200"></i>
              </div>
              <div className="flex items-center justify-between text-blue-100 text-xs">
                <span>今月: {stats.thisMonth}件</span>
                <div className={`flex items-center gap-1 ${stats.thisMonth >= stats.lastMonth ? 'text-green-300' : 'text-red-300'}`}>
                  <i className={`fas ${stats.thisMonth >= stats.lastMonth ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                  <span>{stats.thisMonth >= stats.lastMonth ? '+' : ''}{stats.thisMonth - stats.lastMonth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 面談通過率 (重要KPI) */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-emerald-100 text-sm">面談通過率</p>
                  <p className="text-3xl font-bold">{stats.passRate}%</p>
                </div>
                <i className="fas fa-percentage text-4xl text-emerald-200"></i>
              </div>
              <div className="flex items-center justify-between text-emerald-100 text-xs">
                <span>合格: {stats.pass}件</span>
                <span>今月: {stats.thisMonthPassRate}%</span>
              </div>
            </div>
          </div>

          {/* 決定率 */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-purple-100 text-sm">決定率</p>
                  <p className="text-3xl font-bold">{stats.decisionRate}%</p>
                </div>
                <i className="fas fa-chart-line text-4xl text-purple-200"></i>
              </div>
              <div className="flex items-center justify-between text-purple-100 text-xs">
                <span>決定済: {stats.pass + stats.fail}件</span>
                <span>保留: {stats.pending}件</span>
              </div>
            </div>
          </div>

          {/* 平均決定日数 */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-amber-100 text-sm">平均決定日数</p>
                  <p className="text-3xl font-bold">{stats.avgDecisionDays}</p>
                </div>
                <i className="fas fa-clock text-4xl text-amber-200"></i>
              </div>
              <div className="flex items-center justify-between text-amber-100 text-xs">
                <span>今週: {stats.thisWeek}件</span>
                <span>先週: {stats.lastWeek}件</span>
              </div>
            </div>
          </div>

          {/* 活動状況 */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-indigo-100 text-sm">活動状況</p>
                  <p className="text-2xl font-bold">
                    {stats.pending > 0 ? '進行中' : '安定'}
                  </p>
                </div>
                <i className={`fas ${stats.pending > 0 ? 'fa-spinner fa-spin' : 'fa-check-circle'} text-4xl text-indigo-200`}></i>
              </div>
              <div className="flex items-center justify-between text-indigo-100 text-xs">
                <span>保留中: {stats.pending}件</span>
                {stats.canceled > 0 && <span>キャンセル: {stats.canceled}件</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 🏆 エンジニア別パフォーマンス & 📅 月別推移 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* エンジニア別パフォーマンス */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-700 flex items-center gap-3">
                <i className="fas fa-trophy text-amber-500"></i>
                エンジニア別パフォーマンス
              </h3>
              <div className="text-sm text-slate-500">
                上位{Math.min(6, engineerStats.length)}名
              </div>
            </div>
            
            <div className="space-y-4">
              {engineerStats.slice(0, 8).map((engineer, index) => (
                <div key={engineer.id} className="relative bg-gradient-to-r from-white to-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-5">
                    {/* ランキングバッジ */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* エンジニア詳細情報 */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* 基本情報 */}
                        <div className="lg:col-span-3">
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{engineer.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <i className="fas fa-building"></i>
                              {engineer.uniqueCompanies}社
                            </span>
                            {engineer.lastInterviewDays !== null && (
                              <span className="flex items-center gap-1">
                                <i className="fas fa-calendar-alt"></i>
                                {engineer.lastInterviewDays}日前
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 面談統計 */}
                        <div className="lg:col-span-4">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-blue-50 rounded-lg p-2">
                              <div className="text-xs text-blue-600 mb-1">総数</div>
                              <div className="font-bold text-blue-800">{engineer.totalInterviews}</div>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2">
                              <div className="text-xs text-emerald-600 mb-1">合格</div>
                              <div className="font-bold text-emerald-800">{engineer.passCount}</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2">
                              <div className="text-xs text-red-600 mb-1">不合格</div>
                              <div className="font-bold text-red-800">{engineer.failCount}</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2">
                              <div className="text-xs text-amber-600 mb-1">保留</div>
                              <div className="font-bold text-amber-800">{engineer.pendingCount}</div>
                            </div>
                          </div>
                        </div>

                        {/* 通過率と活動状況 */}
                        <div className="lg:col-span-3">
                          <div className="space-y-3">
                            {/* 通過率バー */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-600">通過率</span>
                                <span className="text-sm font-bold text-slate-800">{engineer.passRate}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700 relative"
                                  style={{ width: `${engineer.passRate}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/30 rounded-full group-hover:animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* 今月の活動 */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">今月活動</span>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-slate-800">{engineer.thisMonthActivity}件</span>
                                {engineer.thisMonthActivity > 0 && (
                                  <i className="fas fa-fire text-orange-500 animate-pulse"></i>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 最近の面談結果 & スコア */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-col items-center gap-2">
                            {/* 成功度スコア */}
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              engineer.successScore >= 10 ? 'bg-emerald-100 text-emerald-700' :
                              engineer.successScore >= 5 ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              スコア: {engineer.successScore}
                            </div>
                            
                            {/* 最近の面談結果ドット */}
                            <div className="flex gap-1">
                              {engineer.recentInterviews.map((interview, idx) => (
                                <div
                                  key={`${interview.id}-${idx}`}
                                  className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                                    interview.result === 'pass' ? 'bg-emerald-400' :
                                    interview.result === 'fail' ? 'bg-red-400' :
                                    interview.result === 'pending' ? 'bg-amber-400' :
                                    'bg-gray-400'
                                  }`}
                                  title={`${interview.client_company} - ${interview.result || '未定'}`}
                                ></div>
                              ))}
                              {Array.from({ length: Math.max(0, 3 - engineer.recentInterviews.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="w-3 h-3 rounded-full bg-slate-200"></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ホバー効果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 月別詳細推移分析 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
              <i className="fas fa-chart-area text-blue-500"></i>
              月別推移分析
            </h3>
            
            <div className="space-y-5">
              {monthlyData.map((data, index) => (
                <div key={index} className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100">
                  {/* 月別ヘッダー */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-lg">{data.month}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        data.passRate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        data.passRate >= 50 ? 'bg-blue-100 text-blue-700' :
                        data.passRate >= 30 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        通過率 {data.passRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-800 font-semibold">{data.total}件</div>
                      <div className="text-xs text-slate-500">{data.uniqueEngineers}人が活動</div>
                    </div>
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="mb-3">
                    <div className="flex h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      {data.total > 0 && (
                        <>
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center"
                            style={{ width: `${(data.pass / data.total) * 100}%` }}
                            title={`合格: ${data.pass}件`}
                          >
                            {data.pass > 0 && <span className="text-white text-xs font-bold">{data.pass}</span>}
                          </div>
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center"
                            style={{ width: `${(data.fail / data.total) * 100}%` }}
                            title={`不合格: ${data.fail}件`}
                          >
                            {data.fail > 0 && <span className="text-white text-xs font-bold">{data.fail}</span>}
                          </div>
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center"
                            style={{ width: `${(data.pending / data.total) * 100}%` }}
                            title={`保留: ${data.pending}件`}
                          >
                            {data.pending > 0 && <span className="text-white text-xs font-bold">{data.pending}</span>}
                          </div>
                          {data.canceled > 0 && (
                            <div 
                              className="bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center"
                              style={{ width: `${(data.canceled / data.total) * 100}%` }}
                              title={`キャンセル: ${data.canceled}件`}
                            >
                              <span className="text-white text-xs font-bold">{data.canceled}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 詳細統計 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full"></div>
                      <span className="text-slate-600">合格: <strong className="text-emerald-600">{data.pass}件</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-br from-red-400 to-red-500 rounded-full"></div>
                      <span className="text-slate-600">不合格: <strong className="text-red-600">{data.fail}件</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full"></div>
                      <span className="text-slate-600">保留: <strong className="text-amber-600">{data.pending}件</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                      <span className="text-slate-600">企業: <strong className="text-blue-600">{data.uniqueCompanies}社</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 推移サマリー */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <i className="fas fa-lightbulb text-blue-500"></i>
                推移分析
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <i className="fas fa-trending-up text-emerald-500"></i>
                  <span className="text-slate-600">
                    最高通過率: <strong className="text-emerald-600">{Math.max(...monthlyData.map(d => d.passRate))}%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-chart-bar text-blue-500"></i>
                  <span className="text-slate-600">
                    月平均: <strong className="text-blue-600">{Math.round(monthlyData.reduce((acc, d) => acc + d.total, 0) / monthlyData.length)}件</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-users text-purple-500"></i>
                  <span className="text-slate-600">
                    参加エンジニア総数: <strong className="text-purple-600">{Math.max(...monthlyData.map(d => d.uniqueEngineers))}人</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📈 最近の活動 & 🎯 今後のアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近の活動 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
              <i className="fas fa-history text-purple-500"></i>
              最近の面談活動
            </h3>
            
            <div className="space-y-4">
              {interviews
                .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))
                .slice(0, 5)
                .map(interview => {
                  const engineer = engineers.find(e => e.id === interview.engineer);
                  const isRecent = new Date(interview.interview_date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div key={interview.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors duration-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {engineer?.name.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{engineer?.name || '不明'}</span>
                          {isRecent && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <p className="text-slate-500 text-sm">{interview.client_company}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interview.result === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                          interview.result === 'fail' ? 'bg-red-100 text-red-700' :
                          interview.result === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {interview.result === 'pass' && '合格'}
                          {interview.result === 'fail' && '不合格'}
                          {interview.result === 'pending' && '保留'}
                          {interview.result === 'canceled' && 'キャンセル'}
                          {!interview.result && '未定'}
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                          {new Date(interview.interview_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 今後のアクション */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
              <i className="fas fa-tasks text-green-500"></i>
              今後のアクション
            </h3>
            
            <div className="space-y-4">
              {interviews
                .filter(interview => interview.next_action && interview.result !== 'pass' && interview.result !== 'fail')
                .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
                .slice(0, 5)
                .map(interview => {
                  const engineer = engineers.find(e => e.id === interview.engineer);
                  
                  return (
                    <div key={interview.id} className="flex items-start gap-4 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {engineer?.name.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-700">{engineer?.name || '不明'}</span>
                          <span className="text-slate-500 text-xs">{interview.client_company}</span>
                        </div>
                        <p className="text-slate-600 text-sm">{interview.next_action}</p>
                      </div>
                    </div>
                  );
                })}
              
              {interviews.filter(i => i.next_action && i.result !== 'pass' && i.result !== 'fail').length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <i className="fas fa-check-circle text-4xl text-emerald-400 mb-3"></i>
                  <p>すべてのアクションが完了しています</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 📋 詳細表示モーダル
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedInterview) return null;

    const engineer = engineers.find(e => e.id === selectedInterview.engineer);
    const statusConfig = {
      'pass': { color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: 'fas fa-check-circle', text: '合格' },
      'fail': { color: 'text-red-600', bgColor: 'bg-red-50', icon: 'fas fa-times-circle', text: '不合格' },
      'pending': { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: 'fas fa-clock', text: '保留中' },
      'canceled': { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: 'fas fa-ban', text: 'キャンセル' }
    };
    const status = statusConfig[selectedInterview.result] || statusConfig.pending;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <i className="fas fa-clipboard-list text-blue-500"></i>
                面談詳細情報
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInterview(null);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200"
              >
                <i className="fas fa-times text-slate-600"></i>
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6 space-y-6">
            {/* エンジニア情報 */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <i className="fas fa-user text-blue-500"></i>
                エンジニア情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm mb-1">名前</p>
                  <p className="font-semibold text-slate-800">{engineer?.name || '不明なエンジニア'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">ID</p>
                  <p className="font-semibold text-slate-800">{engineer?.id || 'N/A'}</p>
                </div>
                {engineer?.email && (
                  <div>
                    <p className="text-slate-500 text-sm mb-1">メールアドレス</p>
                    <p className="font-semibold text-slate-800">{engineer.email}</p>
                  </div>
                )}
                {engineer?.phone && (
                  <div>
                    <p className="text-slate-500 text-sm mb-1">電話番号</p>
                    <p className="font-semibold text-slate-800">{engineer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 面談情報 */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <i className="fas fa-handshake text-blue-500"></i>
                面談情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm mb-1">クライアント企業</p>
                  <p className="font-semibold text-slate-800">{selectedInterview.client_company || '未設定'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">面談日時</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(selectedInterview.interview_date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                    {selectedInterview.interview_time && ` ${selectedInterview.interview_time}`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">面談種別</p>
                  <p className="font-semibold text-slate-800">
                    {selectedInterview.interview_type === 'customer_interview' ? 'お客様面談' : selectedInterview.interview_type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">ステータス</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                    <i className={`${status.icon}`}></i>
                    <span className="font-semibold">{status.text}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* メモ */}
            {selectedInterview.notes && (
              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-comment-alt text-green-500"></i>
                  メモ
                </h3>
                <p className="text-slate-700 leading-relaxed">{selectedInterview.notes}</p>
              </div>
            )}

            {/* 次のアクション */}
            {selectedInterview.next_action && (
              <div className="bg-amber-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-tasks text-amber-500"></i>
                  次のアクション
                </h3>
                <p className="text-slate-700 leading-relaxed">{selectedInterview.next_action}</p>
              </div>
            )}

            {/* 不合格理由 */}
            {selectedInterview.result === 'fail' && selectedInterview.rejection_reason && (
              <div className="bg-red-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-times-circle text-red-500"></i>
                  不合格理由
                </h3>
                <p className="text-slate-700 leading-relaxed">{selectedInterview.rejection_reason}</p>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setEditingInterview(selectedInterview);
                  setFormData({
                    engineer: selectedInterview.engineer,
                    interview_date: selectedInterview.interview_date,
                    interview_type: selectedInterview.interview_type,
                    client_company: selectedInterview.client_company,
                    result: selectedInterview.result,
                    rejection_reason: selectedInterview.rejection_reason || '',
                    notes: selectedInterview.notes || '',
                    next_action: selectedInterview.next_action || ''
                  });
                  setShowDetailModal(false);
                  setSelectedInterview(null);
                  setShowForm(true);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-pencil-alt"></i>
                編集する
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInterview(null);
                }}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 flex items-center gap-2"
              >
                <i className="fas fa-times"></i>
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
              <i className="fas fa-comments text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">お客様面談履歴</h1>
              <p className="text-xs text-slate-400 mt-0.5">エンジニア別お客様面談記録・分析データ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <i className="fas fa-list text-[10px]"></i>リスト
              </button>
              <button onClick={() => setViewMode('cards')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${viewMode === 'cards' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <i className="fas fa-th-large text-[10px]"></i>カード
              </button>
              <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${viewMode === 'dashboard' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <i className="fas fa-chart-pie text-[10px]"></i>ダッシュボード
              </button>
            </div>
            <button onClick={() => { setShowForm(true); setEditingInterview(null); resetForm(); }} className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5">
              <i className="fas fa-plus text-[10px]"></i>新規面談記録
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="mb-6 flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
        <select
          value={filters.engineer_id}
          onChange={(e) => setFilters({ ...filters, engineer_id: e.target.value })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">全エンジニア</option>
          {engineers.map(engineer => (
            <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
          ))}
        </select>
        <select
          value={filters.result}
          onChange={(e) => setFilters({ ...filters, result: e.target.value })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">全結果</option>
          <option value="pass">合格</option>
          <option value="fail">不合格</option>
          <option value="pending">保留</option>
          <option value="canceled">キャンセル</option>
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        {(filters.engineer_id || filters.result || filters.date_from) && (
          <button
            onClick={() => setFilters({ engineer_id: '', interview_type: '', result: '', date_from: '', date_to: '' })}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <i className="fas fa-times" /> リセット
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{interviews.length}件</span>
      </div>

      {/* 面談履歴一覧 */}
      {viewMode === 'dashboard' ? (
        <div className="bg-gradient-to-br from-slate-50 to-stone-100 rounded-3xl p-6">
          {renderDashboardView()}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            {interviews.length > 0 ? (
              renderCardView()
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-comments text-3xl text-slate-300 mb-3 block" />
                <p className="text-slate-400 text-sm">お客様面談履歴がありません</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedByEngineer)
            .filter(engineerName =>
              !filters.engineer_id ||
              groupedByEngineer[engineerName].some(interview => interview.engineer === parseInt(filters.engineer_id))
            )
            .sort()
            .map(engineerName => {
              const engineerInterviews = groupedByEngineer[engineerName];
              const latestInterview = engineerInterviews[0];
              const passCount = engineerInterviews.filter(i => i.result === 'pass').length;
              const failCount = engineerInterviews.filter(i => i.result === 'fail').length;

              return (
                <div key={engineerName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* エンジニアヘッダー */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-amber-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {engineerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{engineerName}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span><i className="fas fa-handshake text-amber-400 mr-1" />{engineerInterviews.length}回</span>
                          <span className="text-emerald-600 font-medium"><i className="fas fa-check-circle mr-1" />{passCount}勝</span>
                          <span className="text-red-500 font-medium"><i className="fas fa-times-circle mr-1" />{failCount}敗</span>
                          {latestInterview && (
                            <span><i className="fas fa-calendar-alt text-slate-400 mr-1" />最終: {latestInterview.interview_date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setEditingInterview(null);
                        setFormData({ ...formData, engineer: latestInterview?.engineer || '' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <i className="fas fa-plus text-[10px]" /> 新規面談
                    </button>
                  </div>

                  {/* 面談履歴列 */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-50 bg-slate-50">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">面談日</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">客先会社</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">結果</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">メモ</th>
                        <th className="px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {engineerInterviews.map((interview) => (
                        <tr key={interview.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(interview.interview_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-700">
                            {interview.client_company || <span className="text-slate-300">―</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultBadgeColor(interview.result)}`}>
                              {getResultText(interview.result)}
                            </span>
                            {interview.result === 'fail' && interview.rejection_reason && (
                              <span className="ml-2 text-xs text-red-500">{interview.rejection_reason}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs max-w-[16rem] truncate">
                            {interview.notes || <span className="text-slate-200">―</span>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button
                                onClick={() => handleEdit(interview)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 flex items-center justify-center transition-colors"
                              >
                                <i className="fas fa-pen text-xs" />
                              </button>
                              <button
                                onClick={() => handleDelete(interview.id)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                              >
                                <i className="fas fa-trash-alt text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

          {Object.keys(groupedByEngineer).length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <i className="fas fa-handshake text-3xl mb-3 block" />
              <p className="text-sm">お客様面談履歴がありません</p>
            </div>
          )}
        </div>
      )}

      {/* 面談記録フォームモーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-700">
                  {editingInterview ? '面談記録編集' : '新規面談記録'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingInterview(null);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              {/* 面談基本情報セクション */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-100">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-user-tie text-amber-600"></i>
                  面談基本情報
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-user text-amber-500 text-xs"></i>
                      エンジニア *
                    </label>
                    <select
                      value={formData.engineer}
                      onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      {engineers.map(engineer => (
                        <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-calendar text-amber-500 text-xs"></i>
                      面談日 *
                    </label>
                    <input
                      type="date"
                      value={formData.interview_date}
                      onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-building text-amber-500 text-xs"></i>
                      面談先企業名
                    </label>
                    <input
                      type="text"
                      value={formData.client_company}
                      onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="例：株式会社サンプル"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-clipboard-check text-amber-500 text-xs"></i>
                      面談結果 *
                    </label>
                    <select
                      value={formData.result}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="pass">合格</option>
                      <option value="fail">不合格</option>
                      <option value="pending">保留</option>
                      <option value="canceled">キャンセル</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 不合格理由（不合格の場合のみ表示） */}
              {formData.result === 'fail' && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                    不合格理由
                  </h4>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-comment-alt text-red-500 text-xs"></i>
                      詳細理由
                    </label>
                    <textarea
                      value={formData.rejection_reason}
                      onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="不合格理由を詳しく記載してください（技術面、コミュニケーション面、経験不足など）"
                    />
                  </div>
                </div>
              )}

              {/* フォローアップ情報セクション */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-clipboard-list text-blue-600"></i>
                  フォローアップ情報
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-sticky-note text-blue-500 text-xs"></i>
                      備考・その他メモ
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="面談の印象、追加情報、気づいたことなどを記載"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-tasks text-blue-500 text-xs"></i>
                      次回アクション
                    </label>
                    <textarea
                      value={formData.next_action}
                      onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="次回取るべきアクション、フォローアップ予定などを記載"
                    />
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-stone-200 bg-slate-50 -mx-8 -mb-8 px-8 pb-8 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInterview(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-600 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-slate-200 hover:to-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-times"></i>
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px]"
                >
                  <i className="fas fa-save"></i>
                  {editingInterview ? '面談記録を更新' : '面談記録を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 詳細表示モーダル */}
      {renderDetailModal()}
      </div>
    </div>
  );
}