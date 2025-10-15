import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';

export default function HREvaluation() {
  const { user } = useUser(); // アクセス制御の準備のため保持
  const [evaluations, setEvaluations] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [filters, setFilters] = useState({
    engineer_id: '',
    evaluation_type: '',
    date_from: '',
    date_to: ''
  });
  const [groupedByEngineer, setGroupedByEngineer] = useState({});

  // フォーム状態
  const [formData, setFormData] = useState({
    engineer: '',
    evaluation_date: '',
    evaluation_type: 'evaluation_interview',
    technical_skill: '',
    communication_skill: '',
    motivation: '',
    leadership: '',
    problem_solving: '',
    overall_rating: '',
    strengths: '',
    improvement_areas: '',
    goals_next_period: '',
    notes: ''
  });

  const fetchEvaluations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      // 人事評価のみを取得するフィルターを強制追加
      params.append('interview_type', 'evaluation_interview');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:8000/api/interviews/?${params}`);
      if (response.ok) {
        const data = await response.json();
        const evaluationsData = data.results || data;
        console.log('HR評価データ:', evaluationsData);
        setEvaluations(evaluationsData);
        
        // エンジニア別にグループ化
        const grouped = evaluationsData.reduce((acc, evaluation) => {
          const engineerName = evaluation.engineer_name || '未設定';
          if (!acc[engineerName]) {
            acc[engineerName] = [];
          }
          acc[engineerName].push(evaluation);
          return acc;
        }, {});
        
        // 各エンジニアの評価を日付順でソート
        Object.keys(grouped).forEach(engineerName => {
          grouped[engineerName].sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date));
        });
        
        setGroupedByEngineer(grouped);
      }
    } catch (error) {
      setError('人事評価データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvaluations();
    fetchEngineers();
  }, [fetchEvaluations]);

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
    
    const requestData = {
      engineer: formData.engineer, // エンジニアID
      interview_type: 'evaluation_interview',
      interview_date: formData.evaluation_date,
      // 評価項目を数値に変換（空文字列の場合はnull）
      technical_skill: formData.technical_skill ? parseInt(formData.technical_skill) : null,
      communication_skill: formData.communication_skill ? parseInt(formData.communication_skill) : null,
      motivation: formData.motivation ? parseInt(formData.motivation) : null,
      leadership: formData.leadership ? parseInt(formData.leadership) : null,
      problem_solving: formData.problem_solving ? parseInt(formData.problem_solving) : null,
      overall_rating: formData.overall_rating ? parseInt(formData.overall_rating) : null,
      // テキストフィールド
      strengths: formData.strengths || null,
      improvement_areas: formData.improvement_areas || null,
      goals_next_period: formData.goals_next_period || null,
      notes: formData.notes || null,
      // お客様面談用フィールドは空で送信
      client_company: null,
      result: 'pass', // 人事評価では基本的に実施済み
      rejection_reason: null,
      improvement_points: null,
      next_action: null
    };
    
    console.log('📤 送信データ:', requestData);
    
    try {
      const url = editingEvaluation 
        ? `http://localhost:8000/api/interviews/${editingEvaluation.id}/`
        : 'http://localhost:8000/api/interviews/';
      
      const method = editingEvaluation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        fetchEvaluations();
        setShowForm(false);
        setEditingEvaluation(null);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('API エラー:', errorData);
        setError(`人事評価の保存に失敗しました: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('ネットワークエラー:', error);
      setError(`ネットワークエラーが発生しました: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('この人事評価を削除しますか？')) {
      try {
        const response = await fetch(`http://localhost:8000/api/interviews/${id}/`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchEvaluations();
        }
      } catch (error) {
        setError('削除に失敗しました');
      }
    }
  };

  const handleEdit = (evaluation) => {
    console.log('編集対象データ:', evaluation);
    setEditingEvaluation(evaluation);
    setFormData({
      engineer: evaluation.engineer,
      evaluation_date: evaluation.interview_date,
      evaluation_type: evaluation.interview_type,
      // 数値を文字列に変換（null/undefinedの場合は空文字）
      technical_skill: evaluation.technical_skill ? String(evaluation.technical_skill) : '',
      communication_skill: evaluation.communication_skill ? String(evaluation.communication_skill) : '',
      motivation: evaluation.motivation ? String(evaluation.motivation) : '',
      leadership: evaluation.leadership ? String(evaluation.leadership) : '',
      problem_solving: evaluation.problem_solving ? String(evaluation.problem_solving) : '',
      overall_rating: evaluation.overall_rating ? String(evaluation.overall_rating) : '',
      strengths: evaluation.strengths || '',
      improvement_areas: evaluation.improvement_areas || '',
      goals_next_period: evaluation.goals_next_period || '',
      notes: evaluation.notes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      engineer: '',
      evaluation_date: '',
      evaluation_type: 'evaluation_interview',
      technical_skill: '',
      communication_skill: '',
      motivation: '',
      leadership: '',
      problem_solving: '',
      overall_rating: '',
      strengths: '',
      improvement_areas: '',
      goals_next_period: '',
      notes: ''
    });
  };

  const getSkillRatingText = (rating) => {
    // 数値と文字列の両方に対応
    const ratingStr = String(rating);
    switch (ratingStr) {
      case '1': return '1（要改善）';
      case '2': return '2（やや不足）';
      case '3': return '3（標準）';
      case '4': return '4（良好）';
      case '5': return '5（優秀）';
      default: return '未評価';
    }
  };

  const getSkillRatingColor = (rating) => {
    // 数値と文字列の両方に対応
    const ratingStr = String(rating);
    switch (ratingStr) {
      case '1': return 'bg-red-100 text-red-800 border-red-200';
      case '2': return 'bg-orange-100 text-orange-800 border-orange-200';
      case '3': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '4': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '5': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-luxury">
              <i className="fas fa-star text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-700 font-display">人事評価</h1>
              <p className="text-slate-500">エンジニア別評価面談記録・人事考課データ</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEvaluation(null);
              resetForm();
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          >
            <i className="fas fa-plus"></i>
            新規評価記録
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
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">全エンジニア</option>
            {engineers.map(engineer => (
              <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="開始日"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="終了日"
          />

          <button
            onClick={fetchEvaluations}
            className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <i className="fas fa-search"></i>
            検索
          </button>
        </div>
      </div>

      {/* エンジニア別評価一覧 */}
      <div className="space-y-6">
        {Object.keys(groupedByEngineer)
          .filter(engineerName => 
            !filters.engineer_id || 
            groupedByEngineer[engineerName].some(evaluation => evaluation.engineer === parseInt(filters.engineer_id))
          )
          .sort()
          .map(engineerName => {
            const engineerEvaluations = groupedByEngineer[engineerName];
            const latestEvaluation = engineerEvaluations[0];
            
            return (
              <div key={engineerName} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-luxury overflow-hidden">
                <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {engineerName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{engineerName}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-star text-purple-500"></i>
                            {engineerEvaluations.length}回の評価
                          </span>
                          {latestEvaluation && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-calendar text-indigo-500"></i>
                              最終評価: {latestEvaluation.interview_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setEditingEvaluation(null);
                        setFormData({ ...formData, engineer: latestEvaluation?.engineer || '' });
                      }}
                      className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      新規評価
                    </button>
                  </div>
                </div>
                
                {/* 評価履歴 */}
                <div className="p-6">
                  <div className="space-y-4">
                    {engineerEvaluations.map((evaluation, index) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-purple-500' : 'bg-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">
                              評価日: {evaluation.interview_date}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {evaluation.overall_rating && (
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getSkillRatingColor(evaluation.overall_rating)}`}>
                                  総合: {getSkillRatingText(evaluation.overall_rating)}
                                </span>
                              )}
                              {evaluation.technical_skill && (
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getSkillRatingColor(evaluation.technical_skill)}`}>
                                  技術: {getSkillRatingText(evaluation.technical_skill)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(evaluation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(evaluation.id)}
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
              <i className="fas fa-star text-4xl mb-4"></i>
              <p>人事評価がありません</p>
            </div>
          </div>
        )}
      </div>

      {/* 人事評価フォームモーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-700">
                  {editingEvaluation ? '人事評価編集' : '新規人事評価'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvaluation(null);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              {/* 評価基本情報セクション */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-user-check text-purple-600"></i>
                  評価基本情報
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-user text-purple-500 text-xs"></i>
                      エンジニア *
                    </label>
                    <select
                      value={formData.engineer}
                      onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      {engineers.map(engineer => (
                        <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-calendar text-purple-500 text-xs"></i>
                      評価日 *
                    </label>
                    <input
                      type="date"
                      value={formData.evaluation_date}
                      onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* スキル評価セクション */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  スキル評価（1-5段階）
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-code text-blue-500 text-xs"></i>
                      技術力
                    </label>
                    <select
                      value={formData.technical_skill}
                      onChange={(e) => setFormData({ ...formData, technical_skill: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">1（要改善）</option>
                      <option value="2">2（やや不足）</option>
                      <option value="3">3（標準）</option>
                      <option value="4">4（良好）</option>
                      <option value="5">5（優秀）</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-comments text-blue-500 text-xs"></i>
                      コミュニケーション力
                    </label>
                    <select
                      value={formData.communication_skill}
                      onChange={(e) => setFormData({ ...formData, communication_skill: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">1（要改善）</option>
                      <option value="2">2（やや不足）</option>
                      <option value="3">3（標準）</option>
                      <option value="4">4（良好）</option>
                      <option value="5">5（優秀）</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-fire text-blue-500 text-xs"></i>
                      やる気・意欲
                    </label>
                    <select
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">1（要改善）</option>
                      <option value="2">2（やや不足）</option>
                      <option value="3">3（標準）</option>
                      <option value="4">4（良好）</option>
                      <option value="5">5（優秀）</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-users text-blue-500 text-xs"></i>
                      リーダーシップ
                    </label>
                    <select
                      value={formData.leadership}
                      onChange={(e) => setFormData({ ...formData, leadership: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">⭐ 1（要改善）</option>
                      <option value="2">⭐⭐ 2（やや不足）</option>
                      <option value="3">⭐⭐⭐ 3（標準）</option>
                      <option value="4">⭐⭐⭐⭐ 4（良好）</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5（優秀）</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-lightbulb text-blue-500 text-xs"></i>
                      問題解決力
                    </label>
                    <select
                      value={formData.problem_solving}
                      onChange={(e) => setFormData({ ...formData, problem_solving: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">⭐ 1（要改善）</option>
                      <option value="2">⭐⭐ 2（やや不足）</option>
                      <option value="3">⭐⭐⭐ 3（標準）</option>
                      <option value="4">⭐⭐⭐⭐ 4（良好）</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5（優秀）</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-trophy text-blue-500 text-xs"></i>
                      総合評価
                    </label>
                    <select
                      value={formData.overall_rating}
                      onChange={(e) => setFormData({ ...formData, overall_rating: e.target.value })}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                    >
                      <option value="">選択してください</option>
                      <option value="1">⭐ 1（要改善）</option>
                      <option value="2">⭐⭐ 2（やや不足）</option>
                      <option value="3">⭐⭐⭐ 3（標準）</option>
                      <option value="4">⭐⭐⭐⭐ 4（良好）</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5（優秀）</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 定性評価セクション */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-comment-alt text-green-600"></i>
                  定性評価・コメント
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-thumbs-up text-green-500 text-xs"></i>
                      強み・評価点
                    </label>
                    <textarea
                      value={formData.strengths}
                      onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="優れている点、強みを具体的に記載してください..."
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>
                      改善領域
                    </label>
                    <textarea
                      value={formData.improvement_areas}
                      onChange={(e) => setFormData({ ...formData, improvement_areas: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="改善が必要な領域を記載してください..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-target text-green-500 text-xs"></i>
                      次期目標
                    </label>
                    <textarea
                      value={formData.goals_next_period}
                      onChange={(e) => setFormData({ ...formData, goals_next_period: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="次の評価期間での目標・期待値を記載してください..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                      <i className="fas fa-sticky-note text-green-500 text-xs"></i>
                      備考・その他
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                      placeholder="その他メモを記載してください..."
                    />
                  </div>
                </div>
              </div>

              {/* アクションボタンセクション */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-100 mt-6">
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEvaluation(null);
                      resetForm();
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-slate-200 hover:to-gray-200 transition-all duration-200 flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <i className="fas fa-times text-slate-500"></i>
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
                  >
                    <i className={`fas ${editingEvaluation ? 'fa-edit' : 'fa-save'} text-white`}></i>
                    {editingEvaluation ? '評価を更新' : '評価を保存'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}