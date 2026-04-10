import React, { useState, useEffect, useRef } from "react";
import { useToast } from "./Toast";

const API_BASE = "/api";

const STATUS_CONFIG = {
  active:    { label: "参画中",   badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400" },
  planned:   { label: "開始予定", badge: "bg-blue-100 text-blue-700 border border-blue-200",         dot: "bg-blue-400" },
  completed: { label: "完了",     badge: "bg-slate-100 text-slate-600 border border-slate-200",       dot: "bg-slate-400" },
  suspended: { label: "中断",     badge: "bg-red-100 text-red-600 border border-red-200",             dot: "bg-red-400" },
};

const WORK_STYLE_CONFIG = {
  onsite: { label: "常駐",        icon: "fas fa-building" },
  remote: { label: "フルリモート", icon: "fas fa-home" },
  hybrid: { label: "ハイブリッド", icon: "fas fa-random" },
};

// ────────────────────────────────────────────────
// エンジニア検索コンボボックス
// ────────────────────────────────────────────────
const ENGINEER_STATUS_BADGE = {
  available:   { label: "稼働可",   color: "bg-emerald-100 text-emerald-700" },
  working:     { label: "稼働中",   color: "bg-blue-100 text-blue-700" },
  unavailable: { label: "稼働不可", color: "bg-slate-100 text-slate-500" },
};

function EngineerSearchBox({ engineers, selectedId, onChange, disabled, excludeIds = new Set() }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const selected = engineers.find((e) => String(e.id) === String(selectedId));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = engineers
    .filter((e) => !excludeIds.has(String(e.id)) || String(e.id) === String(selectedId))
    .filter((e) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        e.name?.toLowerCase().includes(q) ||
        e.engineer_status?.toLowerCase().includes(q) ||
        (e.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    });

  if (disabled && selected) {
    return (
      <div className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700">
        {selected.name}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mt-1">
      <div
        className={`flex items-center border rounded-lg px-3 py-2 bg-white gap-2 cursor-text ${
          open ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => { setOpen(true); }}
      >
        <i className="fas fa-search text-slate-400 text-xs flex-shrink-0"></i>
        <input
          className="flex-1 text-sm outline-none min-w-0 bg-transparent"
          placeholder={selected ? selected.name : "名前やスキルで検索..."}
          value={open ? query : (selected ? selected.name : "")}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        />
        {selected && !open && (
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); onChange(""); setQuery(""); }}
            className="text-slate-400 hover:text-red-500 text-xs transition-colors leading-none"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        {!selected && <i className="fas fa-chevron-down text-slate-300 text-xs"></i>}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* スクロール可能リスト */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                <i className="fas fa-search mr-1"></i>該当するエンジニアがいません
              </div>
            ) : (
              filtered.map((e) => {
                const badge = ENGINEER_STATUS_BADGE[e.engineer_status] || { label: e.engineer_status || "-", color: "bg-slate-100 text-slate-500" };
                const isSelected = String(e.id) === String(selectedId);
                return (
                  <button
                    key={e.id}
                    type="button"
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      isSelected ? "bg-amber-50" : "hover:bg-slate-50"
                    }`}
                    onMouseDown={(ev) => { ev.preventDefault(); onChange(String(e.id)); setOpen(false); setQuery(""); }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {e.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                      {(e.skills || []).length > 0 && (
                        <p className="text-[11px] text-slate-400 truncate">{(e.skills || []).slice(0, 4).join(" / ")}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                    {isSelected && <i className="fas fa-check text-amber-500 text-xs flex-shrink-0"></i>}
                  </button>
                );
              })
            )}
          </div>
          {filtered.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-right">
              {filtered.length}名表示
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 参画エンジニア行
// ────────────────────────────────────────────────
function AssignmentRow({ a, onEdit, onRemove }) {
  const today = new Date();
  const end = a.end_date ? new Date(a.end_date) : null;
  const isExpiringSoon = end && (end - today) / (1000 * 60 * 60 * 24) <= 30;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group">
      {/* アバター */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {a.engineer_name?.[0] || "?"}
      </div>

      {/* 名前・役割 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{a.engineer_name}</p>
        <p className="text-xs text-slate-400">{a.role || "役割未設定"}</p>
      </div>

      {/* スキル */}
      <div className="hidden xl:flex flex-wrap gap-1 max-w-[180px]">
        {(a.engineer_skills || []).slice(0, 3).map((s, i) => (
          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>

      {/* 参画期間 */}
      <div className="text-xs text-slate-500 whitespace-nowrap min-w-[140px] text-right">
        <span className="flex items-center gap-1 justify-end">
          <i className="fas fa-calendar-alt text-[10px] text-slate-400"></i>
          {a.start_date || "開始日未定"}
          <span className="text-slate-300">→</span>
          {a.end_date
            ? <span className={isExpiringSoon ? "text-amber-600 font-bold" : ""}>{a.end_date}</span>
            : <span className="text-slate-300">未定</span>
          }
        </span>
        {isExpiringSoon && (
          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 justify-end mt-0.5">
            <i className="fas fa-exclamation-triangle text-[9px]"></i>終了間近
          </span>
        )}
      </div>

      {/* 月単価 */}
      <div className="text-sm font-bold text-slate-700 whitespace-nowrap min-w-[80px] text-right">
        {a.monthly_rate
          ? `¥${Number(a.monthly_rate).toLocaleString()}`
          : <span className="text-slate-300 font-normal text-xs">単価未設定</span>}
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(a)}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 flex items-center justify-center transition-colors"
        >
          <i className="fas fa-pen text-[10px]"></i>
        </button>
        <button
          onClick={() => onRemove(a.id)}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors"
        >
          <i className="fas fa-times text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 案件詳細パネル
// ────────────────────────────────────────────────
function ProjectDetailPanel({ project, engineers, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);
  const [showAddEngineer, setShowAddEngineer] = useState(false);
  const [assignForm, setAssignForm] = useState({ engineer_id: "", start_date: "", end_date: "", monthly_rate: "", role: "", notes: "" });
  const [editingAssignment, setEditingAssignment] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setA = (k, v) => setAssignForm((f) => ({ ...f, [k]: v }));

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onUpdate(await res.json()); setEditing(false); }
    } finally { setSaving(false); }
  };

  const handleAddAssignment = async () => {
    if (!assignForm.engineer_id) return;
    setSaving(true);
    try {
      const body = editingAssignment
        ? { ...assignForm, is_active: true }
        : assignForm;
      const res = await fetch(`${API_BASE}/projects/${project.id}/add_assignment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onUpdate(await res.json());
        setAssignForm({ engineer_id: "", start_date: "", end_date: "", monthly_rate: "", role: "", notes: "" });
        setShowAddEngineer(false);
        setEditingAssignment(null);
      }
    } finally { setSaving(false); }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("この参画情報を削除しますか？")) return;
    const res = await fetch(`${API_BASE}/projects/${project.id}/remove_assignment/${assignmentId}/`, { method: "DELETE" });
    if (res.ok) onUpdate(await res.json());
  };

  const handleEditAssignment = (a) => {
    setEditingAssignment(a);
    setAssignForm({ engineer_id: String(a.engineer), start_date: a.start_date || "", end_date: a.end_date || "", monthly_rate: a.monthly_rate || "", role: a.role || "", notes: a.notes || "" });
    setShowAddEngineer(true);
  };

  const st = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const ws = WORK_STYLE_CONFIG[project.work_style];
  const totalRate = project.assignments?.reduce((s, a) => s + Number(a.monthly_rate || 0), 0) || 0;
  const activeCount = project.assignments?.filter((a) => a.is_active).length || 0;

  // 既に参画中のエンジニアIDリスト
  const assignedIds = new Set(project.assignments?.map((a) => String(a.engineer)) || []);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* ヘッダー */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-700 text-white flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                className="font-bold text-lg bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 w-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            ) : (
              <h2 className="font-bold text-lg leading-snug truncate">{project.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-2">
              <i className="fas fa-building text-white/50 text-sm"></i>
              <span className="text-white/80 text-sm font-medium">{project.client_company}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge} ml-1`}>{st.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="ml-4 text-white/60 hover:text-white text-xl transition-colors flex-shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* サマリー数値 */}
        <div className="flex gap-5 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xl font-bold">{activeCount}</p>
            <p className="text-[10px] text-white/50">参画中</p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {totalRate > 0 ? `¥${Math.round(totalRate / 10000)}万` : "-"}
            </p>
            <p className="text-[10px] text-white/50">月単価合計</p>
          </div>
          {project.start_date && (
            <div>
              <p className="text-base font-bold">{project.start_date}</p>
              <p className="text-[10px] text-white/50">開始日</p>
            </div>
          )}
          {project.end_date && (
            <div>
              <p className="text-base font-bold">{project.end_date}</p>
              <p className="text-[10px] text-white/50">終了予定日</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 案件情報 */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">案件情報</h3>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={handleSaveProject} disabled={saving} className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? "保存中..." : "保存"}
                </button>
                <button onClick={() => { setEditing(false); setForm({ ...project }); }} className="text-xs border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                  キャンセル
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <i className="fas fa-pen text-[10px]"></i>編集
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">ステータス</label>
                  <select className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">勤務形態</label>
                  <select className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white" value={form.work_style || ""} onChange={(e) => set("work_style", e.target.value)}>
                    <option value="">未設定</option>
                    {Object.entries(WORK_STYLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">開始日</label>
                  <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">終了予定日</label>
                  <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">就業場所</label>
                <input className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" value={form.location || ""} onChange={(e) => set("location", e.target.value)} placeholder="例: 名古屋市中村区" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">客先担当者</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input className="text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="担当者名" value={form.client_contact || ""} onChange={(e) => set("client_contact", e.target.value)} />
                  <input className="text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="メール" value={form.client_contact_email || ""} onChange={(e) => set("client_contact_email", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">案件詳細</label>
                <textarea rows={3} className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none" value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">備考</label>
                <textarea rows={2} className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {ws && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className={`${ws.icon} text-slate-400 w-4 text-center`}></i>
                    <span>{ws.label}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-map-marker-alt text-slate-400 w-4 text-center"></i>
                    <span>{project.location}</span>
                  </div>
                )}
                {project.client_contact && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-user-tie text-slate-400 w-4 text-center"></i>
                    <span>{project.client_contact}</span>
                  </div>
                )}
                {project.client_contact_email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-envelope text-slate-400 w-4 text-center"></i>
                    <span className="truncate">{project.client_contact_email}</span>
                  </div>
                )}
              </div>
              {project.description && (
                <p className="text-slate-600 mt-2 border-t border-slate-100 pt-2 leading-relaxed">{project.description}</p>
              )}
              {project.notes && (
                <p className="text-slate-500 text-xs bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">{project.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* 参画エンジニア一覧 */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              参画エンジニア <span className="text-slate-600 normal-case font-semibold">{project.assignments?.length || 0}名</span>
            </h3>
            <button
              onClick={() => { setShowAddEngineer(!showAddEngineer); setEditingAssignment(null); setAssignForm({ engineer_id: "", start_date: "", end_date: "", monthly_rate: "", role: "", notes: "" }); }}
              className="text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <i className="fas fa-user-plus text-[10px]"></i> 追加
            </button>
          </div>

          {/* エンジニア追加フォーム */}
          {showAddEngineer && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-bold text-amber-700 mb-3">{editingAssignment ? "参画情報を編集" : "エンジニアを参画登録"}</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">エンジニア *</label>
                  <EngineerSearchBox
                    engineers={engineers}
                    selectedId={assignForm.engineer_id}
                    onChange={(id) => setA("engineer_id", id)}
                    disabled={!!editingAssignment}
                    excludeIds={editingAssignment ? new Set() : assignedIds}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">参画開始日</label>
                    <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" value={assignForm.start_date} onChange={(e) => setA("start_date", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">参画終了予定日</label>
                    <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" value={assignForm.end_date} onChange={(e) => setA("end_date", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">月単価（円）</label>
                    <input type="number" className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="例: 700000" value={assignForm.monthly_rate} onChange={(e) => setA("monthly_rate", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">役割</label>
                    <input className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="例: PL, PG" value={assignForm.role} onChange={(e) => setA("role", e.target.value)} />
                  </div>
                </div>
                <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" placeholder="備考（任意）" value={assignForm.notes} onChange={(e) => setA("notes", e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={handleAddAssignment} disabled={saving || !assignForm.engineer_id} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-40 transition-colors">
                    {saving ? "登録中..." : editingAssignment ? "更新" : "参画登録"}
                  </button>
                  <button onClick={() => { setShowAddEngineer(false); setEditingAssignment(null); }} className="px-4 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50">キャンセル</button>
                </div>
              </div>
            </div>
          )}

          {/* エンジニア一覧 */}
          <div className="space-y-1">
            {(!project.assignments || project.assignments.length === 0) && (
              <div className="text-center py-8 text-slate-300 text-sm">
                <i className="fas fa-users text-3xl mb-2 block"></i>
                参画エンジニアがいません
              </div>
            )}
            {(project.assignments || []).map((a) => (
              <AssignmentRow key={a.id} a={a} onEdit={handleEditAssignment} onRemove={handleRemoveAssignment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 案件カード（左パネル一覧用）
// ────────────────────────────────────────────────
function ProjectCard({ project, isSelected, onClick }) {
  const st = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const activeCount = project.assignments?.filter((a) => a.is_active).length || 0;

  return (
    <div
      className={`rounded-xl p-4 cursor-pointer transition-all duration-150 border ${
        isSelected
          ? "bg-slate-800 border-slate-600 shadow-lg"
          : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`font-semibold text-sm leading-snug line-clamp-2 flex-1 ${isSelected ? "text-white" : "text-slate-800"}`}>
          {project.title}
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 ${isSelected ? "bg-white/10 text-white border border-white/20" : st.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : st.dot}`}></span>
          {st.label}
        </span>
      </div>

      <div className={`flex items-center gap-3 text-xs mt-2 ${isSelected ? "text-white/60" : "text-slate-400"}`}>
        <span className="flex items-center gap-1">
          <i className="fas fa-users text-[9px]"></i>{activeCount}名参画
        </span>
        {project.start_date && (
          <span className="flex items-center gap-1">
            <i className="fas fa-calendar-alt text-[9px]"></i>{project.start_date}
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 新規案件作成モーダル
// ────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreate, defaultClient }) {
  const [form, setForm] = useState({
    title: "", client_company: defaultClient || "", status: "active",
    start_date: "", end_date: "", description: "", location: "",
    work_style: "onsite", client_contact: "", client_contact_email: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.client_company) return;
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center gap-2">
            <i className="fas fa-folder-plus text-amber-400"></i> 新規案件を登録
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl"><i className="fas fa-times"></i></button>
        </div>
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">案件名 *</label>
            <input className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="例: 株式会社〇〇 基幹システム開発" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">元請企業名 *</label>
            <input className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="例: 株式会社〇〇" value={form.client_company} onChange={(e) => set("client_company", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ステータス</label>
              <select className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">勤務形態</label>
              <select className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white" value={form.work_style} onChange={(e) => set("work_style", e.target.value)}>
                <option value="">未設定</option>
                {Object.entries(WORK_STYLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">開始日</label>
              <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">終了予定日</label>
              <input type="date" className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">就業場所</label>
            <input className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5" placeholder="例: 名古屋市中村区" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">客先担当者</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input className="text-sm border border-slate-200 rounded-xl px-3 py-2.5" placeholder="担当者名" value={form.client_contact} onChange={(e) => set("client_contact", e.target.value)} />
              <input className="text-sm border border-slate-200 rounded-xl px-3 py-2.5" placeholder="メールアドレス" value={form.client_contact_email} onChange={(e) => set("client_contact_email", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">案件詳細</label>
            <textarea rows={3} className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none" placeholder="案件の概要・必要スキルなど" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleCreate} disabled={saving || !form.title || !form.client_company} className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">
            {saving ? "登録中..." : "案件を登録"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50">キャンセル</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// メインコンポーネント：ClientProjectManager
// ────────────────────────────────────────────────
export default function ClientProjectManager() {
  const toast = useToast();
  const [byClient, setByClient] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientKey, setSelectedClientKey] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    try {
      const [clientRes, engRes] = await Promise.all([
        fetch(`${API_BASE}/projects/by_client/`),
        fetch(`${API_BASE}/engineers/`),
      ]);
      if (clientRes.ok) {
        const data = await clientRes.json();
        setByClient(data);
      }
      if (engRes.ok) setEngineers(await engRes.json());
    } catch (e) {
      console.error("データ取得エラー:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/`);
      if (res.ok) setAllProjects(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    fetchAllProjects();
  }, []);

  const handleCreateProject = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, required_skills: [] }),
      });
      if (res.ok) {
        const created = await res.json();
        setShowNewProject(false);
        await fetchData();
        await fetchAllProjects();
        // 作成した案件の元請企業を自動選択して中央・右ペインに表示
        setSelectedClientKey(created.client_company);
        setSelectedProject(created);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("案件登録失敗:", res.status, err);
        toast.error(`案件の登録に失敗しました (${res.status})`);
      }
    } catch (e) { console.error("案件登録エラー:", e); }
  };

  const handleUpdateProject = (updated) => {
    // selectedProjectを更新
    setSelectedProject(updated);
    // byClientを更新
    setByClient((prev) =>
      prev.map((client) => ({
        ...client,
        projects: client.projects.map((p) => p.id === updated.id ? updated : p),
      }))
    );
    fetchData();
  };

  // フィルタリング
  const filteredClients = byClient.filter((c) => {
    if (clientSearch && !c.client_company.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    if (statusFilter) {
      const hasStatus = c.projects.some((p) => p.status === statusFilter);
      if (!hasStatus) return false;
    }
    return true;
  });

  const selectedClientData = byClient.find((c) => c.client_company === selectedClientKey);

  // サマリー集計
  const totalClients = byClient.length;
  const totalProjects = byClient.reduce((s, c) => s + c.projects.length, 0);
  const activeProjects = byClient.reduce((s, c) => s + c.projects.filter((p) => p.status === "active").length, 0);
  const totalEngineers = byClient.reduce((s, c) => s + c.projects.reduce((ss, p) => ss + (p.active_engineer_count || 0), 0), 0);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-stone-50 via-slate-50 to-slate-100">
      {/* ページヘッダー */}
      <div className="px-6 py-4 border-b border-white/60 bg-white/70 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
              <i className="fas fa-sitemap text-white text-sm"></i>
            </div>
            元請案件管理
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">参画中・参画予定のプロジェクトとエンジニア配置を管理します</p>
        </div>

        {/* サマリー */}
        <div className="flex items-center gap-6 mr-4">
          {[
            { label: "元請企業", value: totalClients, icon: "fas fa-building" },
            { label: "案件数", value: totalProjects, icon: "fas fa-folder" },
            { label: "参画中", value: activeProjects, icon: "fas fa-play-circle", color: "text-emerald-600" },
            { label: "参画エンジニア", value: totalEngineers, icon: "fas fa-users", color: "text-amber-600" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className={`text-xl font-bold ${item.color || "text-slate-800"}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-center">
                <i className={`${item.icon} text-[9px]`}></i>{item.label}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setModalKey((k) => k + 1); setShowNewProject(true); }}
          className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <i className="fas fa-folder-plus"></i> 案件登録
        </button>
      </div>

      {/* メイン3ペインレイアウト */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── 左パネル：元請企業一覧 ── */}
        <div className="w-64 flex-shrink-0 border-r border-white/60 bg-white/50 flex flex-col overflow-hidden">
          {/* 検索 */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-slate-400"
                placeholder="企業名を検索..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
            <select
              className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">すべてのステータス</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* 企業リスト */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center py-8 text-slate-300 text-xs animate-pulse">読み込み中...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-slate-300 text-xs">
                <i className="fas fa-building text-3xl mb-2 block"></i>
                企業がありません
              </div>
            ) : filteredClients.map((client) => (
              <button
                key={client.client_company}
                onClick={() => { setSelectedClientKey(client.client_company); setSelectedProject(null); }}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 ${
                  selectedClientKey === client.client_company
                    ? "bg-slate-800 text-white shadow-md"
                    : "hover:bg-white hover:shadow-sm text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedClientKey === client.client_company ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {client.client_company[0]}
                    </div>
                    <span className="font-semibold text-xs truncate">{client.client_company}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${selectedClientKey === client.client_company ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {client.projects.length}件
                    </span>
                    {client.active_count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${selectedClientKey === client.client_company ? "bg-emerald-500/30 text-emerald-200" : "bg-emerald-100 text-emerald-600"}`}>
                        {client.active_count}参画中
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 中央パネル：案件一覧 ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/60">
          {selectedClientData ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 bg-white/60 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-building text-slate-400 text-sm"></i>
                    {selectedClientData.client_company}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedClientData.projects.length}案件 · {selectedClientData.total_engineers}名参画
                  </p>
                </div>
                <button
                  onClick={() => { setModalKey((k) => k + 1); setShowNewProject(true); }}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                >
                  <i className="fas fa-plus text-[10px]"></i> この企業に案件追加
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedClientData.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={selectedProject?.id === project.id}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <i className="fas fa-hand-pointer text-5xl mb-4"></i>
              <p className="text-sm font-medium">左から元請企業を選択してください</p>
            </div>
          )}
        </div>

        {/* ── 右パネル：案件詳細 ── */}
        <div className="w-[480px] flex-shrink-0 overflow-hidden">
          {selectedProject ? (
            <ProjectDetailPanel
              key={selectedProject.id}
              project={selectedProject}
              engineers={engineers}
              onClose={() => setSelectedProject(null)}
              onUpdate={handleUpdateProject}
            />
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-300 bg-white/30">
              <i className="fas fa-folder-open text-5xl mb-4"></i>
              <p className="text-sm font-medium">案件を選択すると詳細が表示されます</p>
            </div>
          )}
        </div>

      </div>

      {/* 新規案件モーダル */}
      {showNewProject && (
        <NewProjectModal
          key={modalKey}
          onClose={() => setShowNewProject(false)}
          onCreate={handleCreateProject}
          defaultClient={selectedClientKey || ""}
        />
      )}
    </div>
  );
}
