/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import "./EngineerCard.css";

function EngineerCard({ engineer, onEdit, onDelete, isSelected, onSelect, onMemoClick, refreshTrigger }) {
  const { name, position, skills, planner, engineer_status, phase, project } = engineer || {};
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [memoCount, setMemoCount] = useState(0);
  const [memoStats, setMemoStats] = useState({ total: 0, urgent: 0, high: 0, pending: 0 });
  const [isMemoAreaHovered, setIsMemoAreaHovered] = useState(false);
  
  // skillsが配列でなければ配列化
  let skillsArray = [];
  if (Array.isArray(skills)) {
    skillsArray = skills;
  } else if (typeof skills === 'string') {
    skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  // ステータスバッジ
  const statusMap = {
    'アサイン済': { color: 'bg-green-500', label: 'アサイン済', anim: 'pulse' },
    '未アサイン': { color: 'bg-red-400', label: '未アサイン', anim: 'shake' },
  };
  const status = statusMap[engineer_status] || { color: 'bg-gray-300', label: '不明', anim: '' };

  // メモ数を取得
  const fetchMemoStats = async () => {
    if (!name) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/memos/by_engineer/?engineer_name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const memos = await response.json();
        const urgent = memos.filter(memo => memo.priority === 'urgent' && !memo.is_completed).length;
        const high = memos.filter(memo => memo.priority === 'high' && !memo.is_completed).length;
        const pending = memos.filter(memo => !memo.is_completed).length;
        
        setMemoCount(memos.length);
        setMemoStats({
          total: memos.length,
          urgent: urgent,
          high: high,
          pending: pending
        });
      }
    } catch (error) {
      console.error('メモ統計取得エラー:', error);
    }
  };

  // 最高優先度を取得する関数
  const getHighestPriority = () => {
    if (memoStats.urgent > 0) return 'urgent';
    if (memoStats.high > 0) return 'high';
    if (memoStats.pending > 0) return 'medium';
    if (memoStats.total > 0) return 'low';
    return 'none';
  };

  // コンポーネントマウント時とエンジニア名変更時、外部トリガー時にメモ統計を取得
  useEffect(() => {
    fetchMemoStats();
  }, [name, refreshTrigger]);

  // メモボタンクリックハンドラー
  const handleMemoClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onMemoClick && onMemoClick(name);
  };

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('engineer-id', engineer.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 削除確認ダイアログ
  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    onDelete(engineer.id);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <div 
        className={`engineer-card ${isDragging ? 'dragging' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isMemoAreaHovered ? 'memo-hovered' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDoubleClick={() => onEdit(engineer)}
      >
        <div className="card-inner relative">
          {/* 選択チェックボックス */}
          <div className="absolute top-2 right-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(engineer.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* 編集・削除ボタン */}
          <div className="absolute top-2 left-2 z-10 flex gap-1">
            <button
              onClick={() => onEdit(engineer)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-110"
              title="編集"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-110"
              title="削除"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>

          {/* カード表 */}
          <div className={`card-front bg-white rounded-2xl shadow-lg p-6 w-72 h-[330px] flex flex-col items-center justify-between relative transition-all duration-300 ${
            memoCount > 0 
              ? getHighestPriority() === 'urgent' || getHighestPriority() === 'high'
                ? 'ring-2 ring-red-400 shadow-red-200/50 shadow-2xl'       // 高・緊急：赤
                : getHighestPriority() === 'medium'
                  ? 'ring-2 ring-orange-400 shadow-orange-200/50 shadow-2xl' // 中：オレンジ
                  : 'ring-2 ring-blue-400 shadow-blue-200/50 shadow-2xl'    // 低：青
              : ''
          }`}>
            {/* ステータスバッジ（アニメーション削除） */}
            <span className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold text-white rounded-full ${status.color}`}>{status.label}</span>
            
            {/* メイン情報エリア */}
            <div className="flex flex-col items-center flex-grow">
              {/* アイコン */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white mb-3 shadow-md transition-all ${
                memoCount > 0 
                  ? getHighestPriority() === 'urgent' || getHighestPriority() === 'high'
                    ? 'bg-gradient-to-br from-red-400 to-pink-400'         // 高・緊急：赤
                    : getHighestPriority() === 'medium'
                      ? 'bg-gradient-to-br from-orange-400 to-yellow-400'  // 中：オレンジ
                      : 'bg-gradient-to-br from-blue-400 to-cyan-400'      // 低：青
                  : 'bg-gradient-to-br from-indigo-300 to-blue-400'        // メモなし：デフォルト
              }`}>
                <i className="fas fa-user-tie"></i>
                {/* メモ状態オーバーレイ */}
                {memoCount > 0 && (
                  <div className="absolute -bottom-1 -right-1">
                    <i className={`fas fa-sticky-note text-sm ${
                      getHighestPriority() === 'urgent' || getHighestPriority() === 'high'
                        ? 'text-red-600' 
                        : getHighestPriority() === 'medium'
                          ? 'text-orange-600' 
                          : 'text-blue-600'
                    }`}></i>
                  </div>
                )}
              </div>
              {/* 名前・役職 */}
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
                {position && <span className="text-sm text-gray-500 font-medium">{position}</span>}
                {/* メモステータス表示 */}
                {memoCount > 0 && (
                  <div className={`text-xs font-semibold mt-1 px-2 py-1 rounded-full ${
                    getHighestPriority() === 'urgent' || getHighestPriority() === 'high'
                      ? 'text-red-600 bg-red-100' 
                      : getHighestPriority() === 'medium'
                        ? 'text-orange-600 bg-orange-100' 
                        : 'text-blue-600 bg-blue-100'
                  }`}>
                    <i className="fas fa-sticky-note mr-1"></i>
                    {getHighestPriority() === 'urgent' 
                      ? `緊急メモあり` 
                      : getHighestPriority() === 'high'
                        ? `重要メモあり`
                        : getHighestPriority() === 'medium'
                          ? `未完了あり` 
                          : `メモあり`
                    }
                  </div>
                )}
              </div>
              {/* プランナー */}
              <div className="text-xs text-gray-400 mb-2">担当プランナー: {planner}</div>
              {/* プロジェクト名 */}
              {project && (
                <div className="text-xs text-blue-500 font-semibold mb-2">プロジェクト: {project}</div>
              )}
            </div>

            {/* メモボタンエリア */}
            <div 
              className="w-full mt-auto memo-area"
              onMouseEnter={() => setIsMemoAreaHovered(true)}
              onMouseLeave={() => setIsMemoAreaHovered(false)}
            >
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleMemoClick}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-md ${
                    memoCount > 0 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  title={memoCount > 0 ? `${memoCount}件のメモがあります` : 'メモを作成'}
                >
                  <i className="fas fa-sticky-note mr-2"></i>
                  メモ
                </button>
                
                {memoCount > 0 && (
                  <div className="flex gap-1">
                    {/* 最高優先度のバッジのみ表示 */}
                    {getHighestPriority() === 'urgent' && memoStats.urgent > 0 && (
                      <div className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center">
                        <i className="fas fa-exclamation mr-1"></i>
                        {memoStats.urgent}
                      </div>
                    )}
                    
                    {getHighestPriority() === 'high' && memoStats.high > 0 && (
                      <div className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center">
                        <i className="fas fa-star mr-1"></i>
                        {memoStats.high}
                      </div>
                    )}
                    
                    {getHighestPriority() === 'medium' && memoStats.pending > 0 && (
                      <div className="bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center">
                        <i className="fas fa-clock mr-1"></i>
                        {memoStats.pending}
                      </div>
                    )}
                    
                    {getHighestPriority() === 'low' && (
                      <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center">
                        <i className="fas fa-sticky-note mr-1"></i>
                        {memoStats.total}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* カード裏 */}
          <div className="card-back bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl shadow-lg p-4 w-72 h-[330px]">
            <div className="flex flex-col h-full justify-start">
              {/* スキルセクション */}
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-indigo-700 mb-3">スキル</h4>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {skillsArray.map((s, idx) => (
                    <span key={idx} className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold shadow">{s}</span>
                  ))}
                </div>
              </div>
              
              {/* 経験フェーズセクション */}
              <div className="text-center">
                <h4 className="text-base font-bold text-blue-700 mb-3">経験フェーズ</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['要件定義','基本設計','詳細設計','製造','テスト','運用・保守'].map((p, idx) => (
                    <span
                      key={idx}
                      className={
                        `px-2 py-1 rounded-full text-xs font-semibold ` +
                        (phase && phase.includes(p)
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-blue-100 text-blue-600')
                      }
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-bounce-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 text-yellow-500">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">削除確認</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-red-600">{name}</span> さんを削除しますか？
                <br />この操作は取り消せません。
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EngineerCard;
