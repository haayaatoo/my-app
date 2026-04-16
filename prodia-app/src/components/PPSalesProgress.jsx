import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';

// カンバンボードのカラム定義
const KANBAN_COLUMNS = [
  { id: 'scheduling', title: '日程調整中', icon: 'fa-calendar-plus', color: 'from-slate-500 to-slate-600' },
  { id: 'scheduled', title: '面談予定', icon: 'fa-calendar-check', color: 'from-blue-500 to-blue-600' },
  { id: 'completed', title: '面談済み／回答待ち', icon: 'fa-handshake', color: 'from-indigo-500 to-indigo-600' },
  { id: 'won', title: '成約', icon: 'fa-trophy', color: 'from-emerald-500 to-emerald-600' },
  { id: 'lost', title: '見送り', icon: 'fa-times-circle', color: 'from-red-500 to-red-600' }
];

// ステータスとカラムのマッピング
const STATUS_TO_COLUMN = {
  '日程調整中': 'scheduling',
  '面談予定': 'scheduled',
  '面談済み': 'completed',
  '回答待ち': 'completed',
  '面談済み／回答待ち': 'completed',
  '成約': 'won',
  '見送り': 'lost'
};

const COLUMN_TO_STATUS = {
  'scheduling': '日程調整中',
  'scheduled': '面談予定',
  'completed': '面談済み／回答待ち',
  'won': '成約',
  'lost': '見送り'
};

// 単価表示用: 数値文字列に3桁コンマを挿入
const formatUnitPrice = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const raw = String(val).replace(/,/g, '');
  if (!/^\d*\.?\d*$/.test(raw)) return val;
  const [int, dec] = raw.split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
};

export default function PPSalesProgress() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all'); // デフォルトは「すべて」表示（新規登録後すぐ表示されるように）
  const [selectedSales, setSelectedSales] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  
  // 自動スクロール用のref
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  // 新規面談フォーム
  const [newInterview, setNewInterview] = useState({
    engineer_name: '',
    company_name: '',
    interview_date: '',
    interview_time: '',
    sales_person: '温水',
    status: '日程調整中',
    start_month: '',
    response_deadline: '',
    unit_price: '',
    notes: ''
  });

  // 初回マウント時にAPIからデータ取得
  useEffect(() => {
    apiFetch('/pp-interviews/')
      .then(res => res.json())
      .then(data => {
        setInterviews(Array.isArray(data) ? data : (data.results || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 開始月ごとにグループ化
  const groupedByMonth = interviews.reduce((acc, interview) => {
    const month = interview.start_month || '未定';
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(interview);
    return acc;
  }, {});

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (e, interview) => {
    setDraggedItem(interview);
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグ中の自動スクロール処理
  const handleDrag = (e) => {
    if (!scrollContainerRef.current || !draggedItem) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollThreshold = 100; // スクロール開始までの距離（px）
    const scrollSpeed = 10; // スクロール速度
    
    // マウスがコンテナの左端に近い場合
    if (e.clientX - rect.left < scrollThreshold && e.clientX > 0) {
      if (!autoScrollIntervalRef.current) {
        autoScrollIntervalRef.current = setInterval(() => {
          container.scrollLeft -= scrollSpeed;
        }, 16);
      }
    }
    // マウスがコンテナの右端に近い場合
    else if (rect.right - e.clientX < scrollThreshold && e.clientX > 0) {
      if (!autoScrollIntervalRef.current) {
        autoScrollIntervalRef.current = setInterval(() => {
          container.scrollLeft += scrollSpeed;
        }, 16);
      }
    }
    // 自動スクロールを停止
    else {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newStatus = COLUMN_TO_STATUS[columnId];
    if (draggedItem.status === newStatus) {
      setDraggedItem(null);
      return;
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newHistory = [
      ...(draggedItem.history || []),
      { timestamp, user: draggedItem.sales_person, changes: [{ field: 'ステータス', old: draggedItem.status, new: newStatus }] }
    ];

    apiFetch(`/pp-interviews/${draggedItem.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, history: newHistory }),
    }).then(res => res.json()).then(updated => {
      setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i));
    });

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    // 自動スクロールを停止
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // フィルタリング（カンバンボード用）
  const filteredInterviews = interviews.filter(interview => {
    const monthMatch = selectedMonth === 'all' || interview.start_month === selectedMonth;
    const salesMatch = selectedSales === 'all' || interview.sales_person === selectedSales;
    return monthMatch && salesMatch;
  });

  // カラムごとにグループ化
  const getInterviewsByColumn = (columnId) => {
    if (columnId === 'completed') {
      return filteredInterviews.filter(interview =>
        ['面談済み', '回答待ち', '面談済み／回答待ち'].includes(interview.status)
      );
    }
    const status = COLUMN_TO_STATUS[columnId];
    return filteredInterviews.filter(interview => interview.status === status);
  };

  // ステータスの色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case '面談済み／回答待ち':
      case '面談済み':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case '面談予定':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case '回答待ち':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case '日程調整中':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case '見送り':
        return 'bg-red-100 text-red-700 border-red-300';
      case '成約':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // 営業担当者の色を取得
  const getSalesPersonColor = (person) => {
    const colors = {
      '温水': 'bg-gradient-to-br from-orange-400 to-orange-600',
      '瀬戸山': 'bg-gradient-to-br from-green-400 to-green-600',
      '上前': 'bg-gradient-to-br from-purple-400 to-purple-600',
      '岡田': 'bg-gradient-to-br from-blue-400 to-blue-600',
      '野田': 'bg-gradient-to-br from-pink-400 to-rose-600',
      '服部': 'bg-gradient-to-br from-cyan-400 to-teal-600',
      '山口': 'bg-gradient-to-br from-amber-400 to-yellow-600'
    };
    return colors[person] || 'bg-gradient-to-br from-gray-400 to-gray-600';
  };

  // 新規面談追加
  const handleAddInterview = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const payload = {
      ...newInterview,
      history: [{ timestamp, user: newInterview.sales_person || '不明', changes: [{ field: '作成', old: '', new: '新規登録' }] }]
    };
    apiFetch('/pp-interviews/', { method: 'POST', body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(created => {
        setInterviews(prev => [created, ...prev]);
        setShowNewInterviewModal(false);
        setNewInterview({ engineer_name: '', company_name: '', interview_date: '', interview_time: '', sales_person: '温水', status: '日程調整中', start_month: '', response_deadline: '', unit_price: '', notes: '' });
      });
  };

  // 編集処理
  const handleEditInterview = () => {
    if (!editingInterview) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const originalInterview = interviews.find(i => i.id === editingInterview.id);
    const fieldNames = { engineer_name: 'エンジニア名', company_name: '企業名', interview_date: '面談日', interview_time: '面談時刻', sales_person: '営業担当', status: 'ステータス', start_month: '開始月', response_deadline: '回答期限', notes: '備考' };
    const changes = Object.keys(fieldNames).filter(f => originalInterview[f] !== editingInterview[f]).map(f => ({ field: fieldNames[f], old: originalInterview[f] || '(なし)', new: editingInterview[f] || '(なし)' }));
    const updatedHistory = changes.length > 0 ? [...(originalInterview.history || []), { timestamp, user: editingInterview.sales_person || '不明', changes }] : (originalInterview.history || []);
    const payload = { ...editingInterview, history: updatedHistory };
    apiFetch(`/pp-interviews/${editingInterview.id}/`, { method: 'PUT', body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(updated => {
        setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i));
        setShowEditModal(false);
        setEditingInterview(null);
      });
  };

  // 編集モーダルを開く
  const openEditModal = (interview) => {
    setEditingInterview({ ...interview });
    setShowEditModal(true);
  };

  // 削除処理
  const handleDeleteInterview = (id) => {
    if (window.confirm('この面談情報を削除してもよろしいですか?')) {
      apiFetch(`/pp-interviews/${id}/`, { method: 'DELETE' })
        .then(() => setInterviews(prev => prev.filter(i => i.id !== id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* フィルター */}
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <i className="fas fa-filter text-slate-400"></i>絞り込み
          </h2>
          <button
            onClick={() => setShowNewInterviewModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <i className="fas fa-plus-circle text-xs"></i>
            <span>新規面談追加</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <i className="fas fa-calendar mr-2"></i>開始月で絞り込み
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">すべての月</option>
              {Object.keys(groupedByMonth).sort().reverse().map(month => (
                <option key={month} value={month}>
                  {month === '未定' ? '未定' : `${parseInt(month.split('-')[1])}月開始`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <i className="fas fa-user mr-2"></i>営業担当で絞り込み
            </label>
            <select
              value={selectedSales}
              onChange={(e) => setSelectedSales(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">すべての担当者</option>
              <option value="温水">温水</option>
              <option value="瀬戸山">瀬戸山</option>
              <option value="上前">上前</option>
              <option value="岡田">岡田</option>
              <option value="野田">野田</option>
              <option value="服部">服部</option>
              <option value="山口">山口</option>
            </select>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-clipboard-list text-3xl opacity-80"></i>
            <span className="text-4xl font-bold">{filteredInterviews.length}</span>
          </div>
          <p className="text-blue-100">
            {selectedMonth === 'all' ? '総面談数' : `${selectedMonth.split('-')[1]}月面談数`}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-check-circle text-3xl opacity-80"></i>
            <span className="text-4xl font-bold">
              {filteredInterviews.filter(i => i.status === '成約').length}
            </span>
          </div>
          <p className="text-emerald-100">
            {selectedMonth === 'all' ? '成約済み' : `${selectedMonth.split('-')[1]}月成約`}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-clock text-3xl opacity-80"></i>
            <span className="text-4xl font-bold">
              {filteredInterviews.filter(i => ['面談予定', '面談済み', '回答待ち', '面談済み／回答待ち'].includes(i.status)).length}
            </span>
          </div>
          <p className="text-amber-100">進行中</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-users text-3xl opacity-80"></i>
            <span className="text-4xl font-bold">
              {new Set(filteredInterviews.map(i => i.engineer_name)).size}
            </span>
          </div>
          <p className="text-purple-100">対象エンジニア</p>
        </div>
      </div>

      {/* カンバンボード説明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
        <div className="flex items-center gap-3 text-blue-800">
          <i className="fas fa-info-circle text-xl"></i>
          <p className="text-sm font-medium">
            <strong>操作方法:</strong> カードをドラッグ&ドロップしてステータスを変更できます
            <span className="ml-3 text-blue-600">|</span>
            <span className="ml-3">カードをクリックで詳細表示</span>
          </p>
        </div>
      </div>

      {/* カンバンボード（パイプラインビュー） */}
      <div 
        ref={scrollContainerRef}
        className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6 overflow-x-auto"
      >
        <div className="flex gap-4 min-w-max">
          {KANBAN_COLUMNS.map((column, columnIndex) => {
            const columnInterviews = getInterviewsByColumn(column.id);
            
            return (
              <div 
                key={column.id}
                className="flex-shrink-0 w-80 animate-slideInFromLeft"
                style={{ animationDelay: `${columnIndex * 0.1}s` }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* カラムヘッダー */}
                <div className={`bg-gradient-to-r ${column.color} text-white rounded-2xl p-4 mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <i className={`fas ${column.icon} text-xl`}></i>
                      <h3 className="font-bold text-lg">{column.title}</h3>
                    </div>
                    <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                      {columnInterviews.length}
                    </span>
                  </div>
                </div>

                {/* カードリスト */}
                <div className="space-y-3 min-h-[400px]">
                  {columnInterviews.map((interview, cardIndex) => (
                    <div 
                      key={interview.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, interview)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                      style={{ animationDelay: `${(columnIndex * 0.1) + (cardIndex * 0.05)}s` }}
                      className={`bg-white rounded-xl border-2 border-slate-200 p-4 cursor-move hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 animate-fadeInUp ${
                        draggedItem?.id === interview.id ? 'opacity-50 scale-95 rotate-2' : ''
                      }`}
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowDetailModal(true);
                      }}
                    >
                      {/* エンジニア名 */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user text-white text-sm"></i>
                        </div>
                        <p className="font-bold text-slate-800 truncate flex-1">{interview.engineer_name}</p>
                      </div>

                      {/* 企業名 */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-building text-white text-sm"></i>
                        </div>
                        <p className="text-sm text-slate-600 truncate flex-1">{interview.company_name}</p>
                      </div>

                      {/* 営業担当 */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`${getSalesPersonColor(interview.sales_person)} px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm`}>
                          {interview.sales_person}
                        </div>
                      </div>

                      {/* 面談日 */}
                      {interview.interview_date && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <i className="fas fa-calendar"></i>
                          <span>
                            {new Date(interview.interview_date).toLocaleDateString('ja-JP', { 
                              month: 'numeric', 
                              day: 'numeric'
                            })}
                            {interview.interview_time && ` ${interview.interview_time}`}
                          </span>
                        </div>
                      )}

                      {/* 開始月 */}
                      {interview.start_month && interview.start_month !== '未定' && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <i className="fas fa-arrow-right"></i>
                          <span>{parseInt(interview.start_month.split('-')[1])}月開始予定</span>
                        </div>
                      )}

                      {/* 回答期限（アラート） */}
                      {interview.response_deadline && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <i className="fas fa-hourglass-half"></i>
                            <span className="font-semibold">
                              {new Date(interview.response_deadline).toLocaleDateString('ja-JP', { 
                                month: 'numeric', 
                                day: 'numeric'
                              })}まで
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ドラッグヒント */}
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center text-xs text-slate-400">
                        <i className="fas fa-grip-vertical mr-2"></i>
                        ドラッグで移動
                      </div>
                    </div>
                  ))}

                  {/* 空の状態 */}
                  {columnInterviews.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <i className={`fas ${column.icon} text-4xl mb-3 opacity-20`}></i>
                      <p className="text-sm">案件なし</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細モーダル */}
      {showDetailModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedInterview.engineer_name}</h3>
                  <p className="text-blue-100">{selectedInterview.company_name}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">ステータス</p>
                  <p className="font-bold text-slate-800">{selectedInterview.status}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">営業担当</p>
                  <p className="font-bold text-slate-800">{selectedInterview.sales_person}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">面談日</p>
                  <p className="font-bold text-slate-800">
                    {selectedInterview.interview_date 
                      ? new Date(selectedInterview.interview_date).toLocaleDateString('ja-JP') + ' ' + (selectedInterview.interview_time || '')
                      : '未定'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">開始月</p>
                  <p className="font-bold text-slate-800">{selectedInterview.start_month || '未定'}</p>
                </div>
              </div>

              {selectedInterview.response_deadline && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-700 mb-1">回答期限</p>
                  <p className="font-bold text-amber-900">
                    {new Date(selectedInterview.response_deadline).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}

              {selectedInterview.notes && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 mb-2">備考</p>
                  <p className="text-slate-700">{selectedInterview.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedInterview);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>
                  編集
                </button>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDeleteInterview(selectedInterview.id);
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規面談追加モーダル */}
      {showNewInterviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <i className="fas fa-plus-circle"></i>
                新規面談追加
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">エンジニア名 *</label>
                  <input
                    type="text"
                    value={newInterview.engineer_name}
                    onChange={(e) => setNewInterview({ ...newInterview, engineer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 浜田"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">企業名 *</label>
                  <input
                    type="text"
                    value={newInterview.company_name}
                    onChange={(e) => setNewInterview({ ...newInterview, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: メイテツコム"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">面談日</label>
                  <input
                    type="date"
                    value={newInterview.interview_date}
                    onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                  <input
                    type="time"
                    value={newInterview.interview_time}
                    onChange={(e) => setNewInterview({ ...newInterview, interview_time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">営業担当 *</label>
                  <select
                    value={newInterview.sales_person}
                    onChange={(e) => setNewInterview({ ...newInterview, sales_person: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="温水">温水</option>
                    <option value="瀬戸山">瀬戸山</option>
                    <option value="上前">上前</option>
                    <option value="岡田">岡田</option>
                    <option value="野田">野田</option>
                    <option value="服部">服部</option>
                    <option value="山口">山口</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ステータス *</label>
                  <select
                    value={newInterview.status}
                    onChange={(e) => setNewInterview({ ...newInterview, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="日程調整中">日程調整中</option>
                    <option value="面談予定">面談予定</option>
                    <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                    <option value="成約">成約</option>
                    <option value="見送り">見送り</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">開始月 *</label>
                  <input
                    type="month"
                    value={newInterview.start_month}
                    onChange={(e) => setNewInterview({ ...newInterview, start_month: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">回答期限</label>
                  <input
                    type="date"
                    value={newInterview.response_deadline}
                    onChange={(e) => setNewInterview({ ...newInterview, response_deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">単価（万円）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatUnitPrice(newInterview.unit_price)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        setNewInterview({ ...newInterview, unit_price: raw });
                      }
                    }}
                    className="w-full pl-8 pr-12 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 80"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">万円</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                <textarea
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="メモや特記事項を入力"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddInterview}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  <i className="fas fa-check mr-2"></i>
                  追加
                </button>
                <button
                  onClick={() => setShowNewInterviewModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300"
                >
                  <i className="fas fa-times mr-2"></i>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <i className="fas fa-edit"></i>
                面談情報編集
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 編集フォーム */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">エンジニア名 *</label>
                    <input
                      type="text"
                      value={editingInterview.engineer_name}
                      onChange={(e) => setEditingInterview({ ...editingInterview, engineer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">企業名 *</label>
                    <input
                      type="text"
                      value={editingInterview.company_name}
                      onChange={(e) => setEditingInterview({ ...editingInterview, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談日</label>
                    <input
                      type="date"
                      value={editingInterview.interview_date}
                      onChange={(e) => setEditingInterview({ ...editingInterview, interview_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                    <input
                      type="time"
                      value={editingInterview.interview_time}
                      onChange={(e) => setEditingInterview({ ...editingInterview, interview_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">営業担当 *</label>
                    <select
                      value={editingInterview.sales_person}
                      onChange={(e) => setEditingInterview({ ...editingInterview, sales_person: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="温水">温水</option>
                      <option value="瀬戸山">瀬戸山</option>
                      <option value="上前">上前</option>
                      <option value="岡田">岡田</option>
                      <option value="野田">野田</option>
                      <option value="服部">服部</option>
                      <option value="山口">山口</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ステータス *</label>
                    <select
                      value={editingInterview.status}
                      onChange={(e) => setEditingInterview({ ...editingInterview, status: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="日程調整中">日程調整中</option>
                      <option value="面談予定">面談予定</option>
                      <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                      <option value="成約">成約</option>
                      <option value="見送り">見送り</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始月 *</label>
                    <input
                      type="month"
                      value={editingInterview.start_month}
                      onChange={(e) => setEditingInterview({ ...editingInterview, start_month: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">回答期限</label>
                    <input
                      type="date"
                      value={editingInterview.response_deadline}
                      onChange={(e) => setEditingInterview({ ...editingInterview, response_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">単価（万円）</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatUnitPrice(editingInterview.unit_price || '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          setEditingInterview({ ...editingInterview, unit_price: raw });
                        }
                      }}
                      className="w-full pl-8 pr-12 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: 80"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">万円</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                  <textarea
                    value={editingInterview.notes}
                    onChange={(e) => setEditingInterview({ ...editingInterview, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>

              {/* 編集履歴 */}
              {editingInterview.history && editingInterview.history.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-history text-blue-500"></i>
                    編集履歴
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {editingInterview.history.slice().reverse().map((entry, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-user-circle text-blue-500"></i>
                            <span className="font-medium text-slate-700">{entry.user}</span>
                          </div>
                          <span className="text-sm text-slate-500">{entry.timestamp}</span>
                        </div>
                        <div className="space-y-1">
                          {entry.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="text-sm">
                              <span className="font-medium text-slate-700">{change.field}:</span>
                              {change.old && change.old !== '(なし)' && (
                                <span className="text-red-600 line-through ml-2">{change.old}</span>
                              )}
                              {change.new && change.new !== '(なし)' && (
                                <span className="text-green-600 font-medium ml-2">→ {change.new}</span>
                              )}
                              {change.new === '新規登録' && (
                                <span className="text-blue-600 font-medium ml-2">{change.new}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleEditInterview}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  <i className="fas fa-save mr-2"></i>
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingInterview(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300"
                >
                  <i className="fas fa-times mr-2"></i>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
