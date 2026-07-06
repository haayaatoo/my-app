import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';

// 全角数字→半角数字（必要最小限）
const toHalfWidthDigits = (s) => String(s ?? '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

// 数値文字列に3桁コンマを挿入（表示専用）
const formatNumberWithCommas = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const raw = toHalfWidthDigits(String(val)).replace(/,/g, '');
  if (!/^\d*$/.test(raw)) return String(val);
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 日付入力（手入力 YYYY/MM/DD + カレンダー選択）
function SmartDateInput({ value, onChange, name, className }) {
  const [displayValue, setDisplayValue] = React.useState('');
  const textRef = React.useRef(null);
  const pickerRef = React.useRef(null);

  React.useEffect(() => {
    if (value) {
      const p = String(value).split('-');
      setDisplayValue(p.length === 3 ? `${p[0]}/${p[1]}/${p[2]}` : String(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleText = (e) => {
    const cleaned = e.target.value.replace(/[^0-9/]/g, '');
    const digits = cleaned.replace(/\//g, '').slice(0, 8);
    let fmt = '';
    if (digits.length <= 4) fmt = digits;
    else if (digits.length <= 6) fmt = `${digits.slice(0, 4)}/${digits.slice(4)}`;
    else fmt = `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`;
    setDisplayValue(fmt);
    if (digits.length === 8) onChange({ target: { name, value: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` } });
    else if (digits.length === 0) onChange({ target: { name, value: '' } });
  };

  React.useEffect(() => {
    const el = textRef.current;
    if (el && document.activeElement === el) el.setSelectionRange(displayValue.length, displayValue.length);
  }, [displayValue]);

  const openCalendar = () => {
    try { pickerRef.current?.showPicker(); } catch { pickerRef.current?.focus(); }
  };

  return (
    <div className="relative">
      <input
        ref={textRef}
        type="text"
        value={displayValue}
        onChange={handleText}
        className={`${className} pr-10`}
        placeholder="YYYY/MM/DD"
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={openCalendar}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <i className="fas fa-calendar-alt"></i>
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const p = e.target.value.split('-');
          if (p.length === 3) {
            setDisplayValue(`${p[0]}/${p[1]}/${p[2]}`);
            onChange({ target: { name, value: e.target.value } });
          }
        }}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
      />
    </div>
  );
}

// 時間入力（手入力 HH:MM + ピッカー選択）
function SmartTimeInput({ value, onChange, name, className }) {
  const [displayValue, setDisplayValue] = React.useState('');
  const textRef = React.useRef(null);
  const pickerRef = React.useRef(null);

  React.useEffect(() => { setDisplayValue(value || ''); }, [value]);

  const handleText = (e) => {
    const digits = e.target.value.replace(/[^0-9:]/g, '').replace(/:/g, '').slice(0, 4);
    const fmt = digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
    setDisplayValue(fmt);
    if (digits.length === 4) onChange({ target: { name, value: `${digits.slice(0, 2)}:${digits.slice(2, 4)}` } });
    else if (digits.length === 0) onChange({ target: { name, value: '' } });
  };

  React.useEffect(() => {
    const el = textRef.current;
    if (el && document.activeElement === el) el.setSelectionRange(displayValue.length, displayValue.length);
  }, [displayValue]);

  const openPicker = () => {
    try { pickerRef.current?.showPicker(); } catch { pickerRef.current?.focus(); }
  };

  return (
    <div className="relative">
      <input
        ref={textRef}
        type="text"
        value={displayValue}
        onChange={handleText}
        className={`${className} pr-10`}
        placeholder="HH:MM"
        maxLength={5}
        inputMode="numeric"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <i className="fas fa-clock"></i>
      </button>
      <input
        ref={pickerRef}
        type="time"
        value={value || ''}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          setDisplayValue(e.target.value);
          onChange({ target: { name, value: e.target.value } });
        }}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
      />
    </div>
  );
}

// 年月入力（手入力 YYYY/MM + ピッカー選択）
function SmartMonthInput({ value, onChange, name, className }) {
  const [displayValue, setDisplayValue] = React.useState('');
  const textRef = React.useRef(null);
  const pickerRef = React.useRef(null);

  React.useEffect(() => {
    if (value) {
      const p = String(value).split('-');
      setDisplayValue(p.length === 2 ? `${p[0]}/${p[1]}` : String(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleText = (e) => {
    const digits = e.target.value.replace(/[^0-9/]/g, '').replace(/\//g, '').slice(0, 6);
    const fmt = digits.length <= 4 ? digits : `${digits.slice(0, 4)}/${digits.slice(4)}`;
    setDisplayValue(fmt);
    if (digits.length === 6) onChange({ target: { name, value: `${digits.slice(0, 4)}-${digits.slice(4, 6)}` } });
    else if (digits.length === 0) onChange({ target: { name, value: '' } });
  };

  React.useEffect(() => {
    const el = textRef.current;
    if (el && document.activeElement === el) el.setSelectionRange(displayValue.length, displayValue.length);
  }, [displayValue]);

  const openPicker = () => {
    try { pickerRef.current?.showPicker(); } catch { pickerRef.current?.focus(); }
  };

  return (
    <div className="relative">
      <input
        ref={textRef}
        type="text"
        value={displayValue}
        onChange={handleText}
        className={`${className} pr-10`}
        placeholder="YYYY/MM"
        maxLength={7}
        inputMode="numeric"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <i className="fas fa-calendar-alt"></i>
      </button>
      <input
        ref={pickerRef}
        type="month"
        value={value || ''}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const p = e.target.value.split('-');
          if (p.length === 2) {
            setDisplayValue(`${p[0]}/${p[1]}`);
            onChange({ target: { name, value: e.target.value } });
          }
        }}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
      />
    </div>
  );
}

// カンバンボードのカラム定義
const KANBAN_COLUMNS = [
  { id: 'scheduling', title: '日程調整中',        icon: 'fa-calendar-plus',  color: 'from-slate-500 to-slate-600' },
  { id: 'scheduled',  title: '面談予定',           icon: 'fa-calendar-check', color: 'from-blue-400 to-blue-500' },
  { id: 'completed',  title: '面談済み／回答待ち',  icon: 'fa-handshake',      color: 'from-indigo-400 to-indigo-500' },
  { id: 'won',        title: '成約',               icon: 'fa-trophy',         color: 'from-emerald-500 to-emerald-600' },
  { id: 'declined',   title: '見送り',             icon: 'fa-times-circle',   color: 'from-red-500 to-red-600' }
];

// ステータスとカラムのマッピング
const STATUS_TO_COLUMN_BP = {
  '日程調整中':         'scheduling',
  '日程調整中（1/2）':  'scheduling',
  '日程調整中（2/2）':  'scheduling',
  '面談予定':           'scheduled',
  '面談予定（1/2）':    'scheduled',
  '面談予定（2/2）':    'scheduled',
  '面談済み／回答待ち':         'completed',
  '面談済み／回答待ち（1/2）':  'completed',
  '面談済み／回答待ち（2/2）':  'completed',
  '成約':    'won',
  '見送り':  'declined',
  // 旧ステータス（後方互換）
  '面談済み':               'completed',
  '回答待ち':               'completed',
  '面談済み（1/2）／回答待ち': 'completed',
  '面談済み（2/2）／回答待ち': 'completed',
};

const COLUMN_TO_STATUS = {
  'scheduling': '日程調整中',
  'scheduled':  '面談予定',
  'completed':  '面談済み／回答待ち',
  'won':        '成約',
  'declined':   '見送り'
};

// ステータスの（1/2）／（2/2）サフィックスを取得
const getStatusSuffix = (status) => {
  if (!status) return null;
  if (status.includes('（1/2）')) return '1/2';
  if (status.includes('（2/2）')) return '2/2';
  return null;
};

const formatDateWithTime = (dateValue, timeValue) => {
  if (!dateValue) return '未定';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return timeValue ? `${formattedDate} ${timeValue}` : formattedDate;
};

const formatStartMonth = (monthValue) => {
  if (!monthValue || monthValue === '未定') return '未定';
  const parts = String(monthValue).split('-');
  if (parts.length !== 2) return String(monthValue);
  return `${parts[0]}年${Number(parts[1])}月`;
};

const getDateTimeForSort = (prospect, fallbackField = 'interview_date') => {
  const dateValue = prospect[fallbackField] || prospect.interview_date || prospect.decision_date || '';
  const timeValue = prospect.interview_time || '00:00';
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const getRecentChangeTime = (prospect) => {
  const timestamps = (prospect.history || [])
    .map(entry => new Date(entry.timestamp).getTime())
    .filter(time => !Number.isNaN(time));
  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
};

const compareProspectsByColumn = (columnId, a, b) => {
  if (columnId === 'won' || columnId === 'declined') {
    const aTime = getDateTimeForSort(a, 'decision_date') || getRecentChangeTime(a);
    const bTime = getDateTimeForSort(b, 'decision_date') || getRecentChangeTime(b);
    return bTime - aTime;
  }

  const aTime = getDateTimeForSort(a);
  const bTime = getDateTimeForSort(b);
  if (aTime !== null && bTime !== null) return aTime - bTime;
  if (aTime !== null) return -1;
  if (bTime !== null) return 1;
  return getRecentChangeTime(b) - getRecentChangeTime(a);
};

const normalizeBPStatus = (status) => String(status || '');

const parseBPHistoryTimestamp = (timestamp) => {
  if (!timestamp) return null;
  const parsed = new Date(String(timestamp).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const getBPLatestRecordTimestamp = (prospect) => {
  const candidates = [prospect.updated_at, prospect.created_at]
    .map(parseBPHistoryTimestamp)
    .filter(Boolean);
  const historyCandidates = (prospect.history || [])
    .map(entry => parseBPHistoryTimestamp(entry.timestamp))
    .filter(Boolean);
  const allCandidates = [...candidates, ...historyCandidates];
  return allCandidates.length > 0 ? Math.max(...allCandidates) : 0;
};

const getBPStatusChangeTimestamp = (prospect, targetStatuses) => {
  const history = Array.isArray(prospect.history) ? prospect.history : [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    const hasChange = (entry.changes || []).some(c => {
      const f = String(c.field || '').trim();
      if (f !== 'ステータス' && f !== 'status') return false;
      return targetStatuses.includes(normalizeBPStatus(c.new));
    });
    if (hasChange) {
      const time = parseBPHistoryTimestamp(entry.timestamp);
      if (time) return time;
    }
  }
  return null;
};

const getIsArchivedProspect = (prospect) => {
  const status = normalizeBPStatus(prospect.status);
  const now = Date.now();
  if (status === '成約' || status.startsWith('成約')) {
    const sm = prospect.start_month || prospect.decision_date || '';
    if (!sm || sm === '未定') return false;
    const parts = String(sm).split('-');
    if (parts.length !== 2) return false;
    const nextMonthStart = new Date(Number(parts[0]), Number(parts[1]), 1).getTime();
    return now >= nextMonthStart;
  }
  if (status === '見送り') {
    const lostAt = getBPStatusChangeTimestamp(prospect, ['見送り']);
    return lostAt ? now - lostAt >= 7 * 24 * 60 * 60 * 1000 : false;
  }
  return false;
};

export default function BPProgress() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProspectModal, setShowNewProspectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState('成約');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editingProspect, setEditingProspect] = useState(null);
  const [selectedPlanner, setSelectedPlanner] = useState('all');
  const [selectedStatsMonth, setSelectedStatsMonth] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  
  // 自動スクロール用のref
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  // 新規登録フォームのバリデーションエラー
  const [newProspectErrors, setNewProspectErrors] = useState({});
  
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
    main_planner: '',
    support_planners: [],
    status: '',
    notes: ''
  });

  // プランナーリスト
  const planners = ['温水', '瀬戸山', '上前', '岡田', '野田', '服部'];

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
  const calculatePlannerStats = (monthFilter = 'all') => {
    const stats = {};
    planners.forEach(planner => {
      stats[planner] = { main: 0, support: 0, total: 0 };
    });

    const filtered = monthFilter === 'all'
      ? prospects
      : prospects.filter(p => {
          const dateMonth = p.interview_date ? String(p.interview_date).slice(0, 7) : '';
          return dateMonth === monthFilter;
        });

    filtered.forEach(prospect => {
      // クライアント担当: 常に0.5件
      if (stats[prospect.main_planner]) {
        stats[prospect.main_planner].main += 0.5;
      }
      
      // パートナー担当: 各0.5件
      (prospect.support_planners || []).forEach(sp => {
        if (stats[sp]) {
          stats[sp].support += 0.5;
        }
      });
    });

    // 合計を計算
    Object.keys(stats).forEach(planner => {
      stats[planner].total = stats[planner].main + stats[planner].support;
    });

    return stats;
  };

  const now = new Date();
  const recentMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const plannerStats = calculatePlannerStats(selectedStatsMonth);

  // フィルタリング
  const filteredProspects = prospects.filter(prospect => {
    const plannerMatch = selectedPlanner === 'all' || 
      prospect.main_planner === selectedPlanner || 
      prospect.support_planners.includes(selectedPlanner);
    
    return plannerMatch;
  });

  // ステータス別の件数を計算（月フィルター対応）
  const getStatusCounts = (monthFilter = 'all') => {
    const source = monthFilter === 'all'
      ? prospects
      : prospects.filter(p => p.interview_date && String(p.interview_date).slice(0, 7) === monthFilter);
    const counts = {
      '日程調整中': 0,
      '面談予定': 0,
      '面談済み／回答待ち': 0,
      '成約': 0,
      '見送り': 0
    };
    const normalize = (s) => {
      if (!s) return '';
      if (s.startsWith('日程調整中')) return '日程調整中';
      if (s.startsWith('面談予定')) return '面談予定';
      if (s.startsWith('面談済み') || s === '回答待ち' || s === '面談済み／回答待ち') return '面談済み／回答待ち';
      if (s === '成約') return '成約';
      if (s === '見送り') return '見送り';
      return '';
    };
    source.forEach(prospect => {
      const key = normalize(prospect.status);
      if (key && counts[key] !== undefined) counts[key]++;
    });
    return counts;
  };

  // ステータスサマリー用カラー設定
  const STATUS_SUMMARY_CONFIG = [
    { key: '日程調整中',        icon: 'fa-calendar-plus',  color: 'from-slate-500 to-slate-600',   bg: 'from-slate-50 to-slate-100',   border: 'border-slate-300',   text: 'text-slate-700' },
    { key: '面談予定',           icon: 'fa-calendar-check', color: 'from-blue-400 to-blue-500',     bg: 'from-blue-50 to-blue-100',     border: 'border-blue-300',    text: 'text-blue-700' },
    { key: '面談済み／回答待ち',  icon: 'fa-handshake',      color: 'from-indigo-400 to-indigo-500', bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-300',  text: 'text-indigo-700' },
    { key: '成約',               icon: 'fa-trophy',         color: 'from-emerald-500 to-emerald-600', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
    { key: '見送り',             icon: 'fa-times-circle',   color: 'from-red-500 to-red-600',       bg: 'from-red-50 to-red-100',       border: 'border-red-300',     text: 'text-red-700' },
  ];

  const statusCounts = getStatusCounts(selectedStatsMonth);

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
    return filteredProspects
      .filter(p => !getIsArchivedProspect(p))
      .filter(p => STATUS_TO_COLUMN_BP[p.status] === columnId)
      .slice()
      .sort((a, b) => compareProspectsByColumn(columnId, a, b));
  };

  const archiveProspects = prospects
    .filter(p => normalizeBPStatus(p.status) === archiveStatus)
    .slice()
    .sort((a, b) => getBPLatestRecordTimestamp(b) - getBPLatestRecordTimestamp(a));

  // 新規見込み追加
  const handleAddProspect = () => {
    // バリデーション
    const errors = {};
    if (!newProspect.company_name.trim()) errors.company_name = 'クライアント名は必須です';
    if (!newProspect.engineer_name.trim()) errors.engineer_name = 'パートナー名は必須です';
    if (!newProspect.main_planner) errors.main_planner = 'クライアントは必須です';

    if (Object.keys(errors).length > 0) {
      setNewProspectErrors(errors);
      return;
    }
    setNewProspectErrors({});

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const payload = {
      ...newProspect,
      status: newProspect.status || '日程調整中（1/2）',
      sales_price: newProspect.sales_price === '' ? '' : Number(String(newProspect.sales_price).replace(/,/g, '')),
      purchase_price: newProspect.purchase_price === '' ? '' : Number(String(newProspect.purchase_price).replace(/,/g, '')),
      interview_count: { main: 1, support: newProspect.support_planners.length > 0 ? 0.5 : 0 },
      history: [{ timestamp, user: newProspect.main_planner || '不明', changes: [{ field: '作成', old: '', new: '新規登録' }] }]
    };
    apiFetch('/bp-prospects/', { method: 'POST', body: JSON.stringify(payload) })
      .then(async res => {
        if (!res.ok) {
          let errMsg = `HTTPエラー ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = JSON.stringify(errData);
          } catch {
            try { errMsg = await res.text(); } catch {}
          }
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then(created => {
        setProspects(prev => [created, ...prev]);
        setShowNewProspectModal(false);
        setNewProspect({ company_name: '', engineer_name: '', supplier_name: '', interview_date: '', interview_time: '', decision_date: '', start_month: '', sales_price: '', purchase_price: '', main_planner: '', support_planners: [], status: '', notes: '' });
        setNewProspectErrors({});
      })
      .catch(err => {
        console.error('登録エラー詳細:', err);
        const msg = err?.message ? `登録に失敗しました: ${err.message}` : '登録に失敗しました。入力内容を確認してください。';
        setNewProspectErrors({ api: msg });
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
              <span className="text-purple-600 font-medium">パートナー</span>
              <span>= パートナー担当</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-600 font-medium">表示月:</span>
            <select
              value={selectedStatsMonth}
              onChange={(e) => setSelectedStatsMonth(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              <option value="all">全期間</option>
              {recentMonths.map((month, i) => {
                const m = parseInt(month.split('-')[1]);
                const optLabel = i === 0 ? `今月 (${m}月)` : i === 1 ? `先月 (${m}月)` : i === 2 ? `先々月 (${m}月)` : `${m}月 (${i}ヶ月前)`;
                return <option key={month} value={month}>{optLabel}</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STATUS_SUMMARY_CONFIG.map(({ key, icon, color }) => (
              <div
                key={key}
                className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <i className={`fas ${icon} text-2xl opacity-80`}></i>
                  <span className="text-4xl font-bold">{statusCounts[key] ?? 0}</span>
                </div>
                <p className="text-white/80 text-sm font-medium truncate">{key}</p>
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

            <div className="ml-auto flex items-center gap-3">
              <span className="text-slate-600 text-sm">
                表示件数: <span className="font-bold text-amber-600">{filteredProspects.length}</span> / {prospects.length}
              </span>
              <button
                onClick={() => setShowNewProspectModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl hover:shadow-md transition-all duration-300 flex items-center gap-2 font-medium text-sm"
              >
                <i className="fas fa-plus text-xs"></i>
                新規見込み登録
              </button>
              <button
                onClick={() => { setArchiveStatus('成約'); setShowArchiveModal(true); }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl hover:shadow-md transition-all duration-300 flex items-center gap-2 font-medium text-sm"
              >
                <i className="fas fa-history text-xs"></i>
                履歴
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

            </p>
          </div>
        </div>

        {/* カンバンボード（パイプラインビュー） */}
        <div 
          ref={scrollContainerRef}
          className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6"
        >
          <div className="grid grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((column, columnIndex) => {
              const columnProspects = getProspectsByColumn(column.id);
              
              return (
                <div 
                  key={column.id}
                  className="animate-slideInFromLeft"
                  style={{ animationDelay: `${columnIndex * 0.1}s` }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* カラムヘッダー */}
                  <div className={`bg-gradient-to-r ${column.color} text-white rounded-2xl p-4 mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className={`fas ${column.icon} text-xl`}></i>
                        <h3 className="font-bold text-sm whitespace-nowrap">{column.title}</h3>
                      </div>
                      <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                        {columnProspects.length}
                      </span>
                    </div>
                  </div>

                  {/* カードリスト（カラム内スクロール） */}
                  <div className="space-y-3 min-h-[120px] max-h-[55vh] overflow-y-auto pr-1">
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
                        {/* （1/2）/（2/2）バッジ */}
                        {getStatusSuffix(prospect.status) && (
                          <div className="flex justify-end mb-2">
                            <span className="bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
                              {getStatusSuffix(prospect.status)}
                            </span>
                          </div>
                        )}

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
                        <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 mb-2">
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <i className="fas fa-calendar text-slate-400"></i>
                            <span className="font-medium text-slate-600">面談日</span>
                            <span className="text-slate-700">{formatDateWithTime(prospect.interview_date, prospect.interview_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <i className="fas fa-calendar-alt text-slate-400"></i>
                            <span className="font-medium text-slate-600">開始月</span>
                            <span className="text-slate-700">{formatStartMonth(prospect.start_month)}</span>
                          </div>
                        </div>

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
                    <h3 className="text-2xl font-bold mb-2">{selectedProspect.company_name}</h3>
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
                    <p className="text-sm text-slate-600 mb-1">クライアント</p>
                    <p className="font-bold text-slate-800">{selectedProspect.main_planner}</p>
                  </div>
                </div>

                {selectedProspect.support_planners.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 mb-2">パートナー</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProspect.support_planners.map(sp => (
                        <span key={sp} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-700 mb-1">面談日時</p>
                    <p className="font-bold text-green-900">
                      {formatDateWithTime(selectedProspect.interview_date, selectedProspect.interview_time)}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-700 mb-1">開始月</p>
                    <p className="font-bold text-amber-900">{formatStartMonth(selectedProspect.start_month)}</p>
                  </div>
                </div>

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
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowArchiveModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className={`bg-gradient-to-r ${archiveStatus === '成約' ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white p-6 rounded-t-3xl`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{archiveStatus}履歴</h3>
                    <p className="text-sm opacity-80">画面上では消えた案件も、ここから履歴を確認できます。</p>
                  </div>
                  <button onClick={() => setShowArchiveModal(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  {['成約', '見送り'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setArchiveStatus(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        archiveStatus === status
                          ? status === '成約'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {archiveProspects.length > 0 ? archiveProspects.map((prospect) => (
                    <button
                      key={prospect.id}
                      type="button"
                      onClick={() => { setShowArchiveModal(false); setSelectedProspect(prospect); setShowDetailModal(true); }}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 border border-slate-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 truncate">{prospect.company_name}</span>
                            <span className="text-xs text-slate-500">{prospect.engineer_name}</span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <p>クライアント: {prospect.main_planner}</p>
                            <p>面談日: {formatDateWithTime(prospect.interview_date, prospect.interview_time)}</p>
                            <p>開始月: {formatStartMonth(prospect.start_month)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                          archiveStatus === '成約' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{archiveStatus}</span>
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-12 text-slate-400">
                      <i className="fas fa-history text-4xl mb-3 opacity-20"></i>
                      <p className="text-sm">履歴はまだありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 新規見込み登録モーダル */}
        {showNewProspectModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNewProspectModal(false);
                setNewProspect({ company_name: '', engineer_name: '', supplier_name: '', interview_date: '', interview_time: '', decision_date: '', start_month: '', sales_price: '', purchase_price: '', main_planner: '', support_planners: [], status: '', notes: '' });
                setNewProspectErrors({});
              }
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <i className="fas fa-plus-circle"></i>
                  新規BP見込み登録
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                {/* APIエラー表示 */}
                {newProspectErrors.api && (
                  <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i>
                    {newProspectErrors.api}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      クライアント <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProspect.company_name}
                      onChange={(e) => {
                        setNewProspect({ ...newProspect, company_name: e.target.value });
                        if (newProspectErrors.company_name) setNewProspectErrors(prev => ({ ...prev, company_name: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        newProspectErrors.company_name ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="例: トヨタ自動車"
                    />
                    {newProspectErrors.company_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {newProspectErrors.company_name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      パートナー <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProspect.engineer_name}
                      onChange={(e) => {
                        setNewProspect({ ...newProspect, engineer_name: e.target.value });
                        if (newProspectErrors.engineer_name) setNewProspectErrors(prev => ({ ...prev, engineer_name: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        newProspectErrors.engineer_name ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="例: YM"
                    />
                    {newProspectErrors.engineer_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {newProspectErrors.engineer_name}
                      </p>
                    )}
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
                    <SmartDateInput
                      name="interview_date"
                      value={newProspect.interview_date}
                      onChange={(e) => setNewProspect({ ...newProspect, interview_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                    <SmartTimeInput
                      name="interview_time"
                      value={newProspect.interview_time}
                      onChange={(e) => setNewProspect({ ...newProspect, interview_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">決定日</label>
                    <SmartDateInput
                      name="decision_date"
                      value={newProspect.decision_date}
                      onChange={(e) => setNewProspect({ ...newProspect, decision_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始月</label>
                    <SmartMonthInput
                      name="start_month"
                      value={newProspect.start_month}
                      onChange={(e) => setNewProspect({ ...newProspect, start_month: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">売上単価</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(newProspect.sales_price)}
                          onChange={(e) => {
                            const raw = toHalfWidthDigits(e.target.value).replace(/,/g, '');
                            if (raw === '' || /^\d*$/.test(raw)) setNewProspect({ ...newProspect, sales_price: raw });
                          }}
                          className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="例: 600,000"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 whitespace-nowrap">円</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ単価</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(newProspect.purchase_price)}
                          onChange={(e) => {
                            const raw = toHalfWidthDigits(e.target.value).replace(/,/g, '');
                            if (raw === '' || /^\d*$/.test(raw)) setNewProspect({ ...newProspect, purchase_price: raw });
                          }}
                          className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="例: 500,000"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 whitespace-nowrap">円</span>
                    </div>
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    クライアント <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.map(planner => (
                      <button
                        key={planner}
                        type="button"
                        onClick={() => {
                          setNewProspect({ ...newProspect, main_planner: planner });
                          if (newProspectErrors.main_planner) setNewProspectErrors(prev => ({ ...prev, main_planner: '' }));
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          newProspect.main_planner === planner
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {planner}
                      </button>
                    ))}
                  </div>
                  {newProspectErrors.main_planner && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {newProspectErrors.main_planner}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    パートナー
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.map(planner => (
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
                    <option value="">選択してください</option>
                    <option value="日程調整中">日程調整中</option>
                    <option value="日程調整中（1/2）">日程調整中（1/2）</option>
                    <option value="日程調整中（2/2）">日程調整中（2/2）</option>
                    <option value="面談予定">面談予定</option>
                    <option value="面談予定（1/2）">面談予定（1/2）</option>
                    <option value="面談予定（2/2）">面談予定（2/2）</option>
                    <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                    <option value="面談済み／回答待ち（1/2）">面談済み／回答待ち（1/2）</option>
                    <option value="面談済み／回答待ち（2/2）">面談済み／回答待ち（2/2）</option>
                    <option value="成約">成約</option>
                    <option value="見送り">見送り</option>
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
                  onClick={() => {
                    setShowNewProspectModal(false);
                    setNewProspectErrors({});
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

        {/* 編集モーダル */}
        {showEditModal && editingProspect && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingProspect(null);
              }
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
                    <SmartDateInput
                      name="interview_date"
                      value={editingProspect.interview_date}
                      onChange={(e) => setEditingProspect({ ...editingProspect, interview_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面談時間</label>
                    <SmartTimeInput
                      name="interview_time"
                      value={editingProspect.interview_time}
                      onChange={(e) => setEditingProspect({ ...editingProspect, interview_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">決定日</label>
                    <SmartDateInput
                      name="decision_date"
                      value={editingProspect.decision_date || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, decision_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始月</label>
                    <SmartMonthInput
                      name="start_month"
                      value={editingProspect.start_month || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, start_month: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">売上単価</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editingProspect.sales_price ?? '')}
                          onChange={(e) => {
                            const raw = toHalfWidthDigits(e.target.value).replace(/,/g, '');
                            if (raw === '' || /^\d*$/.test(raw)) setEditingProspect({ ...editingProspect, sales_price: raw === '' ? '' : raw });
                          }}
                          className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 600,000"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 whitespace-nowrap">円</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">仕入れ単価</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editingProspect.purchase_price ?? '')}
                          onChange={(e) => {
                            const raw = toHalfWidthDigits(e.target.value).replace(/,/g, '');
                            if (raw === '' || /^\d*$/.test(raw)) setEditingProspect({ ...editingProspect, purchase_price: raw === '' ? '' : raw });
                          }}
                          className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 500,000"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 whitespace-nowrap">円</span>
                    </div>
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    クライアント <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.map(planner => (
                      <button
                        key={planner}
                        type="button"
                        onClick={() => setEditingProspect({ ...editingProspect, main_planner: planner })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          editingProspect.main_planner === planner
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    パートナー
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {planners.map(planner => (
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
                    <option value="日程調整中（1/2）">日程調整中（1/2）</option>
                    <option value="日程調整中（2/2）">日程調整中（2/2）</option>
                    <option value="面談予定">面談予定</option>
                    <option value="面談予定（1/2）">面談予定（1/2）</option>
                    <option value="面談予定（2/2）">面談予定（2/2）</option>
                    <option value="面談済み／回答待ち">面談済み／回答待ち</option>
                    <option value="面談済み／回答待ち（1/2）">面談済み／回答待ち（1/2）</option>
                    <option value="面談済み／回答待ち（2/2）">面談済み／回答待ち（2/2）</option>
                    <option value="成約">成約</option>
                    <option value="見送り">見送り</option>
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
