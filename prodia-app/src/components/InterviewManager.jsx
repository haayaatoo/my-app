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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 min-h-screen">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-luxury">
              <i className="fas fa-comments text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-700 font-display">お客様面談履歴</h1>
              <p className="text-slate-500">エンジニア別お客様面談記録・分析データ</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingInterview(null);
              resetForm();
            }}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          >
            <i className="fas fa-plus"></i>
            新規面談記録
          </button>
        </div>
      </div>

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
      <div className="mb-8 p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-luxury">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">検索・フィルター</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.engineer_id}
            onChange={(e) => setFilters({ ...filters, engineer_id: e.target.value })}
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">全エンジニア</option>
            {engineers.map(engineer => (
              <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
            ))}
          </select>

          <select
            value={filters.result}
            onChange={(e) => setFilters({ ...filters, result: e.target.value })}
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="開始日"
          />

          <button
            onClick={fetchInterviews}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <i className="fas fa-search"></i>
            検索
          </button>
        </div>
      </div>

      {/* 面談履歴一覧 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-luxury overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-slate-700">面談履歴一覧 ({interviews.length}件)</h3>
        </div>
        
        {/* エンジニア別面談履歴一覧 */}
        <div className="space-y-6">
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
                <div key={engineerName} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-luxury overflow-hidden">
                  <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {engineerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{engineerName}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                            <span className="flex items-center gap-1">
                              <i className="fas fa-handshake text-amber-500"></i>
                              {engineerInterviews.length}回の面談
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="fas fa-check-circle text-green-500"></i>
                              {passCount}勝
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="fas fa-times-circle text-red-500"></i>
                              {failCount}敗
                            </span>
                            {latestInterview && (
                              <span className="flex items-center gap-1">
                                <i className="fas fa-calendar text-amber-500"></i>
                                最終面談: {latestInterview.interview_date}
                              </span>
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
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        新規面談
                      </button>
                    </div>
                  </div>
                  
                  {/* 面談履歴 */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {engineerInterviews.map((interview, index) => (
                        <div key={interview.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-amber-500' : 'bg-gray-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-slate-700">
                                {interview.interview_date} - {interview.client_company || '面談先未設定'}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getResultBadgeColor(interview.result)}`}>
                                  {getResultText(interview.result)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {getInterviewTypeText(interview.interview_type)}
                                </span>
                                {interview.result === 'fail' && interview.rejection_reason && (
                                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    理由: {interview.rejection_reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(interview)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(interview.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            
          {Object.keys(groupedByEngineer).length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-4">
                <i className="fas fa-handshake text-4xl mb-4"></i>
                <p>お客様面談履歴がありません</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}