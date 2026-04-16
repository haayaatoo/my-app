import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';

// カンバンボードのカラム定義
const KANBAN_COLUMNS = [
  { id: 'scheduling', title: '日程調整中', icon: 'fa-calendar-plus', color: 'from-slate-500 to-slate-600' },
  { id: 'scheduled', title: '面談予定', icon: 'fa-calendar-check', color: 'from-blue-500 to-blue-600' },
  { id: 'completed', title: '面談済み／回答待ち', icon: 'fa-handshake', color: 'from-indigo-500 to-indigo-600' },
  { id: 'won', title: '成約', icon: 'fa-trophy', color: 'from-emerald-500 to-emerald-600' },
  { id: 'declined', title: '見送り', icon: 'fa-times-circle', color: 'from-red-500 to-red-600' }
];

// ステータスとカラムのマッピング
const STATUS_TO_COLUMN = {
  '日程調整中': 'scheduling',
  '面談予定': 'scheduled',
  '面談済み': 'completed',
  '回答待ち': 'completed',
  '面談済み／回答待ち': 'completed',
  '成約': 'won',
  '見送り': 'declined'
};

const COLUMN_TO_STATUS = {
  'scheduling': '日程調整中',
  'scheduled': '面談予定',
  'completed': '面談済み／回答待ち',
  'won': '成約',
  'declined': '見送り'
};

export default function BPProgress() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProspectModal, setShowNewProspectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editingProspect, setEditingProspect] = useState(null);
  const [selectedPlanner, setSelectedPlanner] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  
  // 自動スクロール用のref
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  // 新規BP見込みフォーム
  const [newProspect, setNewProspect] = useState({
    company_name: '',
    engineer_name: '',
    supplier_name: '',
    interview_date: '',
    interview_time: '',
    decision_date: '',
    start_month: '',
    sales_price: '',
    purchase_price: '',
    main_planner: '温水',
    support_planners: [],
    priority: '中',
    status: '日程調整中',
    notes: ''
  });

  // プランナーリスト
  const planners = ['温水', '瀬戸山', '上前', '岡田', '野田', '服部', '山口'];

  // 初回マウント時にAPIからデータ取得
  useEffect(() => {
    apiFetch('/bp-prospects/')
      .then(res => res.json())
      .then(data => {
        setProspects(Array.isArray(data) ? data : (data.results || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // プランナー別面談件数を計算
  const calculatePlannerStats = () => {
    const stats = {};
    planners.forEach(planner => {
      stats[planner] = { main: 0, support: 0, total: 0 };
    });

    prospects.forEach(prospect => {
      // メインプランナー
      if (stats[prospect.main_planner]) {
        stats[prospect.main_planner].main += prospect.interview_count.main;
      }
      
      // サポートプランナー
      prospect.support_planners.forEach(sp => {
        if (stats[sp]) {
          const supportCount = prospect.interview_count.support / prospect.support_planners.length;
          stats[sp].support += supportCount;
        }
      });
    });

    // 合計を計算
    Object.keys(stats).forEach(planner => {
      stats[planner].total = stats[planner].main + stats[planner].support;
    });

    return stats;
  };

  const plannerStats = calculatePlannerStats();

  // フィルタリング
  const filteredProspects = prospects.filter(prospect => {
    const plannerMatch = selectedPlanner === 'all' || 
      prospect.main_planner === selectedPlanner || 
      prospect.support_planners.includes(selectedPlanner);
    const priorityMatch = selectedPriority === 'all' || prospect.priority === selectedPriority;
    
    return plannerMatch && priorityMatch;
  });

  // ステータス別の件数を計算
  const getStatusCounts = () => {
    const counts = {
      '日程調整中': 0,
      '面談予定': 0,
      '面談済み／回答待ち': 0,
      '成約': 0,
      '見送り': 0,
      '保留': 0
    };
    
    prospects.forEach(prospect => {
      const key = ['面談済み', '回答待ち'].includes(prospect.status)
        ? '面談済み／回答待ち'
        : prospect.status;
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (e, prospect) => {
    setDraggedItem(prospect);
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
      { timestamp, user: draggedItem.main_planner, changes: [{ field: 'ステータス', old: draggedItem.status, new: newStatus }] }
    ];

    apiFetch(`/bp-prospects/${draggedItem.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, history: newHistory }),
    }).then(res => res.json()).then(updated => {
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
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

  // カラムごとにグループ化
  const getProspectsByColumn = (columnId) => {
    if (columnId === 'completed') {
      return filteredProspects.filter(prospect =>
        ['面談済み', '回答待ち', '面談済み／回答待ち'].includes(prospect.status)
      );
    }
    const status = COLUMN_TO_STATUS[columnId];
    return filteredProspects.filter(prospect => prospect.status === status);
  };

  // 優先度の色を取得
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高':
        return 'text-red-600 bg-red-50 border-red-200';
      case '中':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case '低':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case '高':
        return 'fa-exclamation-circle';
      case '中':
        return 'fa-minus-circle';
      case '低':
        return 'fa-info-circle';
      default:
        return 'fa-circle';
    }
  };

  // 新規見込み追加
  const handleAddProspect = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const payload = {
      ...newProspect,
      interview_count: { main: 1, support: newProspect.support_planners.length > 0 ? 0.5 : 0 },
      history: [{ timestamp, user: newProspect.main_planner || '不明', changes: [{ field: '作成', old: '', new: '新規登録' }] }]
    };
    apiFetch('/bp-prospects/', { method: 'POST', body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(created => {
        setProspects(prev => [created, ...prev]);
        setShowNewProspectModal(false);
        setNewProspect({ company_name: '', engineer_name: '', supplier_name: '', interview_date: '', interview_time: '', decision_date: '', start_month: '', sales_price: '', purchase_price: '', main_planner: '温水', support_planners: [], priority: '中', status: '日程調整中', notes: '' });
      });
  };

  // 編集モーダルを開く
  const handleEdit = (prospect) => {
    setEditingProspect({ ...prospect });
    setShowEditModal(true);
  };

  // 編集を保存
  const handleSaveEdit = () => {
    apiFetch(`/bp-prospects/${editingProspect.id}/`, { method: 'PUT', body: JSON.stringify(editingProspect) })
      .then(res => res.json())
      .then(updated => {
        setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
        setShowEditModal(false);
        setEditingProspect(null);
      });
  };

  // 削除
  const handleDelete = (id) => {
    if (window.confirm('この見込みを削除してもよろしいですか？')) {
      apiFetch(`/bp-prospects/${id}/`, { method: 'DELETE' })
        .then(() => setProspects(prev => prev.filter(p => p.id !== id)));
    }
  };

  // サポートプランナーのトグル
  const toggleSupportPlanner = (planner) => {
    const current = newProspect.support_planners;
    if (current.includes(planner)) {
      setNewProspect({
        ...newProspect,
        support_planners: current.filter(p => p !== planner)
      });
    } else {
      setNewProspect({
        ...newProspect,
        support_planners: [...current, planner]
      });
    }
  };

  const toggleEditSupportPlanner = (planner) => {
    const current = editingProspect.support_planners;
    if (current.includes(planner)) {
      setEditingProspect({
        ...editingProspect,
        support_planners: current.filter(p => p !== planner)
      });
    } else {
      setEditingProspect({
        ...editingProspect,
        support_planners: [...current, planner]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100">
      <div className="max-w-[1800px] mx-auto">
        {/* プランナー別面談件数サマリー */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-users text-amber-500"></i>
            プランナー別面談件数
          </h3>
          <div className="flex gap-4 mb-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <i className="fas fa-briefcase text-blue-500"></i>
              <span className="text-blue-600 font-medium">クライアント</span>
              <span>= メインプランナー担当</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-handshake text-purple-500"></i>
              <span className="text-purple-600 font-medium">クロスマッチング</span>
              <span>= クロスマッチング担当</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {planners.map(planner => (
              <div 
                key={planner}
                className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-xl p-4 border border-amber-200/30 hover:shadow-md transition-all duration-300"
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700 mb-2">{planner}</div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {plannerStats[planner].total.toFixed(1)}件
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <i className="fas fa-briefcase text-xs"></i>
                      <span>クライアント: {plannerStats[planner].main.toFixed(1)}件</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-purple-600">
                      <i className="fas fa-handshake text-xs"></i>
                      <span>パートナー: {plannerStats[planner].support.toFixed(1)}件</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ステータスサマリー */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-amber-500"></i>
            ステータス別件数
          </h3>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div 
                key={status}
                className="bg-gradient-to-br from-slate-50 to-stone-50 rounded-xl p-4 border border-slate-200/30 text-center"
              >
                <div className="text-sm text-slate-600 mb-1">{status}</div>
                <div className="text-2xl font-bold text-slate-700">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <i className="fas fa-filter text-slate-500"></i>
              <span className="text-slate-600 font-medium">フィルター:</span>
            </div>
            
            <select
              value={selectedPlanner}
              onChange={(e) => setSelectedPlanner(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">全プランナー</option>
              {planners.map(planner => (
                <option key={planner} value={planner}>{planner}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">全優先度</option>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-slate-600 text-sm">
                表示件数: <span className="font-bold text-amber-600">{filteredProspects.length}</span> / {prospects.length}
              </span>
              <button
                onClick={() => setShowNewProspectModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl hover:shadow-md transition-all duration-300 flex items-center gap-2 font-medium text-sm"
              >
                <i className="fas fa-plus text-xs"></i>
                新規見込み登録
              </button>
            </div>
          </div>
        </div>

        {/* カンバンボード説明 */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-200 mb-6">
          <div className="flex items-center gap-3 text-amber-800">
            <i className="fas fa-info-circle text-xl"></i>
            <p className="text-sm font-medium">
              <strong>操作方法:</strong> カードをドラッグ&ドロップしてステータスを変更 
              <span className="ml-3 text-amber-600">|</span>
              <span className="ml-3">カードクリックで詳細表示</span>
              <span className="ml-3 text-amber-600">|</span>
              <span className="ml-3">🔴=高優先度 🟡=中優先度 🔵=低優先度</span>
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
              const columnProspects = getProspectsByColumn(column.id);
              
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
                        {columnProspects.length}
                      </span>
                    </div>
                  </div>

                  {/* カードリスト */}
                  <div className="space-y-3 min-h-[400px]">
                    {columnProspects.map((prospect, cardIndex) => (
                      <div 
                        key={prospect.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, prospect)}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        style={{ animationDelay: `${(columnIndex * 0.1) + (cardIndex * 0.05)}s` }}
                        className={`bg-white rounded-xl border-2 border-slate-200 p-4 cursor-move hover:shadow-xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-200 animate-fadeInUp ${
                          draggedItem?.id === prospect.id ? 'opacity-50 scale-95 rotate-2' : ''
                        }`}
                        onClick={() => {
                          setSelectedProspect(prospect);
                          setShowDetailModal(true);
                        }}
                      >
                        {/* 優先度アイコン */}
                        <div className="flex items-center justify-between mb-3">
                          <div className={`px-3 py-1 rounded-lg border-2 font-bold text-xs flex items-center gap-2 ${getPriorityColor(prospect.priority)}`}>
                            <i className={`fas ${getPriorityIcon(prospect.priority)}`}></i>
                            {prospect.priority}
                          </div>
                        </div>

                        {/* クライアント + メインプランナー セクション */}
                        <div className="bg-blue-50 rounded-xl p-3 mb-2 border-l-4 border-blue-400">
                          <div className="flex items-center gap-1 mb-2">
                            <i className="fas fa-briefcase text-blue-500 text-xs"></i>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">クライアント側</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-building text-white text-xs"></i>
                            </div>
                            <p className="font-bold text-slate-800 truncate flex-1">{prospect.company_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-user-tie text-amber-500 text-xs"></i>
                            <span className="text-xs text-slate-500">担当:</span>
                            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 px-2 py-0.5 rounded-lg text-white text-xs font-bold shadow-sm inline-block">
                              {prospect.main_planner}
                            </div>
                          </div>
                        </div>

                        {/* パートナー + クロスマッチング セクション */}
                        <div className="bg-purple-50 rounded-xl p-3 mb-3 border-l-4 border-purple-400">
                          <div className="flex items-center gap-1 mb-2">
                            <i className="fas fa-handshake text-purple-500 text-xs"></i>
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">パートナー側</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-user text-white text-xs"></i>
                            </div>
                            <p className="text-sm text-slate-700 font-medium truncate flex-1">{prospect.engineer_name}</p>
                          </div>
                          {prospect.supplier_name && (
                            <div className="flex items-center gap-2 mb-2 ml-9">
                              <i className="fas fa-truck text-slate-400 text-xs"></i>
                              <p className="text-xs text-slate-500 truncate">{prospect.supplier_name}</p>
                            </div>
                          )}
                          {prospect.support_planners.length > 0 ? (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <i className="fas fa-users text-purple-400 text-xs"></i>
                              <span className="text-xs text-slate-500 mr-1">担当:</span>
                              {prospect.support_planners.map(sp => (
                                <span
                                  key={sp}
                                  className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-md text-xs font-semibold"
                                >
                                  {sp}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-2">
                              <i className="fas fa-users text-slate-300 text-xs"></i>
                              <span className="text-xs text-slate-400">サポートなし</span>
                            </div>
                          )}
                        </div>

                        {/* 面談日 */}
                        {prospect.interview_date && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <i className="fas fa-calendar"></i>
                            <span>
                              {new Date(prospect.interview_date).toLocaleDateString('ja-JP', { 
                                month: 'numeric', 
                                day: 'numeric'
                              })}
                              {prospect.interview_time && ` ${prospect.interview_time}`}
                            </span>
                          </div>
                        )}

                        {/* 備考（あれば） */}
                        {prospect.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 truncate">
                            <i className="fas fa-sticky-note mr-1"></i>
                            {prospect.notes}
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
                    {columnProspects.length === 0 && (
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
        {showDetailModal && selectedProspect && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-6 rounded-t-3xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{selectedProspect.company_name}</h3>
                      <span className={`px-3 py-1 rounded-lg border-2 font-bold text-xs flex items-center gap-1 ${
                        selectedProspect.priority === '高' ? 'bg-red-100 text-red-700 border-red-300' :
                        selectedProspect.priority === '中' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        'bg-blue-100 text-blue-700 border-blue-300'
                      }`}>
                        <i className={`fas ${getPriorityIcon(selectedProspect.priority)}`}></i>
                        {selectedProspect.priority}優先度
                      </span>
                    </div>
                    <p className="text-amber-100">パートナー: {selectedProspect.engineer_name}{selectedProspect.supplier_name && <span className="ml-2 text-amber-200 text-sm">(仕入れ先: {selectedProspect.supplier_name})</span>}</p>
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
                    <p className="font-bold text-slate-800">{selectedProspect.status}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 mb-1">メインプランナー</p>
                    <p className="font-bold text-slate-800">{selectedProspect.main_planner}</p>
                  </div>
                </div>

                {selectedProspect.support_planners.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 mb-2">クロスマッチング</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProspect.support_planners.map(sp => (
                        <span key={sp} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProspect.interview_date && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-700 mb-1">面談日時</p>
                    <p className="font-bold text-green-900">
                      {new Date(selectedProspect.interview_date).toLocaleDateString('ja-JP')} {selectedProspect.interview_time || ''}
                    </p>
                  </div>
                )}

                {selectedProspect.notes && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-700 mb-2">備考</p>
                    <p className="text-slate-700">{selectedProspect.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedProspect);
                    }}
                    className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    編集
                  </button>
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDelete(selectedProspect.id);
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

        {/* 新規見込み登録モーダル */}
        {showNewProspectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <i className="fas fa-plus-circle"></i>
                  新規BP見込み登録
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      クライアント <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProspect.company_name}
                      onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="例: トヨタ自動車"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      パートナー <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProspect.engineer_name}
                      onChange={(e) => setNewProspect({ ...newProspect, engineer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="例: YM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ先</label>
                  <input
                    type="text"
                    value={newProspect.supplier_name}
                    onChange={(e) => setNewProspect({ ...newProspect, supplier_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="例: ○○株式会社"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談日</label>
                    <input
                      type="date"
                      value={newProspect.interview_date}
                      onChange={(e) => setNewProspect({ ...newProspect, interview_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                    <input
                      type="time"
                      value={newProspect.interview_time}
                      onChange={(e) => setNewProspect({ ...newProspect, interview_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">決定日</label>
                    <input
                      type="date"
                      value={newProspect.decision_date}
                      onChange={(e) => setNewProspect({ ...newProspect, decision_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始月</label>
                    <input
                      type="month"
                      value={newProspect.start_month}
                      onChange={(e) => setNewProspect({ ...newProspect, start_month: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">売上単価 <span className="text-xs text-slate-400">（円）</span></label>
                    <input
                      type="number"
                      value={newProspect.sales_price}
                      onChange={(e) => setNewProspect({ ...newProspect, sales_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="例: 600000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ単価 <span className="text-xs text-slate-400">（円）</span></label>
                    <input
                      type="number"
                      value={newProspect.purchase_price}
                      onChange={(e) => setNewProspect({ ...newProspect, purchase_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="例: 500000"
                      min="0"
                    />
                  </div>
                </div>

                {/* 粗利プレビュー */}
                {(newProspect.sales_price !== '' && newProspect.purchase_price !== '') && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                    Number(newProspect.sales_price) - Number(newProspect.purchase_price) >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <i className="fas fa-calculator"></i>
                    粗利: {(Number(newProspect.sales_price) - Number(newProspect.purchase_price)).toLocaleString()}円
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      メインプランナー <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newProspect.main_planner}
                      onChange={(e) => setNewProspect({ ...newProspect, main_planner: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {planners.map(planner => (
                        <option key={planner} value={planner}>{planner}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">優先度</label>
                    <select
                      value={newProspect.priority}
                      onChange={(e) => setNewProspect({ ...newProspect, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="高">高</option>
                      <option value="中">中</option>
                      <option value="低">低</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    クロスマッチング
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.filter(p => p !== newProspect.main_planner).map(planner => (
                      <button
                        key={planner}
                        type="button"
                        onClick={() => toggleSupportPlanner(planner)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          newProspect.support_planners.includes(planner)
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {planner}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ステータス</label>
                  <select
                    value={newProspect.status}
                    onChange={(e) => setNewProspect({ ...newProspect, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="日程調整中">日程調整中</option>
                    <option value="面談予定">面談予定</option>
                    <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                    <option value="成約">成約</option>
                    <option value="見送り">見送り</option>
                    <option value="保留">保留</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                  <textarea
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="3"
                    placeholder="備考を入力..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 p-6 bg-slate-50 rounded-b-2xl">
                <button
                  onClick={handleAddProspect}
                  className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <i className="fas fa-check mr-2"></i>
                  登録
                </button>
                <button
                  onClick={() => setShowNewProspectModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-300 font-medium"
                >
                  <i className="fas fa-times mr-2"></i>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {showEditModal && editingProspect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <i className="fas fa-edit"></i>
                  BP見込み編集
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      クライアント <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProspect.company_name}
                      onChange={(e) => setEditingProspect({ ...editingProspect, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      パートナー <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProspect.engineer_name}
                      onChange={(e) => setEditingProspect({ ...editingProspect, engineer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ先</label>
                  <input
                    type="text"
                    value={editingProspect.supplier_name || ''}
                    onChange={(e) => setEditingProspect({ ...editingProspect, supplier_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ○○株式会社"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談日</label>
                    <input
                      type="date"
                      value={editingProspect.interview_date}
                      onChange={(e) => setEditingProspect({ ...editingProspect, interview_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                    <input
                      type="time"
                      value={editingProspect.interview_time}
                      onChange={(e) => setEditingProspect({ ...editingProspect, interview_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">決定日</label>
                    <input
                      type="date"
                      value={editingProspect.decision_date || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, decision_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始月</label>
                    <input
                      type="month"
                      value={editingProspect.start_month || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, start_month: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">売上単価 <span className="text-xs text-slate-400">（円）</span></label>
                    <input
                      type="number"
                      value={editingProspect.sales_price || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, sales_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 600000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ単価 <span className="text-xs text-slate-400">（円）</span></label>
                    <input
                      type="number"
                      value={editingProspect.purchase_price || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, purchase_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 500000"
                      min="0"
                    />
                  </div>
                </div>

                {/* 粗利プレビュー */}
                {(editingProspect.sales_price !== '' && editingProspect.sales_price != null &&
                  editingProspect.purchase_price !== '' && editingProspect.purchase_price != null) && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                    Number(editingProspect.sales_price) - Number(editingProspect.purchase_price) >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <i className="fas fa-calculator"></i>
                    粗利: {(Number(editingProspect.sales_price) - Number(editingProspect.purchase_price)).toLocaleString()}円
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      メインプランナー <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingProspect.main_planner}
                      onChange={(e) => setEditingProspect({ ...editingProspect, main_planner: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {planners.map(planner => (
                        <option key={planner} value={planner}>{planner}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">優先度</label>
                    <select
                      value={editingProspect.priority}
                      onChange={(e) => setEditingProspect({ ...editingProspect, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="高">高</option>
                      <option value="中">中</option>
                      <option value="低">低</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    クロスマッチング
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.filter(p => p !== editingProspect.main_planner).map(planner => (
                      <button
                        key={planner}
                        type="button"
                        onClick={() => toggleEditSupportPlanner(planner)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          editingProspect.support_planners.includes(planner)
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {planner}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ステータス</label>
                  <select
                    value={editingProspect.status}
                    onChange={(e) => setEditingProspect({ ...editingProspect, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="日程調整中">日程調整中</option>
                    <option value="面談予定">面談予定</option>
                    <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                    <option value="成約">成約</option>
                    <option value="見送り">見送り</option>
                    <option value="保留">保留</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">備考</label>
                  <textarea
                    value={editingProspect.notes}
                    onChange={(e) => setEditingProspect({ ...editingProspect, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 p-6 bg-slate-50 rounded-b-2xl">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <i className="fas fa-save mr-2"></i>
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProspect(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-300 font-medium"
                >
                  <i className="fas fa-times mr-2"></i>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
