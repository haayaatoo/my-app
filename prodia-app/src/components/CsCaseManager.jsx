import React, { useMemo, useState } from 'react';

const STATUS_COLUMNS = [
  { key: 'new', label: '新規', icon: 'fa-sparkles', accent: 'from-sky-50 via-white to-white', border: 'border-sky-100', chip: 'bg-sky-100 text-sky-600', hint: '初回ヒアリング/要件整理', wip: 6 },
  { key: 'proposal', label: '提案中', icon: 'fa-file-signature', accent: 'from-indigo-50 via-white to-white', border: 'border-indigo-100', chip: 'bg-indigo-100 text-indigo-600', hint: '提案書/見積の提出', wip: 5 },
  { key: 'evaluation', label: '評価中', icon: 'fa-flask', accent: 'from-amber-50 via-white to-white', border: 'border-amber-100', chip: 'bg-amber-100 text-amber-700', hint: 'PoC/評価環境', wip: 4 },
  { key: 'approval', label: '稟議/承認待ち', icon: 'fa-stamp', accent: 'from-rose-50 via-white to-white', border: 'border-rose-100', chip: 'bg-rose-100 text-rose-700', hint: '社内稟議~最終決裁', wip: 3 },
  { key: 'contract', label: '契約済', icon: 'fa-file-contract', accent: 'from-emerald-50 via-white to-white', border: 'border-emerald-100', chip: 'bg-emerald-100 text-emerald-700', hint: '契約締結済み', wip: 6 },
  { key: 'live', label: '運用中', icon: 'fa-wave-square', accent: 'from-slate-50 via-white to-white', border: 'border-slate-100', chip: 'bg-slate-100 text-slate-600', hint: 'オンボード完了/伴走', wip: 10 }
];

const STATUS_META = STATUS_COLUMNS.reduce((acc, col) => {
  acc[col.key] = col;
  return acc;
}, {});

const PRIORITY_BADGE = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700'
};



const formatDate = (value) => {
  if (!value) return '未設定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const DAY = 1000 * 60 * 60 * 24;

const getDueState = (value) => {
  if (!value) return 'none';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'none';
  const diff = Math.ceil((d.getTime() - Date.now()) / DAY);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 7) return 'dueSoon';
  return 'onTrack';
};

const formatRelativeDue = (value) => {
  if (!value) return '未設定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diff = Math.ceil((d.getTime() - Date.now()) / DAY);
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return '本日締切';
  return `あと${diff}日`;
};

const DUE_BADGES = {
  overdue: 'bg-rose-100 text-rose-700',
  today: 'bg-red-100 text-red-700',
  dueSoon: 'bg-amber-100 text-amber-700',
  onTrack: 'bg-emerald-100 text-emerald-700',
  none: 'bg-slate-100 text-slate-500'
};

const Pill = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{children}</span>
);

const CaseCard = ({ item, onSelect, isActive }) => {
  const statusMeta = STATUS_META[item.status] || {};
  const dueState = getDueState(item.due);
  return (
    <button
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 flex flex-col gap-3 ${
        isActive ? 'border-emerald-200 bg-white shadow-lg ring-2 ring-emerald-100' : 'border-white/60 bg-white/95 shadow-sm hover:-translate-y-0.5'
      }`}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">{statusMeta.label || '未分類'}</p>
          <p className="text-base font-semibold text-slate-800 leading-tight">{item.title}</p>
          <p className="text-xs text-slate-500">{item.company}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_BADGE[item.priority] || 'bg-slate-100 text-slate-600'}`}>
          {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Pill>{item.product}</Pill>
        {item.tags?.map(tag => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{item.comment}</p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <i className="fas fa-user"></i>
          <span>{item.owner}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full font-semibold ${DUE_BADGES[dueState] || DUE_BADGES.none}`}>
            {formatRelativeDue(item.due)}
          </span>
          <span className="text-slate-500">{formatDate(item.due)}</span>
        </div>
      </div>
    </button>
  );
};

const CompactCaseRow = ({ item, onSelect, isActive }) => {
  const statusMeta = STATUS_META[item.status] || {};
  const dueState = getDueState(item.due);
  return (
    <button
      className={`w-full text-left rounded-2xl border px-4 py-3 transition-all duration-200 flex items-center gap-4 flex-wrap ${
        isActive ? 'border-emerald-200 bg-emerald-50/60 shadow-sm' : 'border-slate-100 bg-white hover:border-emerald-100'
      }`}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
        <p className="text-xs text-slate-500">{item.company}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className={`px-2 py-1 rounded-full ${statusMeta.chip || 'bg-slate-100 text-slate-600'}`}>{statusMeta.label || '未分類'}</span>
        <span className={`px-2 py-1 rounded-full ${PRIORITY_BADGE[item.priority] || 'bg-slate-100 text-slate-600'}`}>
          {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
        </span>
      </div>
      <div className="ml-auto text-right">
        <p className={`text-xs px-2 py-1 rounded-full inline-flex font-semibold ${DUE_BADGES[dueState] || DUE_BADGES.none}`}>{formatRelativeDue(item.due)}</p>
        <p className="text-xs text-slate-500 mt-1">{formatDate(item.due)}</p>
      </div>
    </button>
  );
};

export default function CsCaseManager() {
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('最新の注意事項やコメントをここにメモできます。');
  const [sortMode, setSortMode] = useState('dueAsc');
  const [boardView, setBoardView] = useState('kanban');

  const filteredCases = useMemo(() => {
    const filtered = cases.filter(c => {
      const statusOk = filters.status ? c.status === filters.status : true;
      const prioOk = filters.priority ? c.priority === filters.priority : true;
      const searchOk = filters.search
        ? `${c.title} ${c.company} ${c.comment}`.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return statusOk && prioOk && searchOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.due).getTime();
      const bDate = new Date(b.due).getTime();
      if (Number.isNaN(aDate) || Number.isNaN(bDate)) return 0;
      return sortMode === 'dueAsc' ? aDate - bDate : bDate - aDate;
    });

    return sorted;
  }, [cases, filters, sortMode]);

  const selectedCase = useMemo(() => filteredCases.find(c => c.id === selectedId) || filteredCases[0], [filteredCases, selectedId]);

  const progressColumns = useMemo(() => {
    return STATUS_COLUMNS.map(col => ({
      ...col,
      items: filteredCases.filter(c => c.status === col.key)
    }));
  }, [filteredCases]);

  const summary = useMemo(() => {
    const total = filteredCases.length;
    const high = filteredCases.filter(c => c.priority === 'high').length;
    const active = filteredCases.filter(c => c.status !== 'live').length;
    const dueSoon = filteredCases.filter(c => {
      const t = new Date(c.due).getTime();
      const now = Date.now();
      const within = t - now <= 1000 * 60 * 60 * 24 * 14; // 14 days
      return !Number.isNaN(t) && within && t >= now;
    }).length;
    return { total, high, active, dueSoon };
  }, [filteredCases]);

  const upcomingCases = useMemo(() => {
    return [...filteredCases]
      .filter(c => !Number.isNaN(new Date(c.due).getTime()))
      .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
      .slice(0, 4);
  }, [filteredCases]);

  const ownerStats = useMemo(() => {
    const bucket = {};
    filteredCases.forEach(c => {
      if (!bucket[c.owner]) {
        bucket[c.owner] = { owner: c.owner, total: 0, high: 0 };
      }
      bucket[c.owner].total += 1;
      if (c.priority === 'high') {
        bucket[c.owner].high += 1;
      }
    });
    return Object.values(bucket).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  const activityFeed = useMemo(() => {
    const safeTime = (value) => {
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...filteredCases]
      .sort((a, b) => safeTime(b.due) - safeTime(a.due))
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        title: item.title,
        status: STATUS_COLUMNS.find(s => s.key === item.status)?.label || '―',
        note: item.lastNote,
        due: formatDate(item.due),
        priority: item.priority
      }));
  }, [filteredCases]);

  const handleStageShortcut = (statusKey) => {
    setFilters(current => ({
      ...current,
      status: current.status === statusKey ? '' : statusKey
    }));
  };

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 min-h-screen">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">CS案件管理</h1>
          <p className="text-slate-500">CS専用案件ボードと進捗・備考スペース</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-semibold transition-all ${sortMode === 'dueAsc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}
              onClick={() => setSortMode('dueAsc')}
            >
              期限が近い順
            </button>
            <button
              className={`px-4 py-2 text-sm font-semibold transition-all border-l border-slate-100 ${sortMode === 'dueDesc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}
              onClick={() => setSortMode('dueDesc')}
            >
              期限が遠い順
            </button>
          </div>
          <button className="px-4 py-2 bg-white rounded-2xl border border-slate-200 text-slate-600 shadow-sm hover:shadow-md transition-all duration-200">
            CSVエクスポート（準備中）
          </button>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: '総案件', value: summary.total, icon: 'fa-clipboard-list', accent: 'from-emerald-400/20 to-emerald-200/10' },
          { label: '高優先度', value: summary.high, icon: 'fa-fire', accent: 'from-rose-400/20 to-rose-200/10' },
          { label: '進行中', value: summary.active, icon: 'fa-play', accent: 'from-amber-400/20 to-amber-200/10' },
          { label: '2週間以内期日', value: summary.dueSoon, icon: 'fa-clock', accent: 'from-blue-400/20 to-blue-200/10' }
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl bg-white/90 border border-white/70 shadow-sm p-4">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent}`}></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center text-slate-600">
                <i className={`fas ${card.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* フィルタバー */}
      <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md flex flex-wrap gap-3 items-center mb-8">
        <div className="flex items-center gap-2 text-slate-600">
          <i className="fas fa-filter text-emerald-500"></i>
          <span className="font-semibold">フィルター</span>
        </div>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">全ステータス</option>
          {STATUS_COLUMNS.map(col => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
        >
          <option value="">優先度</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <i className="fas fa-search text-slate-400"></i>
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
            placeholder="案件名・会社名・コメントで検索"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <button
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          onClick={() => setFilters({ status: '', priority: '', search: '' })}
        >
          クリア
        </button>
      </div>

      {/* 管理エリア */}
      <div className="grid gap-6 2xl:grid-cols-[260px_minmax(0,1fr)_320px] mb-10">
        {/* 左カラム: ステップナビ */}
        <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md sticky top-6 h-fit">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">ステップナビ</p>
            <span className="text-xs text-slate-400">クリックで絞り込み</span>
          </div>
          <div className="space-y-3 mt-4">
            {progressColumns.map((col, index) => {
              const ratio = filteredCases.length ? Math.round((col.items.length / filteredCases.length) * 100) : 0;
              const isActiveStage = filters.status === col.key;
              return (
                <button
                  key={col.key}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-all duration-200 ${
                    isActiveStage ? 'border-emerald-200 bg-emerald-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                  onClick={() => handleStageShortcut(col.key)}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{col.label}</span>
                    <span className="text-xs text-slate-500">{col.items.length}件</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>Step {index + 1}</span>
                    <span>{ratio}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ratio}%` }}></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 中央カラム: ボード + インサイト */}
        <div className="space-y-6">
          <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-slate-500">パイプライン</p>
                <p className="text-xl font-semibold text-slate-800">案件ボード</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">ドラッグ&ドロップ準備中</span>
                <div className="flex bg-slate-100/80 rounded-full p-1 text-xs font-semibold">
                  <button
                    className={`px-3 py-1.5 rounded-full transition ${boardView === 'kanban' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500'}`}
                    onClick={() => setBoardView('kanban')}
                  >
                    ボード
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-full transition ${boardView === 'list' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500'}`}
                    onClick={() => setBoardView('list')}
                  >
                    リスト
                  </button>
                </div>
              </div>
            </div>

            {boardView === 'kanban' ? (
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 min-w-[960px]">
                  {progressColumns.map(col => {
                    const meta = STATUS_META[col.key] || {};
                    const wipRatio = meta.wip ? Math.min(100, Math.round((col.items.length / meta.wip) * 100)) : null;
                    const overCapacity = meta.wip ? col.items.length > meta.wip : false;
                    return (
                      <div
                        key={col.key}
                        className={`rounded-3xl border ${meta.border || 'border-slate-100'} bg-gradient-to-b ${meta.accent || 'from-white to-slate-50'} p-3 flex flex-col gap-3 min-h-[260px]`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                              {meta.icon && <i className={`fas ${meta.icon} text-slate-400`}></i>}
                              {col.label}
                            </p>
                            <p className="text-[11px] text-slate-500">{meta.hint}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-600">
                              {col.items.length}
                              {meta.wip ? ` / ${meta.wip}` : ''}件
                            </p>
                            {overCapacity && <span className="text-[10px] font-semibold text-rose-500">WIP超過</span>}
                          </div>
                        </div>
                        {meta.wip && (
                          <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${overCapacity ? 'bg-rose-400' : 'bg-emerald-400'}`}
                              style={{ width: `${wipRatio}%` }}
                            ></div>
                          </div>
                        )}
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                          {col.items.map(item => (
                            <CaseCard key={item.id} item={item} onSelect={setSelectedId} isActive={selectedId === item.id} />
                          ))}
                          {col.items.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">案件なし</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {progressColumns.map(col => {
                  const meta = STATUS_META[col.key] || {};
                  return (
                    <div key={col.key} className="border border-slate-100 rounded-3xl p-3 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className={`px-2 py-1 rounded-full ${meta.chip || 'bg-slate-100 text-slate-600'}`}>{col.label}</span>
                          <span className="text-slate-400">{meta.hint}</span>
                        </div>
                        <span className="text-xs text-slate-400">{col.items.length}件</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {col.items.length === 0 && <p className="text-xs text-slate-400">案件なし</p>}
                        {col.items.map(item => (
                          <CompactCaseRow key={item.id} item={item} onSelect={setSelectedId} isActive={selectedId === item.id} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">期限管理</p>
                  <p className="text-lg font-semibold text-slate-800">直近の案件</p>
                </div>
                <span className="text-xs text-slate-400">最大4件</span>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingCases.length === 0 && <p className="text-sm text-slate-400">期限が設定された案件はありません。</p>}
                {upcomingCases.map(item => (
                  <div key={item.id} className="border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.company}</p>
                      <p className="text-xs text-slate-400 mt-1">{STATUS_COLUMNS.find(s => s.key === item.status)?.label || '―'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-800">{formatDate(item.due)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full inline-flex mt-2 font-semibold ${PRIORITY_BADGE[item.priority] || 'bg-slate-100 text-slate-600'}`}>
                        {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">担当別ワークロード</p>
                  <p className="text-lg font-semibold text-slate-800">リソース配分</p>
                </div>
                <span className="text-xs text-slate-400">自動集計</span>
              </div>
              <div className="mt-4 space-y-3">
                {ownerStats.length === 0 && <p className="text-sm text-slate-400">担当データがありません。</p>}
                {ownerStats.map(stat => (
                  <div key={stat.owner} className="flex items-center justify-between border border-slate-100 rounded-2xl p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{stat.owner}</p>
                      <p className="text-xs text-slate-500">高優先度 {stat.high}件</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-slate-800">{stat.total}</p>
                      <p className="text-xs text-slate-400">総案件</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">更新履歴</p>
                <p className="text-lg font-semibold text-slate-800">アクティビティログ</p>
              </div>
              <span className="text-xs text-slate-400">最新5件</span>
            </div>
            <div className="mt-4 space-y-4">
              {activityFeed.length === 0 && <p className="text-sm text-slate-400">表示できる履歴がありません。</p>}
              {activityFeed.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-semibold ${PRIORITY_BADGE[item.priority] || 'bg-slate-100 text-slate-600'}`}>
                    {item.status.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-slate-700">{item.title}</p>
                      <span className="text-xs text-slate-500">{item.due}</span>
                    </div>
                    <p className="text-xs text-slate-500">{item.status}</p>
                    <p className="text-sm text-slate-600 mt-1">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右カラム: 詳細 + メモ + 操作 */}
        <div className="space-y-4">
          <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md flex flex-col gap-4 sticky top-6 h-fit">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">選択中の案件</p>
              {selectedCase && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_BADGE[selectedCase.priority] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedCase.priority === 'high' ? '高' : selectedCase.priority === 'medium' ? '中' : '低'}
                </span>
              )}
            </div>
            {selectedCase ? (
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs text-slate-500">案件名</p>
                  <p className="text-base font-semibold">{selectedCase.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">会社名</p>
                    <p>{selectedCase.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">担当</p>
                    <p>{selectedCase.owner}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ステータス</p>
                    <p>{STATUS_COLUMNS.find(s => s.key === selectedCase.status)?.label || '―'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">期限</p>
                    <p>{formatDate(selectedCase.due)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">プロダクト</p>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{selectedCase.product}</Pill>
                    {selectedCase.tags?.map(tag => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">備考 / コメント</p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{selectedCase.comment}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">最新メモ</p>
                  <p className="text-slate-700 leading-relaxed bg-white rounded-xl p-3 border border-slate-100 shadow-inner">{selectedCase.lastNote}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">案件を選択してください</p>
            )}
          </div>

          <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">個人メモ</p>
              <span className="text-xs text-slate-400">社内共有不可</span>
            </div>
            <textarea
              className="w-full min-h-[120px] rounded-2xl border border-slate-200 p-3 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="bg-white/90 border border-white/70 rounded-3xl p-4 shadow-md">
            <p className="text-sm font-semibold text-slate-700">クイック操作</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="px-3 py-2 rounded-xl text-sm border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 transition">進捗更新</button>
              <button className="px-3 py-2 rounded-xl text-sm border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 transition">フォローアップ</button>
              <button className="px-3 py-2 rounded-xl text-sm border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 transition">リマインド送信</button>
              <button className="px-3 py-2 rounded-xl text-sm border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 transition">エクスポート</button>
            </div>
          </div>
        </div>
      </div>

      {/* 下部フォーム風セクション */}
      <div className="bg-white/90 border border-white/70 rounded-3xl p-6 shadow-md grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="fas fa-clipboard-check text-emerald-500"></i>
            案件概要
          </p>
          <div className="space-y-3">
            <div className="flex flex-col text-sm">
              <span className="text-slate-500">案件名</span>
              <input className="border border-slate-200 rounded-xl px-3 py-2" placeholder="案件名" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="text-slate-500">会社名</span>
              <input className="border border-slate-200 rounded-xl px-3 py-2" placeholder="会社名" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="text-slate-500">優先度レベル</span>
              <select className="border border-slate-200 rounded-xl px-3 py-2">
                <option>高</option>
                <option>中</option>
                <option>低</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="fas fa-edit text-amber-500"></i>
            デリバリー/制作
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm text-slate-600">
              <span>提案書</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-600">
              <span>進行中</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-600">
              <span>未着手</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-600">
              <span>評価中</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="fas fa-calendar-check text-blue-500"></i>
            契約見込日
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">第1候補</span>
              <input type="date" className="border border-slate-200 rounded-xl px-3 py-2" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">第2候補</span>
              <input type="date" className="border border-slate-200 rounded-xl px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200">保存</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm">クリア</button>
          </div>
        </div>
      </div>
    </div>
  );
}
