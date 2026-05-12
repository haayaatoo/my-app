import React, { useState, useEffect, useMemo } from 'react';

const ACTION_CONFIG = {
  create: {
    label: '新規登録',
    icon: 'fa-plus-circle',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  update: {
    label: '更新',
    icon: 'fa-edit',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
  },
  delete: {
    label: '削除',
    icon: 'fa-trash-alt',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-400',
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `今日 ${timeStr}`;
  if (isYesterday) return `昨日 ${timeStr}`;
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) + ` ${timeStr}`;
}

function formatDateGroup(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '今日';
  if (d.toDateString() === yesterday.toDateString()) return '昨日';
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function groupByDate(logs) {
  const groups = [];
  let currentDate = null;
  let currentItems = [];
  logs.forEach(log => {
    const dateKey = new Date(log.created_at).toDateString();
    if (dateKey !== currentDate) {
      if (currentItems.length > 0) {
        groups.push({ date: currentDate, label: formatDateGroup(currentItems[0].created_at), items: currentItems });
      }
      currentDate = dateKey;
      currentItems = [log];
    } else {
      currentItems.push(log);
    }
  });
  if (currentItems.length > 0) {
    groups.push({ date: currentDate, label: formatDateGroup(currentItems[0].created_at), items: currentItems });
  }
  return groups;
}

export default function ActivityTimeline() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all'); // 'all' | 'create' | 'update' | 'delete'
  const [filterUser, setFilterUser] = useState('all');

  // localStorage からログを読み込む
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('prodia_activity_log') || '[]');
      setLogs(data);
    } catch {
      setLogs([]);
    }
  }, []);

  // ユーザー一覧
  const userList = useMemo(() => {
    const names = [...new Set(logs.map(l => l.user_name).filter(Boolean))];
    return names.sort();
  }, [logs]);

  // フィルタ・検索後のログ
  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (filterUser !== 'all' && log.user_name !== filterUser) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          (log.target_name || '').toLowerCase().includes(q) ||
          (log.user_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filterAction, filterUser, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // ログをクリア（確認あり）
  const handleClear = () => {
    if (!window.confirm('すべての操作履歴を削除しますか？この操作は元に戻せません。')) return;
    localStorage.removeItem('prodia_activity_log');
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
              <i className="fas fa-history text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">タイムライン</h1>
              <p className="text-xs text-slate-400 mt-0.5">全操作履歴（最新 100 件）</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">計 {filtered.length} 件</span>
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <i className="fas fa-trash text-[10px]"></i>
                履歴を全削除
              </button>
            )}
          </div>
        </div>

        {/* 検索・フィルタバー */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* 検索 */}
          <div className="relative flex-1 min-w-[200px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input
              type="text"
              placeholder="名前・対象で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
          </div>

          {/* 操作種別フィルタ */}
          <div className="flex gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
            {[
              { key: 'all', label: 'すべて' },
              { key: 'create', label: '登録' },
              { key: 'update', label: '更新' },
              { key: 'delete', label: '削除' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilterAction(opt.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filterAction === opt.key
                    ? opt.key === 'create' ? 'bg-emerald-500 text-white shadow-sm'
                    : opt.key === 'update' ? 'bg-blue-500 text-white shadow-sm'
                    : opt.key === 'delete' ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* ユーザーフィルタ */}
          {userList.length > 1 && (
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
            >
              <option value="all">全ユーザー</option>
              {userList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* タイムライン本体 */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300">
            <i className="fas fa-history text-5xl mb-4"></i>
            <p className="text-base font-medium">操作履歴がまだありません</p>
            <p className="text-sm mt-1">エンジニアを登録・更新・削除すると履歴が記録されます</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300">
            <i className="fas fa-search text-4xl mb-4"></i>
            <p className="text-base font-medium">検索条件に一致する履歴がありません</p>
            <button
              onClick={() => { setSearch(''); setFilterAction('all'); setFilterUser('all'); }}
              className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 underline"
            >
              フィルタをリセット
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-8">
            {grouped.map(group => (
              <div key={group.date}>
                {/* 日付セパレータ */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs text-slate-400">{group.items.length} 件</span>
                </div>

                {/* タイムラインアイテム */}
                <div className="relative">
                  {/* 縦線 */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full"></div>

                  <div className="space-y-5">
                    {group.items.map((log, idx) => {
                      const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
                      return (
                        <div key={log.id ?? idx} className="flex gap-5">
                          {/* アイコンバッジ */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${cfg.bg}`}>
                              <i className={`fas ${cfg.icon} text-sm ${cfg.color}`}></i>
                            </div>
                          </div>

                          {/* カード */}
                          <div className={`flex-1 rounded-xl border px-5 py-4 ${cfg.bg} ${cfg.border} shadow-sm`}>
                            {/* 上段: バッジ + 日時 */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                <i className={`fas ${cfg.icon} text-[10px]`}></i>
                                {cfg.label}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <i className="fas fa-clock text-[10px]"></i>
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            {/* 中段: 対象名 */}
                            <p className="text-base font-bold text-slate-800 leading-snug">
                              {log.target_name}
                            </p>
                            {/* 下段: 操作者 */}
                            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                              <i className="fas fa-user text-xs"></i>
                              <span className="font-semibold text-slate-600">{log.user_name}</span>
                              <span>が{cfg.label}しました</span>
                            </p>
                            {log.details && (
                              <p className="text-xs text-slate-400 mt-2.5 pl-3 border-l-2 border-slate-300 leading-relaxed">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
