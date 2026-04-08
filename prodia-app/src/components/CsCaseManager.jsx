import React, { useCallback, useEffect, useMemo, useState } from 'react';

// ─────────────────────────────────────
// 定数
// ─────────────────────────────────────
const STATUS_COLUMNS = [
  { key: 'new',        label: '新規',      icon: 'fa-star',           accent: 'from-sky-50 to-white',     border: 'border-sky-100',     chip: 'bg-sky-100 text-sky-700',         hint: '初回ヒアリング・要件整理', wip: 6  },
  { key: 'proposal',   label: '提案中',    icon: 'fa-file-signature', accent: 'from-indigo-50 to-white',  border: 'border-indigo-100',  chip: 'bg-indigo-100 text-indigo-700',   hint: '提案書・見積提出',         wip: 5  },
  { key: 'evaluation', label: '評価中',    icon: 'fa-flask',          accent: 'from-amber-50 to-white',   border: 'border-amber-100',   chip: 'bg-amber-100 text-amber-700',     hint: 'PoC・評価環境',            wip: 4  },
  { key: 'approval',   label: '承認待ち',  icon: 'fa-stamp',          accent: 'from-rose-50 to-white',    border: 'border-rose-100',    chip: 'bg-rose-100 text-rose-700',       hint: '社内稟議〜最終決裁',       wip: 3  },
  { key: 'contract',   label: '契約済',    icon: 'fa-file-contract',  accent: 'from-emerald-50 to-white', border: 'border-emerald-100', chip: 'bg-emerald-100 text-emerald-700', hint: '契約締結済み',              wip: 6  },
  { key: 'live',       label: '運用中',    icon: 'fa-wave-square',    accent: 'from-slate-50 to-white',   border: 'border-slate-100',   chip: 'bg-slate-100 text-slate-600',     hint: 'オンボード完了・伴走',     wip: 10 },
];

const STATUS_META = STATUS_COLUMNS.reduce((acc, col) => { acc[col.key] = col; return acc; }, {});
const STATUS_ORDER = STATUS_COLUMNS.map(c => c.key);

const PRIORITY_META = {
  high:   { label: '高', badge: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-400'    },
  medium: { label: '中', badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  low:    { label: '低', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
};

// ─────────────────────────────────────
// サンプルデータ（初回起動時のみ表示）
// ─────────────────────────────────────
const SAMPLE_CASES = [
  {
    id: 'cs-s1',
    title: '社内ポータルシステム刷新',
    company: '株式会社テクノソリューション',
    owner: '田中 花子',
    status: 'proposal',
    priority: 'high',
    product: 'Prodia SaaS',
    tags: ['SharePoint移行', 'SSO対応'],
    due: '2026-04-20',
    comment: '300名規模の社内ポータルをクラウドへ移行。セキュリティ要件が厳しく、SAML認証対応が必須。',
    lastNote: '先週の提案ヒアリングで好感触。競合2社と比較検討中。次回4/15に最終提案予定。',
    createdAt: '2026-03-15',
  },
  {
    id: 'cs-s2',
    title: '物流管理DX支援',
    company: '東海ロジスティクス株式会社',
    owner: '鈴木 一郎',
    status: 'evaluation',
    priority: 'high',
    product: 'Prodia Analytics',
    tags: ['IoT連携', 'ダッシュボード'],
    due: '2026-04-25',
    comment: '倉庫内の在庫・入出荷をリアルタイムで可視化。5拠点への横展開も見込む。',
    lastNote: 'PoC期間3週目。精度90%達成。本番移行の見積もり提出済み。',
    createdAt: '2026-03-10',
  },
  {
    id: 'cs-s3',
    title: 'HR管理ツール導入',
    company: '名古屋製造業株式会社',
    owner: '田中 花子',
    status: 'approval',
    priority: 'medium',
    product: 'Prodia HR',
    tags: ['勤怠管理', 'API連携'],
    due: '2026-05-10',
    comment: '紙ベース申請をデジタル化。既存の給与システムとのAPI連携が要件。',
    lastNote: '稟議書提出済み。情報システム部長の承認待ち。',
    createdAt: '2026-03-01',
  },
  {
    id: 'cs-s4',
    title: 'ECサイトパーソナライズ',
    company: '株式会社スマートコマース',
    owner: '山田 次郎',
    status: 'new',
    priority: 'medium',
    product: 'Prodia AI',
    tags: ['レコメンド', 'A/Bテスト'],
    due: '2026-05-30',
    comment: '購買データを活用したAIレコメンドエンジンの実装。年間1,000万PV規模のECサイト。',
    lastNote: '初回ヒアリング完了。要件定義書の作成を依頼中。',
    createdAt: '2026-04-01',
  },
  {
    id: 'cs-s5',
    title: '医療記録デジタル化',
    company: '愛知中央病院',
    owner: '山田 次郎',
    status: 'contract',
    priority: 'high',
    product: 'Prodia DocAI',
    tags: ['HIPAA対応', '電子カルテ'],
    due: '2026-06-01',
    comment: '紙カルテのデジタル化と電子カルテシステムとの連携。セキュリティ要件最高レベル。',
    lastNote: '基本契約締結済み。詳細仕様の最終確認フェーズ。キックオフ5/2予定。',
    createdAt: '2026-02-20',
  },
  {
    id: 'cs-s6',
    title: 'マーケティング自動化ツール',
    company: '株式会社デジタルマーケット',
    owner: '鈴木 一郎',
    status: 'live',
    priority: 'low',
    product: 'Prodia Marketing',
    tags: ['MA', 'CRM連携'],
    due: '2026-03-30',
    comment: 'メール配信・SNS投稿・広告効果測定を一元管理。CRM既存データの移行も含む。',
    lastNote: 'オンボーディング完了。月次レビュー定例化済み。',
    createdAt: '2026-01-10',
  },
];

// ─────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────
const DAY_MS = 1000 * 60 * 60 * 24;

const formatDate = (value) => {
  if (!value) return '未設定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const getDueState = (value) => {
  if (!value) return 'none';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'none';
  const diff = Math.ceil((d.getTime() - Date.now()) / DAY_MS);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 7) return 'dueSoon';
  return 'onTrack';
};

const formatRelativeDue = (value) => {
  if (!value) return '未設定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diff = Math.ceil((d.getTime() - Date.now()) / DAY_MS);
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return '本日締切';
  return `あと${diff}日`;
};

const DUE_STYLES = {
  overdue: 'bg-rose-100 text-rose-700',
  today:   'bg-red-100 text-red-700',
  dueSoon: 'bg-amber-100 text-amber-700',
  onTrack: 'bg-emerald-50 text-emerald-600',
  none:    'bg-slate-100 text-slate-500',
};

const genId = () => `cs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─────────────────────────────────────
// Tag コンポーネント
// ─────────────────────────────────────
const Tag = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
    {children}
  </span>
);

// ─────────────────────────────────────
// 案件フォームモーダル
// ─────────────────────────────────────
const EMPTY_FORM = {
  title: '', company: '', owner: '', status: 'new',
  priority: 'medium', product: '', tags: '', due: '', comment: '', lastNote: '',
};

const CaseFormModal = ({ initial, defaultStatus, onSave, onClose, onDelete }) => {
  const [form, setForm] = useState(() => {
    if (!initial) {
      return defaultStatus ? { ...EMPTY_FORM, status: defaultStatus } : EMPTY_FORM;
    }
    return {
      ...EMPTY_FORM,
      ...initial,
      tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''),
    };
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = '案件名は必須です';
    if (!form.company.trim()) e.company = '会社名は必須です';
    if (!form.owner.trim()) e.owner = '担当者は必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isEdit ? 'bg-amber-400' : 'bg-emerald-500'} flex items-center justify-center shadow-sm`}>
              <i className={`fas ${isEdit ? 'fa-pen' : 'fa-plus'} text-white text-sm`}></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{isEdit ? '案件を編集' : '案件を追加'}</h2>
              <p className="text-xs text-slate-400">{isEdit ? '内容を変更して保存してください' : '新しい案件の情報を入力してください'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">案件名 <span className="text-rose-500">*</span></label>
            <input
              className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition ${errors.title ? 'border-rose-400' : 'border-slate-200'}`}
              placeholder="例：社内ポータル刷新プロジェクト"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
            {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">会社名 <span className="text-rose-500">*</span></label>
              <input
                className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition ${errors.company ? 'border-rose-400' : 'border-slate-200'}`}
                placeholder="例：株式会社XXX"
                value={form.company}
                onChange={e => set('company', e.target.value)}
              />
              {errors.company && <p className="text-xs text-rose-500">{errors.company}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">担当者 <span className="text-rose-500">*</span></label>
              <input
                className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition ${errors.owner ? 'border-rose-400' : 'border-slate-200'}`}
                placeholder="例：田中 花子"
                value={form.owner}
                onChange={e => set('owner', e.target.value)}
              />
              {errors.owner && <p className="text-xs text-rose-500">{errors.owner}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">ステータス</label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white transition"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {STATUS_COLUMNS.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">優先度</label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white transition"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">製品・サービス</label>
              <input
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition"
                placeholder="例：Prodia SaaS"
                value={form.product}
                onChange={e => set('product', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">期限</label>
              <input
                type="date"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition"
                value={form.due}
                onChange={e => set('due', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">タグ <span className="text-slate-400 font-normal">（カンマ区切りで複数入力）</span></label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 transition"
              placeholder="例：SSO対応, API連携, セキュリティ"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">備考・コメント</label>
            <textarea
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 min-h-[80px] resize-none transition"
              placeholder="案件の詳細・背景を入力..."
              value={form.comment}
              onChange={e => set('comment', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">最新メモ</label>
            <textarea
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 min-h-[60px] resize-none transition"
              placeholder="直近のアクション・気づきを記録..."
              value={form.lastNote}
              onChange={e => set('lastNote', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {isEdit && onDelete && (
                <button type="button" onClick={onDelete} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition">
                  <i className="fas fa-trash-alt text-xs"></i>削除
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                キャンセル
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl text-sm bg-emerald-500 text-white font-semibold hover:bg-emerald-600 shadow-sm transition">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────
// CaseCard
// ─────────────────────────────────────
const CaseCard = ({ item, onSelect, isActive, onEdit, onAdvance }) => {
  const statusMeta = STATUS_META[item.status] || {};
  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
  const dueState = getDueState(item.due);
  const nextIndex = STATUS_ORDER.indexOf(item.status) + 1;
  const nextStatus = STATUS_ORDER[nextIndex];

  return (
    <div
      className={`group relative rounded-2xl border p-3.5 flex flex-col gap-2 cursor-pointer transition-all duration-150 ${
        isActive
          ? 'border-emerald-200 bg-white shadow-md ring-2 ring-emerald-100'
          : 'border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200'
      }`}
      onClick={() => onSelect(item.id)}
    >
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-600 hover:border-emerald-200 z-10"
        onClick={e => { e.stopPropagation(); onEdit(item); }}
        title="編集"
      >
        <i className="fas fa-pen text-[10px]"></i>
      </button>

      <div className="flex items-start gap-2 pr-6">
        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${priorityMeta.dot}`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.company}</p>
        </div>
        <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold ${priorityMeta.badge}`}>
          {priorityMeta.label}
        </span>
      </div>

      {(item.product || (item.tags && item.tags.length > 0)) && (
        <div className="flex flex-wrap gap-1">
          {item.product && <Tag>{item.product}</Tag>}
          {item.tags?.slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}
          {(item.tags?.length || 0) > 2 && <Tag>+{item.tags.length - 2}</Tag>}
        </div>
      )}

      {item.lastNote && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 bg-slate-50 rounded-lg px-2.5 py-2">
          {item.lastNote}
        </p>
      )}

      <div className="flex items-center justify-between text-xs mt-0.5">
        <div className="flex items-center gap-1 text-slate-400">
          <i className="fas fa-user text-[10px]"></i>
          <span className="truncate max-w-[72px]">{item.owner}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${DUE_STYLES[dueState]}`}>
          {formatRelativeDue(item.due)}
        </span>
      </div>

      {nextStatus && (
        <button
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/40 transition-all"
          onClick={e => { e.stopPropagation(); onAdvance(item.id, nextStatus); }}
        >
          <i className="fas fa-arrow-right text-[10px]"></i>
          {STATUS_META[nextStatus]?.label} へ進める
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────
// CompactCaseRow（リストビュー用）
// ─────────────────────────────────────
const CompactCaseRow = ({ item, onSelect, isActive, onEdit }) => {
  const statusMeta = STATUS_META[item.status] || {};
  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
  const dueState = getDueState(item.due);

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
        isActive
          ? 'border-emerald-200 bg-emerald-50/60 shadow-sm'
          : 'border-slate-100 bg-white hover:border-emerald-100 hover:bg-emerald-50/20'
      }`}
      onClick={() => onSelect(item.id)}
    >
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${priorityMeta.dot}`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
        <p className="text-xs text-slate-500">{item.company}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${statusMeta.chip}`}>{statusMeta.label}</span>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${DUE_STYLES[dueState]}`}>{formatRelativeDue(item.due)}</span>
        <span className="text-slate-400 hidden sm:block">{formatDate(item.due)}</span>
        <button
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-600 hover:border-emerald-200"
          onClick={e => { e.stopPropagation(); onEdit(item); }}
          title="編集"
        >
          <i className="fas fa-pen text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────
export default function CsCaseManager() {
  const [cases, setCases] = useState(() => {
    try {
      const saved = localStorage.getItem('prodia_cs_cases');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return SAMPLE_CASES;
  });

  const [filters, setFilters] = useState({ status: '', priority: '', owner: '', search: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [sortMode, setSortMode] = useState('dueAsc');
  const [boardView, setBoardView] = useState('kanban');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem('prodia_cs_cases', JSON.stringify(cases));
  }, [cases]);

  const handleSave = useCallback((formData) => {
    setCases(prev => {
      if (modal?.mode === 'edit') {
        return prev.map(c => c.id === modal.caseData.id ? { ...c, ...formData } : c);
      }
      return [
        { ...formData, id: genId(), createdAt: new Date().toISOString().slice(0, 10) },
        ...prev,
      ];
    });
    setModal(null);
  }, [modal]);

  const handleDelete = useCallback((id) => {
    setCases(prev => prev.filter(c => c.id !== id));
    setSelectedId(sel => sel === id ? null : sel);
    setModal(null);
    setDeleteTarget(null);
  }, []);

  const handleAdvanceStatus = useCallback((id, newStatus) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  }, []);

  const handleExport = useCallback(() => {
    const headers = ['案件名', '会社名', '担当者', 'ステータス', '優先度', '製品', '期限', 'タグ', 'コメント', '最新メモ', '作成日'];
    const rows = cases.map(c => [
      c.title, c.company, c.owner,
      STATUS_META[c.status]?.label || c.status,
      PRIORITY_META[c.priority]?.label || c.priority,
      c.product || '',
      c.due || '',
      (c.tags || []).join(' / '),
      c.comment || '',
      c.lastNote || '',
      c.createdAt || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cases]);

  const ownerList = useMemo(() => {
    const s = new Set(cases.map(c => c.owner).filter(Boolean));
    return [...s].sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    const f = filters;
    const filtered = cases.filter(c => {
      if (f.status && c.status !== f.status) return false;
      if (f.priority && c.priority !== f.priority) return false;
      if (f.owner && c.owner !== f.owner) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!`${c.title} ${c.company} ${c.comment} ${c.owner}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      const aT = new Date(a.due).getTime() || Infinity;
      const bT = new Date(b.due).getTime() || Infinity;
      return sortMode === 'dueAsc' ? aT - bT : bT - aT;
    });
  }, [cases, filters, sortMode]);

  const selectedCase = useMemo(
    () => filteredCases.find(c => c.id === selectedId) || filteredCases[0],
    [filteredCases, selectedId]
  );

  const progressColumns = useMemo(
    () => STATUS_COLUMNS.map(col => ({ ...col, items: filteredCases.filter(c => c.status === col.key) })),
    [filteredCases]
  );

  const summary = useMemo(() => {
    const total   = filteredCases.length;
    const high    = filteredCases.filter(c => c.priority === 'high').length;
    const overdue = filteredCases.filter(c => getDueState(c.due) === 'overdue').length;
    const dueSoon = filteredCases.filter(c => ['today', 'dueSoon'].includes(getDueState(c.due))).length;
    return { total, high, overdue, dueSoon };
  }, [filteredCases]);

  const upcomingCases = useMemo(() =>
    [...filteredCases]
      .filter(c => c.due && !Number.isNaN(new Date(c.due).getTime()))
      .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
      .slice(0, 5),
    [filteredCases]
  );

  const ownerStats = useMemo(() => {
    const bucket = {};
    filteredCases.forEach(c => {
      if (!c.owner) return;
      if (!bucket[c.owner]) bucket[c.owner] = { owner: c.owner, total: 0, high: 0 };
      bucket[c.owner].total += 1;
      if (c.priority === 'high') bucket[c.owner].high += 1;
    });
    return Object.values(bucket).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  const hasFilters = filters.status || filters.priority || filters.owner || filters.search;

  return (
    <div className="flex flex-col h-full bg-stone-50">

      {/* ヘッダー */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-slate-200/70 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center shadow-sm">
              <i className="fas fa-clipboard-list text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">CS案件管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">カスタマーサクセス案件の一元管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 rounded-xl overflow-hidden text-xs">
              <button
                className={`px-3 py-1.5 font-medium transition ${sortMode === 'dueAsc' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setSortMode('dueAsc')}
              >
                <i className="fas fa-sort-amount-up-alt mr-1.5"></i>期限が近い順
              </button>
              <button
                className={`px-3 py-1.5 font-medium transition ${sortMode === 'dueDesc' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setSortMode('dueDesc')}
              >
                <i className="fas fa-sort-amount-down-alt mr-1.5"></i>期限が遠い順
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:border-emerald-200 hover:text-emerald-600 transition shadow-sm"
            >
              <i className="fas fa-download text-[10px]"></i>CSVエクスポート
            </button>
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 shadow-sm transition"
            >
              <i className="fas fa-plus text-xs"></i>案件を追加
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">

        {/* KPI カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: '総案件数',    value: summary.total,   icon: 'fa-clipboard-list',    color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
            { label: '高優先度',    value: summary.high,    icon: 'fa-fire',               color: 'text-rose-600',    iconBg: 'bg-rose-50'    },
            { label: '期限超過',    value: summary.overdue, icon: 'fa-exclamation-circle', color: 'text-red-600',     iconBg: 'bg-red-50'     },
            { label: '7日以内期日', value: summary.dueSoon, icon: 'fa-clock',              color: 'text-amber-600',   iconBg: 'bg-amber-50'   },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <i className={`fas ${card.icon}`}></i>
              </div>
              <div>
                <p className={`text-2xl font-bold leading-tight ${card.color}`}>{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* フィルターバー */}
        <div className="bg-white border border-slate-200/60 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <i className="fas fa-filter text-emerald-500 text-xs"></i>フィルター
          </div>
          <select
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">全ステータス</option>
            {STATUS_COLUMNS.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
          </select>
          <select
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="">全優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.owner}
            onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))}
          >
            <option value="">全担当者</option>
            {ownerList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="relative flex items-center flex-1 min-w-[200px]">
            <i className="fas fa-search absolute left-3 text-slate-300 text-xs"></i>
            <input
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="案件名・会社名・コメントで検索"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          {hasFilters && (
            <button
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              onClick={() => setFilters({ status: '', priority: '', owner: '', search: '' })}
            >
              <i className="fas fa-times mr-1"></i>クリア
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400 font-medium">{filteredCases.length}件表示</span>
        </div>

        {/* 3カラムレイアウト */}
        <div className="grid gap-5 2xl:grid-cols-[240px_minmax(0,1fr)_300px]">

          {/* 左: ステップナビ */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm h-fit 2xl:sticky 2xl:top-24">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ステップナビ</p>
            <div className="space-y-2">
              {progressColumns.map((col, i) => {
                const ratio = filteredCases.length
                  ? Math.round((col.items.length / filteredCases.length) * 100)
                  : 0;
                const active = filters.status === col.key;
                return (
                  <button
                    key={col.key}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                      active ? 'border-emerald-200 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setFilters(f => ({ ...f, status: f.status === col.key ? '' : col.key }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">0{i + 1}</span>
                        <span className={`text-sm font-semibold ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{col.label}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.chip}`}>{col.items.length}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${active ? 'bg-emerald-400' : 'bg-slate-300'}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 中央: かんばん/リスト + インサイト */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {filters.status ? `${STATUS_META[filters.status]?.label} — ` : ''}{filteredCases.length}件
              </p>
              <div className="flex bg-slate-100 rounded-xl overflow-hidden text-xs">
                {[
                  { key: 'kanban', icon: 'fa-th-large', label: 'ボード' },
                  { key: 'list',   icon: 'fa-list',     label: 'リスト' },
                ].map(v => (
                  <button
                    key={v.key}
                    className={`px-3 py-1.5 font-medium flex items-center gap-1.5 transition ${
                      boardView === v.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setBoardView(v.key)}
                  >
                    <i className={`fas ${v.icon} text-[10px]`}></i>{v.label}
                  </button>
                ))}
              </div>
            </div>

            {boardView === 'kanban' ? (
              <div className="overflow-x-auto pb-2">
                <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3 min-w-[880px]">
                  {progressColumns.map(col => {
                    const meta = STATUS_META[col.key];
                    const overCap = meta.wip && col.items.length > meta.wip;
                    const wipRatio = meta.wip ? Math.min(100, Math.round((col.items.length / meta.wip) * 100)) : 0;
                    return (
                      <div
                        key={col.key}
                        className={`flex flex-col rounded-2xl border ${meta.border} bg-gradient-to-b ${meta.accent} p-3 gap-2 min-h-[200px]`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <i className={`fas ${meta.icon} text-slate-400 text-xs`}></i>
                            <span className="text-xs font-bold text-slate-700">{col.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {overCap && <span className="text-[10px] font-bold text-rose-500">WIP超!</span>}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.chip}`}>{col.items.length}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{meta.hint}</p>
                        {meta.wip && (
                          <div className="h-1 bg-white/70 rounded-full">
                            <div
                              className={`h-full rounded-full ${overCap ? 'bg-rose-400' : 'bg-emerald-400'}`}
                              style={{ width: `${wipRatio}%` }}
                            ></div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px]">
                          {col.items.map(item => (
                            <CaseCard
                              key={item.id}
                              item={item}
                              onSelect={setSelectedId}
                              isActive={selectedId ? selectedId === item.id : selectedCase?.id === item.id}
                              onEdit={it => setModal({ mode: 'edit', caseData: it })}
                              onAdvance={handleAdvanceStatus}
                            />
                          ))}
                          {col.items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                              <i className="fas fa-inbox text-2xl mb-2"></i>
                              <p className="text-xs">案件なし</p>
                            </div>
                          )}
                        </div>
                        <button
                          className="flex items-center justify-center gap-1 py-2 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/50 transition mt-auto"
                          onClick={() => setModal({ mode: 'add', defaultStatus: col.key })}
                        >
                          <i className="fas fa-plus text-[10px]"></i>追加
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {progressColumns.map(col => {
                  const meta = STATUS_META[col.key];
                  if (filters.status && filters.status !== col.key) return null;
                  return (
                    <div key={col.key} className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.chip}`}>{col.label}</span>
                          <span className="text-xs text-slate-400">{meta.hint}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{col.items.length}件</span>
                      </div>
                      <div className="space-y-2">
                        {col.items.length === 0 && <p className="text-xs text-slate-400 py-2">この段階の案件はありません</p>}
                        {col.items.map(item => (
                          <CompactCaseRow
                            key={item.id}
                            item={item}
                            onSelect={setSelectedId}
                            isActive={selectedId ? selectedId === item.id : selectedCase?.id === item.id}
                            onEdit={it => setModal({ mode: 'edit', caseData: it })}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* インサイトセクション */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">直近の期日案件</p>
                  <span className="text-xs text-slate-400">最大5件</span>
                </div>
                {upcomingCases.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">期限が設定された案件はありません</p>
                ) : (
                  <div className="space-y-1">
                    {upcomingCases.map(item => {
                      const dueState = getDueState(item.due);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full ${PRIORITY_META[item.priority]?.dot}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{item.title}</p>
                            <p className="text-xs text-slate-400">{STATUS_META[item.status]?.label} · {item.company}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${DUE_STYLES[dueState]}`}>
                            {formatRelativeDue(item.due)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">担当者別ワークロード</p>
                  <span className="text-xs text-slate-400">自動集計</span>
                </div>
                {ownerStats.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">担当データがありません</p>
                ) : (
                  <div className="space-y-3">
                    {ownerStats.map(stat => {
                      const maxTotal = ownerStats[0].total;
                      return (
                        <div key={stat.owner}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                                {stat.owner.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-700">{stat.owner}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              {stat.high > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-semibold">高優先 {stat.high}</span>
                              )}
                              <span className="font-bold text-slate-700">{stat.total}件</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all"
                              style={{ width: `${Math.round((stat.total / maxTotal) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右: 案件詳細パネル */}
          <div className="2xl:sticky 2xl:top-24 h-fit">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">案件詳細</p>
                {selectedCase && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModal({ mode: 'edit', caseData: selectedCase })}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600 transition"
                    >
                      <i className="fas fa-pen text-[10px]"></i>編集
                    </button>
                    <button
                      onClick={() => setDeleteTarget(selectedCase.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500 transition"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>削除
                    </button>
                  </div>
                )}
              </div>

              {selectedCase ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_META[selectedCase.status]?.chip}`}>
                      {STATUS_META[selectedCase.status]?.label}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_META[selectedCase.priority]?.badge}`}>
                      優先度：{PRIORITY_META[selectedCase.priority]?.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-base font-bold text-slate-800 leading-snug">{selectedCase.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedCase.company}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: '担当者', value: selectedCase.owner,                icon: 'fa-user'          },
                      { label: '期限',   value: formatDate(selectedCase.due),       icon: 'fa-calendar'      },
                      { label: '製品',   value: selectedCase.product || '―',        icon: 'fa-box'           },
                      { label: '作成日', value: formatDate(selectedCase.createdAt), icon: 'fa-calendar-plus' },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-2.5">
                        <p className="text-slate-400 flex items-center gap-1 mb-1">
                          <i className={`fas ${icon} text-[10px]`}></i>{label}
                        </p>
                        <p className="font-semibold text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedCase.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCase.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                    </div>
                  )}

                  {selectedCase.comment && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">備考・コメント</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {selectedCase.comment}
                      </p>
                    </div>
                  )}

                  {selectedCase.lastNote && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">最新メモ</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 rounded-xl p-3 border border-amber-100">
                        {selectedCase.lastNote}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-400 mb-2">ステータスを変更</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STATUS_COLUMNS.map(col => (
                        <button
                          key={col.key}
                          className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            selectedCase.status === col.key
                              ? `${col.chip} border-transparent shadow-sm`
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleAdvanceStatus(selectedCase.id, col.key)}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <i className="fas fa-mouse-pointer text-3xl mb-3"></i>
                  <p className="text-sm">案件をクリックして選択</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 案件追加/編集モーダル */}
      {modal && (
        <CaseFormModal
          initial={modal.mode === 'edit' ? modal.caseData : null}
          defaultStatus={modal.defaultStatus}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={modal.mode === 'edit' ? () => setDeleteTarget(modal.caseData.id) : null}
        />
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <i className="fas fa-trash-alt text-rose-500"></i>
              </div>
              <div>
                <p className="font-bold text-slate-800">案件を削除しますか？</p>
                <p className="text-xs text-slate-500 mt-0.5">この操作は元に戻せません</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-5">
              「{cases.find(c => c.id === deleteTarget)?.title}」を削除します
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition"
                onClick={() => handleDelete(deleteTarget)}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
