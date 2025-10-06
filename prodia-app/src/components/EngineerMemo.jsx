import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

// エンジニア個別メモ管理コンポーネント
export default function EngineerMemo({ engineerName, onClose }) {
  const [memos, setMemos] = useState([]);
  const [newMemo, setNewMemo] = useState({
    title: '',
    content: '',
    priority: 'medium',
    tags: '',
    due_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const API_BASE = 'http://localhost:8000/api/memos/';
  const PRIORITY_COLORS = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  // メモ一覧取得
  const fetchMemos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}by_engineer/?engineer_name=${encodeURIComponent(engineerName)}`);
      if (response.ok) {
        const data = await response.json();
        setMemos(data);
      }
    } catch (error) {
      console.error('メモ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 新規メモ作成
  const createMemo = async () => {
    if (!newMemo.title.trim() || !newMemo.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const memoData = {
        ...newMemo,
        memo_type: 'engineer',
        engineer_name: engineerName,
        author: user?.name || user?.email || 'Anonymous',
        tags: newMemo.tags ? newMemo.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoData),
      });

      if (response.ok) {
        setNewMemo({
          title: '',
          content: '',
          priority: 'medium',
          tags: '',
          due_date: ''
        });
        await fetchMemos(); // メモ一覧を再取得
      }
    } catch (error) {
      console.error('メモ作成エラー:', error);
      alert('メモの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // メモ完了状態の切り替え
  const toggleMemoCompletion = async (memoId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}${memoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_completed: !currentStatus
        }),
      });

      if (response.ok) {
        await fetchMemos(); // メモ一覧を再取得
      }
    } catch (error) {
      console.error('メモ更新エラー:', error);
    }
  };

  // メモ削除
  const deleteMemo = async (memoId) => {
    if (!window.confirm('このメモを削除しますか？')) return;

    try {
      const response = await fetch(`${API_BASE}${memoId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMemos(); // メモ一覧を再取得
      }
    } catch (error) {
      console.error('メモ削除エラー:', error);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, [engineerName]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
              <i className="fas fa-sticky-note text-amber-600"></i>
              {engineerName} の営業メモ
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 新規メモ作成フォーム */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-4">
              <i className="fas fa-plus-circle mr-2"></i>
              新規メモ作成
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMemo.title}
                  onChange={(e) => setNewMemo({...newMemo, title: e.target.value})}
                  placeholder="例: 面談予定、条件交渉、案件提案"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    優先度
                  </label>
                  <select
                    value={newMemo.priority}
                    onChange={(e) => setNewMemo({...newMemo, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    期限
                  </label>
                  <input
                    type="datetime-local"
                    value={newMemo.due_date}
                    onChange={(e) => setNewMemo({...newMemo, due_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={newMemo.tags}
                  onChange={(e) => setNewMemo({...newMemo, tags: e.target.value})}
                  placeholder="例: 面談済み, 条件交渉中, 案件マッチング"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newMemo.content}
                  onChange={(e) => setNewMemo({...newMemo, content: e.target.value})}
                  placeholder="詳細な内容を入力してください..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={createMemo}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    作成中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    メモを作成
                  </>
                )}
              </button>
            </div>
          </div>

          {/* メモ一覧 */}
          <div>
            <h4 className="text-lg font-semibold text-slate-700 mb-4">
              <i className="fas fa-list mr-2"></i>
              既存メモ ({memos.length}件)
            </h4>

            {isLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                <p className="text-gray-500 mt-2">メモを読み込み中...</p>
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-sticky-note text-4xl mb-4"></i>
                <p>まだメモがありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memos.map(memo => (
                  <div key={memo.id} className={`border rounded-lg p-4 ${memo.is_completed ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className={`font-semibold ${memo.is_completed ? 'line-through text-gray-500' : 'text-slate-700'}`}>
                          {memo.title}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[memo.priority]}`}>
                          {memo.priority === 'low' ? '低' : memo.priority === 'medium' ? '中' : memo.priority === 'high' ? '高' : '緊急'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMemoCompletion(memo.id, memo.is_completed)}
                          className={`px-2 py-1 rounded text-sm ${memo.is_completed ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'}`}
                        >
                          <i className={`fas ${memo.is_completed ? 'fa-undo' : 'fa-check'} mr-1`}></i>
                          {memo.is_completed ? '未完了にする' : '完了'}
                        </button>
                        <button
                          onClick={() => deleteMemo(memo.id)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          削除
                        </button>
                      </div>
                    </div>

                    <p className={`text-sm mb-2 ${memo.is_completed ? 'text-gray-500' : 'text-slate-600'}`}>
                      {memo.content}
                    </p>

                    {memo.tags && memo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {memo.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex justify-between items-center">
                      <span>作成者: {memo.author}</span>
                      <span>{new Date(memo.created_at).toLocaleString('ja-JP')}</span>
                      {memo.due_date && (
                        <span className="text-orange-600">
                          期限: {new Date(memo.due_date).toLocaleString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}