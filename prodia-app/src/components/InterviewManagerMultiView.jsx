import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';

export default function InterviewManagerCardView() {
  const [interviews, setInterviews] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'timeline', 'kanban', 'table'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🎨 カード型表示
  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interviews.map(interview => {
        const engineer = engineers.find(e => e.id === interview.engineer);
        const statusColor = {
          'pass': 'bg-emerald-100 text-emerald-800 border-emerald-200',
          'fail': 'bg-red-100 text-red-800 border-red-200',
          'pending': 'bg-amber-100 text-amber-800 border-amber-200',
          'canceled': 'bg-gray-100 text-gray-800 border-gray-200'
        };

        return (
          <div key={interview.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-white/60">
            {/* カードヘッダー */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {engineer?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 text-lg">{engineer?.name}</h3>
                  <p className="text-slate-500 text-sm">{engineer?.skills}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor[interview.result] || statusColor.pending}`}>
                {interview.result === 'pass' && '✅ 合格'}
                {interview.result === 'fail' && '❌ 不合格'}
                {interview.result === 'pending' && '⏳ 保留'}
                {interview.result === 'canceled' && '🚫 キャンセル'}
              </span>
            </div>

            {/* 面談情報 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <i className="fas fa-building w-4"></i>
                <span className="font-medium">{interview.client_company}</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-600">
                <i className="fas fa-calendar w-4"></i>
                <span>{new Date(interview.interview_date).toLocaleDateString('ja-JP')}</span>
              </div>

              {interview.notes && (
                <div className="bg-slate-50 rounded-lg p-3 mt-3">
                  <p className="text-slate-600 text-sm leading-relaxed">{interview.notes}</p>
                </div>
              )}

              {interview.next_action && (
                <div className="flex items-start gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                  <i className="fas fa-arrow-right mt-0.5"></i>
                  <span className="text-sm">{interview.next_action}</span>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              <button className="flex-1 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200 text-sm font-medium">
                <i className="fas fa-edit mr-1"></i>編集
              </button>
              <button className="flex-1 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-200 text-sm font-medium">
                <i className="fas fa-eye mr-1"></i>詳細
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // 🕒 タイムライン表示
  const renderTimelineView = () => (
    <div className="relative">
      {/* タイムライン軸 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400"></div>
      
      <div className="space-y-8">
        {interviews
          .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))
          .map((interview, index) => {
            const engineer = engineers.find(e => e.id === interview.engineer);
            
            return (
              <div key={interview.id} className="relative flex items-start gap-6 group">
                {/* タイムライン ドット */}
                <div className="w-16 h-16 bg-white rounded-full border-4 border-amber-300 shadow-lg flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-200">
                  <i className="fas fa-comments text-amber-600 text-lg"></i>
                </div>

                {/* 面談カード */}
                <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg border border-white/60 group-hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-700 text-lg">{engineer?.name}</h3>
                      <p className="text-slate-500">{interview.client_company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 font-medium">{new Date(interview.interview_date).toLocaleDateString('ja-JP')}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        interview.result === 'pass' ? 'bg-emerald-100 text-emerald-800' :
                        interview.result === 'fail' ? 'bg-red-100 text-red-800' :
                        interview.result === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {interview.result === 'pass' && '合格'}
                        {interview.result === 'fail' && '不合格'}
                        {interview.result === 'pending' && '保留'}
                        {interview.result === 'canceled' && 'キャンセル'}
                      </span>
                    </div>
                  </div>

                  {interview.notes && (
                    <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{interview.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  // 📋 カンバン方式（結果別）
  const renderKanbanView = () => {
    const columns = [
      { key: 'pending', title: '⏳ 保留中', color: 'bg-amber-50 border-amber-200' },
      { key: 'pass', title: '✅ 合格', color: 'bg-emerald-50 border-emerald-200' },
      { key: 'fail', title: '❌ 不合格', color: 'bg-red-50 border-red-200' },
      { key: 'canceled', title: '🚫 キャンセル', color: 'bg-gray-50 border-gray-200' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.key} className={`${column.color} rounded-2xl border-2 p-4`}>
            <h3 className="font-bold text-slate-700 mb-4 text-center">{column.title}</h3>
            <div className="space-y-4">
              {interviews
                .filter(interview => interview.result === column.key)
                .map(interview => {
                  const engineer = engineers.find(e => e.id === interview.engineer);
                  return (
                    <div key={interview.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {engineer?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{engineer?.name}</p>
                          <p className="text-slate-500 text-xs">{interview.client_company}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">{new Date(interview.interview_date).toLocaleDateString('ja-JP')}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 min-h-screen">
      {/* ヘッダー + 表示モード切替 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-700 font-display">お客様面談履歴</h1>
          
          {/* 表示モード切替 */}
          <div className="flex bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                viewMode === 'cards' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-th-large mr-2"></i>カード
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                viewMode === 'timeline' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-stream mr-2"></i>タイムライン
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                viewMode === 'kanban' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-columns mr-2"></i>カンバン
            </button>
          </div>
        </div>
      </div>

      {/* 表示モードに応じた内容 */}
      {viewMode === 'cards' && renderCardView()}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'kanban' && renderKanbanView()}
    </div>
  );
}