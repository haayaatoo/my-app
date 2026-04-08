import React, { createContext, useCallback, useContext, useRef, useState } from "react";

// ─── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

  const { addToast } = ctx;
  return {
    success: (msg, duration) => addToast(msg, "success", duration),
    error:   (msg, duration) => addToast(msg, "error",   duration ?? 5000),
    warning: (msg, duration) => addToast(msg, "warning", duration),
    info:    (msg, duration) => addToast(msg, "info",    duration),
  };
}

// ─── Container ───────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Item ────────────────────────────────────────────────────────────────────
const STYLES = {
  success: {
    bar:  "bg-emerald-500",
    icon: "fas fa-check-circle text-emerald-500",
    bg:   "bg-white border border-emerald-200",
  },
  error: {
    bar:  "bg-rose-500",
    icon: "fas fa-exclamation-circle text-rose-500",
    bg:   "bg-white border border-rose-200",
  },
  warning: {
    bar:  "bg-amber-400",
    icon: "fas fa-exclamation-triangle text-amber-500",
    bg:   "bg-white border border-amber-200",
  },
  info: {
    bar:  "bg-blue-500",
    icon: "fas fa-info-circle text-blue-500",
    bg:   "bg-white border border-blue-200",
  },
};

function ToastItem({ toast, onRemove }) {
  const s = STYLES[toast.type] ?? STYLES.info;
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl shadow-lg px-4 py-3 min-w-[280px] max-w-sm animate-slide-in-from-top ${s.bg}`}
    >
      {/* 左アクセントバー */}
      <div className={`absolute left-0 inset-y-0 w-[3px] rounded-l-xl ${s.bar}`} style={{ position: "relative", alignSelf: "stretch", width: "3px", borderRadius: "9999px", flexShrink: 0 }}></div>
      <i className={`${s.icon} text-base flex-shrink-0 mt-0.5`}></i>
      <span className="text-sm text-slate-700 flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5 transition-colors"
      >
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
}
